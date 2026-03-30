import requests
import os
import base64
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MpesaClient:
    """
    Client for interacting with Safaricom Daraja API (M-Pesa).
    """
    def __init__(self):
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.env = os.getenv("MPESA_ENV", "sandbox")
        
        if self.env == "sandbox":
            self.base_url = "https://sandbox.safaricom.co.ke"
        else:
            self.base_url = "https://api.safaricom.co.ke"

    def get_access_token(self):
        """
        Retrieves OAuth2 access token.
        """
        api_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        try:
            res = requests.get(api_url, auth=(self.consumer_key, self.consumer_secret))
            res.raise_for_status()
            return res.json().get("access_token")
        except Exception as e:
            logger.error(f"Failed to get M-Pesa access token: {e}")
            return None

    def trigger_b2c_payout(self, payout_record, remarks, occasion):
        """
        Triggers a Business to Customer (B2C) payout.
        """
        access_token = self.get_access_token()
        if not access_token:
            return {"success": False, "error": "Auth failure"}

        api_url = f"{self.base_url}/mpesa/b2c/v1/paymentrequest"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        payload = {
            "InitiatorName": os.getenv("MPESA_INITIATOR_NAME"),
            "SecurityCredential": os.getenv("MPESA_SECURITY_CREDENTIAL"),
            "CommandID": "BusinessPayment",
            "Amount": int(payout_record.amount_kes),
            "PartyA": os.getenv("MPESA_SHORTCODE"),
            "PartyB": payout_record.phone_number,
            "Remarks": remarks,
            "QueueTimeOutURL": os.getenv("MPESA_CALLBACK_URL"),
            "ResultURL": os.getenv("MPESA_CALLBACK_URL"),
            "Occasion": occasion
        }

        try:
            res = requests.post(api_url, json=payload, headers=headers)
            res.raise_for_status()
            response_data = res.json()
            
            # Update payout record with conversation IDs for callback matching
            payout_record.originator_conversation_id = response_data.get("OriginatorConversationID")
            payout_record.conversation_id = response_data.get("ConversationID")
            payout_record.status = 'INITIATED'
            payout_record.initiated_at = datetime.now()
            payout_record.save()
            
            return {"success": True, "data": response_data}
        except Exception as e:
            logger.error(f"M-Pesa B2C Payout failed: {e}")
            payout_record.status = 'FAILED'
            payout_record.failure_reason = str(e)
            payout_record.save()
            return {"success": False, "error": str(e)}

# Lazy singleton pattern to avoid blocking Django startup
_mpesa_client = None

def get_mpesa_client():
    global _mpesa_client
    if _mpesa_client is None:
        logger.debug("Initializing MpesaClient singleton...")
        _mpesa_client = MpesaClient()
    return _mpesa_client

# For backward compatibility with existing imports
class MpesaClientProxy:
    def __getattr__(self, name):
        return getattr(get_mpesa_client(), name)

mpesa_client = MpesaClientProxy()
