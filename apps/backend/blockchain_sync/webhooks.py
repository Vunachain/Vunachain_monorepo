import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def dispatch_webhook(event_type, payload):
    """
    Sends a POST request to a configured external endpoint.
    In a production system, this would use a queue (Celery) and 
    support multiple subscriber URLs.
    """
    # For Alpha, we'll use a single configured URL or a placeholder
    webhook_url = getattr(settings, 'VUNACHAIN_WEBHOOK_URL', None)
    
    if not webhook_url:
        logger.warning(f"Webhook URL not configured. Dropping event: {event_type}")
        return False
        
    try:
        response = requests.post(
            webhook_url,
            json={
                "event": event_type,
                "payload": payload
            },
            timeout=5
        )
        response.raise_for_status()
        logger.info(f"Webhook dispatched successfully: {event_type}")
        return True
    except Exception as e:
        logger.error(f"Webhook dispatch failed for {event_type}: {e}")
        return False
