from rest_framework import serializers
from .models import DemoRequest, EmailSubscription, ROICalculation


class DemoRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for DemoRequest model.
    """
    class Meta:
        model = DemoRequest
        fields = ['id', 'name', 'email', 'company', 'interest', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_email(self, value):
        """
        Validate that the email is a work email (basic check).
        """
        # Block common free email providers
        free_email_domains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'icloud.com', 'mail.com'
        ]
        domain = value.split('@')[1].lower()
        if domain in free_email_domains:
            raise serializers.ValidationError(
                "Please use your work email address for demo requests."
            )
        return value


class EmailSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for EmailSubscription model.
    """
    # Remove implicit UniqueValidator to handle duplicates gracefully in create()
    email = serializers.EmailField()

    class Meta:
        model = EmailSubscription
        fields = ['id', 'email', 'source', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'is_active']
    
    def create(self, validated_data):
        """
        Handle duplicate emails gracefully - update instead of error.
        """
        email = validated_data.get('email')
        subscription, created = EmailSubscription.objects.get_or_create(
            email=email,
            defaults=validated_data
        )
        if not created:
            # Update the source if subscription already exists
            subscription.source = validated_data.get('source', subscription.source)
            subscription.is_active = True
            subscription.save()
        return subscription


class ROICalculationSerializer(serializers.ModelSerializer):
    """
    Serializer for ROICalculation model.
    """
    class Meta:
        model = ROICalculation
        fields = ['id', 'input_volume', 'calculated_loss', 'crop_type', 'session_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_input_volume(self, value):
        """
        Ensure input volume is positive and within reasonable bounds.
        """
        if value <= 0:
            raise serializers.ValidationError("Input volume must be greater than zero.")
        if value > 1000000:  # 1 million MT
            raise serializers.ValidationError("Input volume exceeds maximum allowed value.")
        return value
