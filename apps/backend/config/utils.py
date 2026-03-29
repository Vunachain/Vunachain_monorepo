import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_cusd_kes_rate():
    """
    Fetches the current cUSD to KES exchange rate.
    Uses cUSD/USD parity and then USD/KES rate.
    Fallback to 130.0 if API fails.
    """
    try:
        # For simplicity in this demo, we use a public API for USD/KES
        # In production, use a more reliable source or Celo-specific oracle
        response = requests.get("https://open.er-api.com/v6/latest/USD")
        if response.status_code == 200:
            data = response.json()
            rate = data.get("rates", {}).get("KES")
            if rate:
                logger.info(f"Fetched live USD/KES rate: {rate}")
                return float(rate)
    except Exception as e:
        logger.error(f"Failed to fetch live exchange rate: {e}")
    
    logger.warning("Using fallback exchange rate: 130.0")
    return 130.0
