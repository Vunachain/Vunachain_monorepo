from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, UserSettings

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'bio', 'avatar_url', 'phone_number', 'position', 'cooperative', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['id', 'theme_preference', 'notifications_enabled', 'email_alerts', 'language']
        read_only_fields = ['id']
