import os
import django
import sys
import json
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from blockchain_sync.mpesa import mpesa_client
from blockchain_sync.models import MpesaPayout, OnChainHarvest

def run_mpesa_test():
    print("Testing M-Pesa sandbox integration...")
    print(f"Using Consumer Key: {os.getenv('MPESA_CONSUMER_KEY')}")
    
    # 1. Test Auth
    token = mpesa_client.get_access_token()
    if not token:
        print("❌ Auth failed. Please check M-Pesa credentials.")
        return
    
    print(f"✅ Auth successful. Token obtained: {token[:10]}...")
    
    # 2. Test B2C Payout
    try:
        # Create a dummy harvest first since it's a 1-to-1 required field
        dummy_harvest = OnChainHarvest.objects.create(
            record_id=999999,
            farmer_address="0xTestAddressForMpesaValidation",
            crop_type="Coffee",
            weight_kg=10.0,
            location="Test Sandbox"
        )
        
        # Avoid creating duplicates if testing repeatedly
        payout = MpesaPayout.objects.create(
            harvest=dummy_harvest,
            phone_number="254708374149",
            amount_kes=100.00,
            conversion_rate=130.50,
            status='PENDING',
        )
        print("Created dummy MpesaPayout record ID:", payout.id)
        
        print("Triggering B2C payout...")
        res = mpesa_client.trigger_b2c_payout(payout, remarks="Test Payout", occasion="Bonus")
        
        print("Payout Response:", json.dumps(res, indent=2))
        
        if res.get("success"):
            print("✅ B2C Payout triggered successfully.")
        else:
            print("❌ B2C Payout failed.")
            
        # Cleanup
        payout.delete()
        dummy_harvest.delete()
    except Exception as e:
        print("❌ Error during payout:", e)

if __name__ == "__main__":
    run_mpesa_test()
