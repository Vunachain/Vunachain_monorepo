from django.db import models
from django.contrib.auth.models import User
from blockchain_sync.models import Cooperative

class UserProfile(models.Model):
    """
    Extended user profile for all Vunachain platform users (Admin, Managers, Offtakers, Farmers).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Professional context
    position = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Sourcing Manager, GIS Analyst")
    cooperative = models.ForeignKey(Cooperative, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_profiles')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.username}"

class UserSettings(models.Model):
    """
    User-specific platform preferences.
    """
    THEME_CHOICES = [
        ('LIGHT', 'Light Mode'),
        ('DARK', 'Dark Mode'),
        ('SYSTEM', 'System Default'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme_preference = models.CharField(max_length=10, choices=THEME_CHOICES, default='SYSTEM')
    notifications_enabled = models.BooleanField(default=True)
    email_alerts = models.BooleanField(default=True)
    language = models.CharField(max_length=10, default='en')

    def __str__(self):
        return f"Settings: {self.user.username}"
