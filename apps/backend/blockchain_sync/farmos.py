import requests
import logging
from django.conf import settings
from .models import Plot, FarmerProfile, FarmEvent

logger = logging.getLogger(__name__)

class FarmOSClient:
    """
    Client for interacting with farmOS JSON:API.
    """
    def __init__(self):
        self.base_url = getattr(settings, 'FARMOS_URL', '').rstrip('/')
        self.api_key = getattr(settings, 'FARMOS_API_KEY', '')
        self.headers = {
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
            'X-API-KEY': self.api_key # Assuming API Key auth for now
        }

    def fetch_land_assets(self):
        """Fetch land assets (plots) from farmOS."""
        url = f"{self.base_url}/api/asset/land"
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json().get('data', [])
        except Exception as e:
            logger.error(f"Failed to fetch land assets from farmOS: {e}")
            return []

    def sync_plots(self):
        """Synchronize farmOS land assets with local Plot models."""
        land_assets = self.fetch_land_assets()
        synced_count = 0
        
        for asset in land_assets:
            attributes = asset.get('attributes', {})
            name = attributes.get('name')
            geometry = attributes.get('intrinsic_geometry', {}).get('value')
            
            # farmOS uses WKT for geometry in attributes usually, or GeoJSON in some versions
            # For Alpha, we expect GeoJSON or WKT. Django's GEOSGeometry can handle both.
            if not geometry:
                continue
                
            # Extract farmer ID from metadata or fallback to a default
            # In farmOS, relationships are often under 'relationships' -> 'owner' -> 'data' -> 'id'
            # Or stored in 'notes'/'description' for simple setups. We'll look for an intrinsic 'farmer_id' custom field
            farmer_uuid = attributes.get('farmer_id')
            
            if farmer_uuid:
                farmer = FarmerProfile.objects.filter(id=farmer_uuid).first()
            else:
                farmer = FarmerProfile.objects.first()
                if not farmer:
                    continue

            plot, created = Plot.objects.update_or_create(
                name=name,
                defaults={
                    'farmer': farmer,
                    'boundary': geometry,
                    'is_eudr_compliant': True, # Default to compliant for now
                }
            )
            synced_count += 1
            
        return synced_count

    def fetch_logs(self, log_type="activity"):
        """Fetch logs (activities, observations, harvests) from farmOS."""
        url = f"{self.base_url}/api/log/{log_type}"
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json().get('data', [])
        except Exception as e:
            logger.error(f"Failed to fetch {log_type} logs from farmOS: {e}")
            return []

    def sync_logs(self):
        """Synchronize farmOS activity logs with local FarmEvent models."""
        logs = self.fetch_logs(log_type="activity")
        synced_count = 0
        
        for log in logs:
            attributes = log.get('attributes', {})
            farmos_uuid = log.get('id')
            name = attributes.get('name', '')
            timestamp = attributes.get('timestamp')
            status = attributes.get('status')
            notes = attributes.get('notes', '')
            
            if status != 'done':
                continue
                
            # Naive type mapping
            event_type = 'OTHER'
            name_lower = name.lower()
            if 'plant' in name_lower: event_type = 'PLANTING'
            elif 'spray' in name_lower: event_type = 'SPRAYING'
            elif 'harvest' in name_lower: event_type = 'HARVESTING'
            elif 'inspect' in name_lower: event_type = 'INSPECTION'
            
            # Find the linked asset (plot)
            relationships = log.get('relationships', {})
            asset_data = relationships.get('asset', {}).get('data', [])
            if not asset_data:
                continue
                
            # Just take the first linked asset for simplicity
            asset_id = asset_data[0].get('id')
            plot = Plot.objects.filter(name__icontains=asset_id).first() # Fallback lookup
            if not plot:
                plot = Plot.objects.first()
                
            if not plot:
                continue

            event, created = FarmEvent.objects.update_or_create(
                farmos_uuid=farmos_uuid,
                defaults={
                    'event_type': event_type,
                    'plot': plot,
                    'farmer': plot.farmer,
                    'notes': notes,
                }
            )
            if timestamp:
                event.timestamp = timestamp
                event.save()
            synced_count += 1
            
        return synced_count
