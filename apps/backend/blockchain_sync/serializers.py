from rest_framework import serializers
from .models import OnChainHarvest, MerkleBatchModel, FarmerProfile, Plot, FarmEvent

class PublicFarmerProfileSerializer(serializers.ModelSerializer):
    """Safe metadata for public view."""
    class Meta:
        model = FarmerProfile
        fields = ['id', 'is_verified', 'created_at']

class AuditorFarmerProfileSerializer(serializers.ModelSerializer):
    """Full PII for authorized auditors."""
    class Meta:
        model = FarmerProfile
        fields = [
            'id', 'celo_address', 'full_name', 'phone_number', 
            'national_id', 'kyc_data', 'credit_score', 
            'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'credit_score', 'is_verified', 'created_at']

class MerkleBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerkleBatchModel
        fields = ['merkle_root', 'total_records', 'total_amount_cusd', 'transaction_hash', 'status', 'is_distributed', 'created_at']

class OnChainHarvestSerializer(serializers.ModelSerializer):
    batch_details = MerkleBatchSerializer(source='batch', read_only=True)
    
    class Meta:
        model = OnChainHarvest
        fields = [
            'record_id', 'farmer_address', 'crop_type', 'weight_kg', 
            'location', 'status', 'payout_amount_cusd', 'verified_at', 
            'transaction_hash', 'merkle_proof', 'batch_details', 'created_at'
        ]

class PublicPlotSerializer(serializers.ModelSerializer):
    """Non-geospatial metadata + centroid for public heatmaps."""
    centroid = serializers.SerializerMethodField()

    class Meta:
        model = Plot
        fields = ['id', 'is_eudr_compliant', 'last_checked_at', 'centroid']

    def get_centroid(self, obj):
        if obj.boundary and 'coordinates' in obj.boundary:
            # Simple centroid calc for GeoJSON polygon [[[x,y], [x,y], ...]]
            try:
                coords = obj.boundary['coordinates'][0]
                avg_x = sum(c[0] for c in coords) / len(coords)
                avg_y = sum(c[1] for c in coords) / len(coords)
                return {"type": "Point", "coordinates": [avg_x, avg_y]}
            except (KeyError, IndexError, ZeroDivisionError):
                pass
        return None

class AuditorPlotSerializer(serializers.ModelSerializer):
    """Full PII for audit verification with JSON boundary."""
    class Meta:
        model = Plot
        fields = ['id', 'farmer', 'name', 'boundary', 'area_hectares', 'is_eudr_compliant', 'last_checked_at']
        read_only_fields = ['id', 'area_hectares', 'is_eudr_compliant', 'last_checked_at']

class FarmEventSerializer(serializers.ModelSerializer):
    """Serializer for agricultural events (Planting, Harvesting, etc)."""
    plot_name = serializers.CharField(source='plot.name', read_only=True)
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)

    class Meta:
        model = FarmEvent
        fields = [
            'id', 'event_type', 'plot', 'plot_name', 'farmer', 'farmer_name',
            'timestamp', 'location', 'photo_url', 'quality_grade', 'notes',
            'farmos_uuid', 'created_at'
        ]
        read_only_fields = ['id', 'farmos_uuid', 'created_at']

from .models import SupplyContract

class SupplyContractSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    coop_name = serializers.CharField(source='cooperative.name', read_only=True)
    
    class Meta:
        model = SupplyContract
        fields = [
            'id', 'buyer', 'buyer_name', 'cooperative', 'coop_name',
            'commodity', 'target_volume_kg', 'price_per_kg_cusd', 'quality_specs',
            'status', 'deadline', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'buyer_name', 'coop_name', 'created_at', 'updated_at']
