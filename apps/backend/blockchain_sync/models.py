from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Cooperative(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    manager = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, related_name='managed_cooperative')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class FarmerProfile(models.Model):
    """
    Registry linking Celo wallet addresses to farmer identities and phone numbers.
    """
    celo_address = models.CharField(max_length=42, unique=True, db_index=True)
    phone_number = models.CharField(max_length=15, help_text="Format: 254XXXXXXXXX")
    full_name = models.CharField(max_length=200)
    cooperative = models.ForeignKey(Cooperative, on_delete=models.SET_NULL, null=True, related_name='farmers')
    
    # Headless Identity Fields
    national_id = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    kyc_data = models.JSONField(default=dict, blank=True, help_text="KYC documents and metadata")
    credit_score = models.IntegerField(default=0, help_text="Calculated credit score (0-1000)")
    
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.celo_address[:6]}...)"

    class Meta:
        verbose_name = "Farmer Profile"
        verbose_name_plural = "Farmer Profiles"

class Plot(models.Model):
    """
    Geospatial plot data for EUDR compliance. Simplified to JSON for broad DB compatibility.
    """
    farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='plots')
    cooperative = models.ForeignKey(Cooperative, on_delete=models.SET_NULL, null=True, related_name='plots')
    name = models.CharField(max_length=100, default="Main Plot")
    
    # Simplified boundary storage (accepts GeoJSON-formatted dictionary)
    boundary = models.JSONField(help_text="Boundary coordinates (GeoJSON Polygon formatted)")
    area_hectares = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    
    is_eudr_compliant = models.BooleanField(default=True)
    last_checked_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Plot {self.name} - {self.farmer.full_name}"

    def save(self, *args, **kwargs):
        # Area calculation logic can go here if needed
        super().save(*args, **kwargs)

class MerkleBatchModel(models.Model):
    """
    Groups multiple verified harvests into a single Merkle-based batch payout.
    """
    merkle_root = models.CharField(max_length=66, unique=True, db_index=True)
    total_records = models.PositiveIntegerField()
    total_amount_cusd = models.DecimalField(max_digits=30, decimal_places=18, help_text="Total payout in cUSD")
    transaction_hash = models.CharField(max_length=66, blank=True, null=True, help_text="Transaction hash of createBatchPayout")
    status = models.CharField(
        max_length=20, 
        choices=[('CREATED', 'Created'), ('SUBMITTED', 'Submitted'), ('CONFIRMED', 'Confirmed')],
        default='CREATED'
    )
    is_distributed = models.BooleanField(default=False, help_text="True if batch was directly distributed by admin")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Batch {self.merkle_root[:10]}... ({self.total_records} records)"

    class Meta:
        verbose_name = "Merkle Batch"
        verbose_name_plural = "Merkle Batches"

class OnChainHarvest(models.Model):
    """
    Persists harvest data verified on the Celo blockchain.
    """
    STATUS_CHOICES = [
        (0, 'Pending'),
        (1, 'Verified'),
        (2, 'Rejected'),
        (3, 'Paid'),
    ]

    record_id = models.PositiveIntegerField(unique=True, help_text="Blockchain record ID")
    farmer_address = models.CharField(max_length=42, help_text="Celo wallet address of the farmer")
    farmer_id = models.CharField(max_length=100, blank=True, null=True, help_text="Backend UUID of the farmer")
    crop_type = models.CharField(max_length=100)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=255, help_text="Geographic location string")
    status = models.IntegerField(choices=STATUS_CHOICES, default=0)
    payout_amount_cusd = models.DecimalField(max_digits=32, decimal_places=18, default=0)
    
    # Audit trail
    verified_at = models.DateTimeField(blank=True, null=True)
    transaction_hash = models.CharField(max_length=66, blank=True, null=True, help_text="On-chain verification TX hash")
    batch = models.ForeignKey(MerkleBatchModel, on_delete=models.SET_NULL, null=True, blank=True, related_name='harvests')
    merkle_proof = models.JSONField(blank=True, null=True, help_text="Merkle proof for batch payout claim")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Harvest {self.record_id} - {self.farmer_address}"

    class Meta:
        verbose_name_plural = "On-Chain Harvests"

