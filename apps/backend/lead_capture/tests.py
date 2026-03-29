from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import DemoRequest, EmailSubscription, ROICalculation
from decimal import Decimal


class DemoRequestAPITests(APITestCase):
    """
    Test suite for the Demo Request API endpoint.
    """

    def setUp(self):
        """Set up test data."""
        self.url = '/api/leads/demo-request/'
        self.valid_payload = {
            'name': 'John Doe',
            'email': 'john@examplecorp.com',
            'company': 'Example Corp',
            'interest': 'compliance'
        }

    def test_create_demo_request_success(self):
        """Test creating a valid demo request."""
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['message'], 'Demo request received successfully')
        self.assertEqual(DemoRequest.objects.count(), 1)
        self.assertEqual(DemoRequest.objects.first().name, 'John Doe')

    def test_create_demo_request_missing_name(self):
        """Test that name is required."""
        payload = {**self.valid_payload}
        del payload['name']
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_demo_request_missing_email(self):
        """Test that email is required."""
        payload = {**self.valid_payload}
        del payload['email']
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_demo_request_missing_company(self):
        """Test that company is required."""
        payload = {**self.valid_payload}
        del payload['company']
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company', response.data)

    def test_create_demo_request_invalid_email(self):
        """Test validation of email format."""
        payload = {**self.valid_payload, 'email': 'invalid-email'}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_demo_request_free_email_rejected(self):
        """Test that free email providers are rejected for demo requests."""
        free_emails = [
            'john@gmail.com',
            'john@yahoo.com',
            'john@hotmail.com',
            'john@outlook.com',
        ]
        for email in free_emails:
            payload = {**self.valid_payload, 'email': email}
            response = self.client.post(self.url, payload, format='json')
            self.assertEqual(
                response.status_code, 
                status.HTTP_400_BAD_REQUEST,
                f"Expected {email} to be rejected"
            )

    def test_create_demo_request_all_interest_types(self):
        """Test all valid interest types are accepted."""
        interest_types = ['compliance', 'sideselling', 'finance', 'other']
        for i, interest in enumerate(interest_types):
            payload = {
                **self.valid_payload,
                'email': f'user{i}@testcorp.com',
                'interest': interest
            }
            response = self.client.post(self.url, payload, format='json')
            self.assertEqual(
                response.status_code, 
                status.HTTP_201_CREATED,
                f"Interest type '{interest}' should be accepted"
            )

    def test_create_demo_request_invalid_interest(self):
        """Test that invalid interest type is rejected."""
        payload = {**self.valid_payload, 'interest': 'invalid_interest'}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailSubscriptionAPITests(APITestCase):
    """
    Test suite for the Email Subscription API endpoint.
    """

    def setUp(self):
        """Set up test data."""
        self.url = '/api/leads/subscribe/'
        self.valid_payload = {
            'email': 'user@example.com',
            'source': 'footer'
        }

    def test_create_subscription_success(self):
        """Test creating a valid email subscription."""
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['message'], 'Successfully subscribed to updates')
        self.assertEqual(EmailSubscription.objects.count(), 1)

    def test_create_subscription_minimal_payload(self):
        """Test subscription with only email (source defaults to footer)."""
        payload = {'email': 'minimal@example.com'}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        subscription = EmailSubscription.objects.get(email='minimal@example.com')
        self.assertEqual(subscription.source, 'footer')

    def test_create_subscription_all_sources(self):
        """Test all valid source types are accepted."""
        sources = ['footer', 'exit_intent', 'hero']
        for i, source in enumerate(sources):
            payload = {
                'email': f'user{i}@example.com',
                'source': source
            }
            response = self.client.post(self.url, payload, format='json')
            self.assertEqual(
                response.status_code, 
                status.HTTP_201_CREATED,
                f"Source '{source}' should be accepted"
            )

    def test_duplicate_subscription_updates_source(self):
        """Test that duplicate email updates the source instead of error."""
        # Create initial subscription
        response1 = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create with same email but different source
        payload2 = {'email': 'user@example.com', 'source': 'hero'}
        response2 = self.client.post(self.url, payload2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Should still be only one subscription
        self.assertEqual(EmailSubscription.objects.count(), 1)
        subscription = EmailSubscription.objects.first()
        self.assertEqual(subscription.source, 'hero')

    def test_subscription_free_email_allowed(self):
        """Test that free email providers are allowed for subscriptions (unlike demo requests)."""
        payload = {'email': 'user@gmail.com', 'source': 'footer'}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_subscription_invalid_email(self):
        """Test validation of email format."""
        payload = {'email': 'invalid-email'}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ROICalculationAPITests(APITestCase):
    """
    Test suite for the ROI Calculation API endpoint.
    """

    def setUp(self):
        """Set up test data."""
        self.url = '/api/analytics/roi-interaction/'
        self.valid_payload = {
            'input_volume': 5000,
            'calculated_loss': 125000.00,
            'crop_type': 'Coffee',
            'session_id': 'abc123'
        }

    def test_log_roi_calculation_success(self):
        """Test logging a valid ROI calculation."""
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['message'], 'ROI calculation logged successfully')
        self.assertEqual(ROICalculation.objects.count(), 1)

    def test_log_roi_calculation_minimal_payload(self):
        """Test ROI calculation without optional session_id."""
        payload = {
            'input_volume': 1000,
            'calculated_loss': 25000.00,
            'crop_type': 'Cocoa'
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_log_roi_calculation_zero_volume_rejected(self):
        """Test that zero input volume is rejected."""
        payload = {**self.valid_payload, 'input_volume': 0}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('input_volume', response.data)

    def test_log_roi_calculation_negative_volume_rejected(self):
        """Test that negative input volume is rejected."""
        payload = {**self.valid_payload, 'input_volume': -100}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_log_roi_calculation_excessive_volume_rejected(self):
        """Test that volume exceeding 1 million MT is rejected."""
        payload = {**self.valid_payload, 'input_volume': 1000001}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_log_roi_calculation_missing_volume(self):
        """Test that input_volume is required."""
        payload = {**self.valid_payload}
        del payload['input_volume']
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_log_roi_calculation_missing_calculated_loss(self):
        """Test that calculated_loss is required."""
        payload = {**self.valid_payload}
        del payload['calculated_loss']
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class HealthCheckAPITests(APITestCase):
    """
    Test suite for the Health Check API endpoint.
    """

    def test_health_check(self):
        """Test health check endpoint returns expected response."""
        url = '/api/health/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['service'], 'Vunachain Backend')
        self.assertEqual(response.data['version'], '1.0.0')


class ModelTests(TestCase):
    """
    Test suite for model string representations and meta options.
    """

    def test_demo_request_str(self):
        """Test DemoRequest string representation."""
        demo = DemoRequest.objects.create(
            name='Jane Doe',
            email='jane@testcorp.com',
            company='Test Corp',
            interest='compliance'
        )
        self.assertIn('Jane Doe', str(demo))
        self.assertIn('Test Corp', str(demo))

    def test_email_subscription_str(self):
        """Test EmailSubscription string representation."""
        subscription = EmailSubscription.objects.create(
            email='test@example.com',
            source='footer'
        )
        self.assertIn('test@example.com', str(subscription))

    def test_roi_calculation_str(self):
        """Test ROICalculation string representation."""
        roi = ROICalculation.objects.create(
            input_volume=5000,
            calculated_loss=Decimal('125000.00'),
            crop_type='Coffee'
        )
        self.assertIn('Coffee', str(roi))
        self.assertIn('5000', str(roi))

    def test_demo_request_ordering(self):
        """Test DemoRequest is ordered by created_at descending."""
        demo1 = DemoRequest.objects.create(
            name='First', email='first@test.com', company='Co', interest='compliance'
        )
        demo2 = DemoRequest.objects.create(
            name='Second', email='second@test.com', company='Co', interest='compliance'
        )
        demos = list(DemoRequest.objects.all())
        self.assertEqual(demos[0].name, 'Second')  # Most recent first

    def test_email_subscription_unique_email(self):
        """Test EmailSubscription email is unique."""
        EmailSubscription.objects.create(email='unique@test.com', source='footer')
        with self.assertRaises(Exception):
            EmailSubscription.objects.create(email='unique@test.com', source='hero')
