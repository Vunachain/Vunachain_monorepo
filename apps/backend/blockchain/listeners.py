import asyncio
import json
import logging
import os
import websockets
from django.conf import settings
from .provider import celo_provider
from .constants import HARVEST_VERIFIED_TOPIC, TRACEABILITY_ADDRESS_SEPOLIA, get_traceability_abi
from config.utils import get_cusd_kes_rate

logger = logging.getLogger(__name__)

async def blockchain_listener():
    """
    WebSocket listener for Celo blockchain events with exponential backoff.
    """
    network = celo_provider.network
    if network == "mainnet":
        ws_url = settings.CELO_WEBSOCKET_URL
        contract_address = os.getenv("TRACEABILITY_ADDRESS_MAINNET")
    else:
        ws_url = settings.CELO_SEPOLIA_WEBSOCKET_URL
        contract_address = TRACEABILITY_ADDRESS_SEPOLIA

    retry_delay = 1
    max_delay = 60

    while True:
        try:
            logger.info(f"Connecting to Celo blockchain listener on {ws_url}...")
            async with websockets.connect(ws_url) as ws:
                # Reset retry delay on successful connection
                retry_delay = 1
                
                # Subscribe to logs for our Traceability contract
                subscribe_msg = {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "eth_subscribe",
                    "params": ["logs", {"address": contract_address}] 
                }
                await ws.send(json.dumps(subscribe_msg))
                subscription_response = await ws.recv()
                logger.info(f"Subscription successful: {subscription_response}")

                while True:
                    message = await ws.recv()
                    event_data = json.loads(message)
                    
                    result = event_data.get('params', {}).get('result', {})
                    topics = result.get('topics', [])
                    
                    if topics:
                        topic0 = topics[0]
                        if topic0 == HARVEST_VERIFIED_TOPIC:
                            # V1/V2 HarvestVerified (recordId matches)
                            record_id = int(topics[1], 16)
                            on_harvest_verified(record_id, result)
                        elif topic0 == "0xe75851eccf8ce8120445430ba924915befcd02a9e453f3e47dfd0ad3b862640e": # BATCH_PAYOUT_CREATED_V2_TOPIC
                            merkle_root = topics[1]
                            on_batch_payout_created(merkle_root, result)
                        elif topic0 == "0x42bedcec4b68e4a8fa2eab357829ddeb2f05b2bf2dd3d45d211f4a3430cd8c": # PAYOUT_CLAIMED_TOPIC
                            record_id = int(topics[1], 16)
                            on_payout_claimed(record_id, result)
                    
                    logger.debug(f"Received blockchain event: {event_data}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.error(f"WebSocket connection closed. Reconnecting in {retry_delay}s...")
        except Exception as e:
            logger.error(f"Error in blockchain listener: {e}. Reconnecting in {retry_delay}s...")
            
        await asyncio.sleep(retry_delay)
        retry_delay = min(retry_delay * 2, max_delay)

async def on_batch_payout_created(merkle_root, event_result):
    """
    Triggered when a BatchPayoutCreated event is detected on-chain.
    """
    from blockchain_sync.models import MerkleBatchModel
    logger.info(f"Batch Payout Created: {merkle_root}! Updating status...")
    MerkleBatchModel.objects.filter(merkle_root__iexact=merkle_root).update(
        status='CONFIRMED',
        transaction_hash=event_result.get('transactionHash')
    )

def on_payout_claimed(record_id, event_result):
    """
    Triggered when a PayoutClaimed event is detected on-chain.
    """
    from blockchain_sync.models import OnChainHarvest
    logger.info(f"Payout Claimed for Record ID: {record_id}! Updating status...")
    OnChainHarvest.objects.filter(record_id=record_id).update(
        status=3, # Paid
        transaction_hash=event_result.get('transactionHash')
    )

def on_harvest_verified(record_id, event_result):
    """
    Triggered when a HarvestVerified event is detected on-chain.
    """
    from blockchain_sync.models import OnChainHarvest, FarmerProfile, MpesaPayout
    from django.utils import timezone
    
    logger.info(f"Harvest Verified for Record ID: {record_id}! Fetching details...")
    
    try:
        # Use V2 contract if available
        from .constants import TRACEABILITY_V2_ADDRESS_SEPOLIA, get_traceability_v2_abi
        
        # Check if we should use V1 or V2
        # For now, let's try V2 first if address is set
        v2_address = os.getenv("TRACEABILITY_V2_ADDRESS_SEPOLIA")
        if v2_address:
            contract = celo_provider.get_contract(v2_address, get_traceability_v2_abi())
        else:
            contract = celo_provider.get_traceability_contract()
            
        record_data = contract.functions.records(record_id).call()
        farmer_address = record_data[0]
        
        harvest, created = OnChainHarvest.objects.update_or_create(
            record_id=record_id,
            defaults={
                'farmer_address': farmer_address,
                'farmer_id': record_data[1],
                'crop_type': record_data[2],
                'weight_kg': record_data[3],
                'location': record_data[4],
                'status': record_data[6],
                'payout_amount_cusd': record_data[7],
                'transaction_hash': event_result.get('transactionHash'),
                'verified_at': timezone.now()
            }
        )
        
        # If record is verified and NOT part of a Merkle batch, trigger direct M-Pesa payout
        # If it IS part of a batch, wait for the farmer to claim via M-Pesa integration (Phase 4)
        if harvest.status == 1 and not harvest.batch:
            # Resolve farmer phone number from profile
            profile = FarmerProfile.objects.filter(celo_address__iexact=farmer_address).first()
            
            if not profile:
                logger.error(f"Cannot trigger payout for record {record_id}: No FarmerProfile found for {farmer_address}")
                return

            phone_number = profile.phone_number
            # Fetch live exchange rate
            rate = get_cusd_kes_rate()
            kes_amount = float(harvest.payout_amount_cusd) * rate
            
            payout, p_created = MpesaPayout.objects.get_or_create(
                harvest=harvest,
                defaults={
                    'phone_number': phone_number,
                    'amount_kes': kes_amount,
                    'status': 'PENDING',
                    'conversion_rate': rate,
                    'initiated_at': timezone.now()
                }
            )
            
            logger.info(f"Triggering direct M-Pesa payout of {kes_amount} KES to {phone_number}...")
            from blockchain_sync.mpesa import mpesa_client
            
            response = mpesa_client.trigger_b2c_payout(
                payout, 
                f"Vunachain Payout {record_id}", 
                "Harvest Verified"
            )
            
            if response.get("success"):
                # originator_conversation_id is now updated inside trigger_b2c_payout
                logger.info(f"M-Pesa payout successfully initiated for harvest {record_id}")
            else:
                payout.status = 'FAILED'
                payout.failure_reason = response.get("error")
                payout.save()
                logger.error(f"M-Pesa payout failed for harvest {record_id}: {response.get('error')}")

    except Exception as e:
        logger.error(f"Failed to process HarvestVerified for {record_id}: {e}")