class MpesaPayout(models.Model):
    """
    Tracks M-Pesa mobile money payouts triggered by blockchain verification.
    """
    PAYOUT_STATUS = [
        ('PENDING', 'Pending'),
        ('INITIATED', 'Initiated'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    harvest = models.OneToOneField(OnChainHarvest, on_delete=models.CASCADE, related_name='payout')
    phone_number = models.CharField(max_length=15, help_text="Farmer's phone number for M-Pesa")
    amount_kes = models.DecimalField(max_digits=12, decimal_places=2, help_text="Converted payout in KES")
    status = models.CharField(max_length=20, choices=PAYOUT_STATUS, default='PENDING')
    conversion_rate = models.DecimalField(max_digits=10, decimal_places=4, help_text="cUSD to KES rate used")
    
    # M-Pesa Receipt Info (from Daraja B2C API)
    originator_conversation_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    conversation_id = models.CharField(max_length=100, blank=True, null=True)
    receipt_number = models.CharField(max_length=100, blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    # Flexible metadata for additional Daraja parameters
    metadata = models.JSONField(default=dict, blank=True)
    
    initiated_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payout for Harvest {self.harvest.record_id} - {self.status}"

class FarmEvent(models.Model):
    """
    Logs plot-level activities (Planting, Spraying, Harvesting, Inspection).
    Integration point with farmOS logs and frontend EventLogForm.
    """
    EVENT_TYPES = [
        ('PLANTING', 'Planting'),
        ('SPRAYING', 'Spraying'),
        ('HARVESTING', 'Harvesting'),
        ('INSPECTION', 'Inspection'),
        ('OTHER', 'Other'),
    ]

    QUALITY_GRADES = [
        ('A', 'Grade A (Premium)'),
        ('B', 'Grade B (Standard)'),
        ('C', 'Grade C (Low)'),
        ('REJECTED', 'Rejected'),
    ]

    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE, related_name='events')
    farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='events')
    
    timestamp = models.DateTimeField(default=timezone.now)
    location = models.JSONField(blank=True, null=True, help_text="GPS capture of the event (GeoJSON Point format)")
    photo_url = models.URLField(max_length=500, blank=True, null=True, help_text="URL to photo evidence")
    
    quality_grade = models.CharField(max_length=10, choices=QUALITY_GRADES, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # farmOS Integration
    farmos_uuid = models.UUIDField(blank=True, null=True, unique=True, help_text="Reference to farmOS log UUID")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_event_type_display()} on Plot {self.plot.name} by {self.farmer.full_name}"

    class Meta:
        verbose_name = "Farm Event"
        verbose_name_plural = "Farm Events"
        ordering = ['-timestamp']

class SupplyContract(models.Model):
    """
    Digital contract between an Off-taker (Buyer) and a Cooperative (Seller).
    Defines the buyer's needs and the terms of engagement.
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('OPEN', 'Open (Awaiting Coop)'),
        ('ACTIVE', 'Active (Allocated)'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer_contracts')
    cooperative = models.ForeignKey(Cooperative, on_delete=models.SET_NULL, null=True, blank=True, related_name='contracts')
    
    commodity = models.CharField(max_length=100, help_text="e.g. Arabica Coffee, Macadamia")
    target_volume_kg = models.DecimalField(max_digits=12, decimal_places=2)
    price_per_kg_cusd = models.DecimalField(max_digits=10, decimal_places=4)
    quality_specs = models.TextField(help_text="e.g. Moisture < 12%, Grade AA")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    deadline = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Contract: {self.commodity} ({self.buyer.username})"

    class Meta:
        verbose_name = "Supply Contract"
        verbose_name_plural = "Supply Contracts"
        ordering = ['-created_at']
