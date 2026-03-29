from django.db import models
from django.utils import timezone


class DemoRequest(models.Model):
    """
    Model for capturing 'Book a Demo' form submissions.
    """
    name = models.CharField(max_length=200, help_text="Full name of the requester")
    email = models.EmailField(help_text="Work email address")
    company = models.CharField(max_length=200, help_text="Company name")
    interest = models.CharField(
        max_length=50,
        choices=[
            ('compliance', 'EUDR, Tea Act 2020 & Rainforest Alliance'),
            ('sideselling', 'Stopping Side-Selling'),
            ('finance', 'Input Finance Recovery'),
            ('partner', 'Partner with us'),
            ('other', 'General Demo'),
        ],
        default='compliance',
        help_text="Primary area of interest"
    )
    # Geospatial data for EUDR compliance visualization
    location_point = models.CharField(max_length=100, blank=True, null=True, help_text="Captured location (Point)")
    created_at = models.DateTimeField(default=timezone.now, help_text="Submission timestamp")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demo Request'
        verbose_name_plural = 'Demo Requests'
    
    def __str__(self):
        return f"{self.name} ({self.company}) - {self.get_interest_display()}"


class EmailSubscription(models.Model):
    """
    Model for capturing email subscriptions from footer/pilot forms.
    """
    email = models.EmailField(unique=True, help_text="Subscriber email address")
    source = models.CharField(
        max_length=50,
        choices=[
            ('footer', 'Footer Form'),
            ('exit_intent', 'Exit Intent Modal'),
            ('hero', 'Hero Section'),
        ],
        default='footer',
        help_text="Source of subscription"
    )
    created_at = models.DateTimeField(default=timezone.now, help_text="Subscription timestamp")
    is_active = models.BooleanField(default=True, help_text="Active subscription status")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Subscription'
        verbose_name_plural = 'Email Subscriptions'
    
    def __str__(self):
        return f"{self.email} ({self.get_source_display()})"


class ROICalculation(models.Model):
    """
    Model for tracking ROI calculator interactions (behavioral analytics).
    """
    input_volume = models.IntegerField(help_text="Annual tonnage entered by user (MT)")
    calculated_loss = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Calculated loss value in USD"
    )
    crop_type = models.CharField(
        max_length=50,
        default='Coffee',
        help_text="Crop type selected (e.g., Coffee, Cocoa, Avocado)"
    )
    session_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Browser session ID for tracking multiple interactions"
    )
    created_at = models.DateTimeField(default=timezone.now, help_text="Interaction timestamp")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'ROI Calculation'
        verbose_name_plural = 'ROI Calculations'
    
    def __str__(self):
        return f"{self.crop_type} - {self.input_volume} MT (${self.calculated_loss})"
