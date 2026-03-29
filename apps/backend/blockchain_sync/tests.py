"""
Tests for blockchain_sync app models.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from .models import FarmerProfile, MerkleBatchModel, OnChainHarvest, MpesaPayout, Plot, FarmEvent


class FarmerProfileTests(TestCase):
    """Test suite for FarmerProfile model."""

    def test_create_farmer_profile(self):
        """Test creating a farmer profile."""
        farmer = FarmerProfile.objects.create(
            celo_address='0x1234567890abcdef1234567890abcdef12345678',
            phone_number='254712345678',
            full_name='John Farmer'
        )
        self.assertEqual(farmer.full_name, 'John Farmer')
        self.assertFalse(farmer.is_verified)

    def test_farmer_profile_str(self):
        """Test FarmerProfile string representation."""
        farmer = FarmerProfile.objects.create(
            celo_address='0xabcdef1234567890abcdef1234567890abcdef12',
            phone_number='254700000000',
            full_name='Jane Farmer'
        )
        self.assertIn('Jane Farmer', str(farmer))
        self.assertIn('0xabcd', str(farmer))

    def test_celo_address_unique(self):
        """Test that celo_address is unique."""
        FarmerProfile.objects.create(
            celo_address='0x1111111111111111111111111111111111111111',
            phone_number='254711111111',
            full_name='Farmer One'
        )
        with self.assertRaises(Exception):
            FarmerProfile.objects.create(
                celo_address='0x1111111111111111111111111111111111111111',
                phone_number='254722222222',
                full_name='Farmer Two'
            )


class MerkleBatchModelTests(TestCase):
    """Test suite for MerkleBatchModel."""

    def test_create_merkle_batch(self):
        """Test creating a Merkle batch."""
        batch = MerkleBatchModel.objects.create(
            merkle_root='0x' + 'a' * 64,
            total_records=10,
            total_amount_cusd=Decimal('100.000000000000000000')
        )
        self.assertEqual(batch.total_records, 10)
        self.assertFalse(batch.is_distributed)

    def test_merkle_batch_str(self):
        """Test MerkleBatchModel string representation."""
        batch = MerkleBatchModel.objects.create(
            merkle_root='0x' + 'b' * 64,
            total_records=5,
            total_amount_cusd=Decimal('50.0')
        )
        self.assertIn('5 records', str(batch))


class OnChainHarvestTests(TestCase):
    """Test suite for OnChainHarvest model."""

    def test_create_harvest(self):
        """Test creating an on-chain harvest record."""
        harvest = OnChainHarvest.objects.create(
            record_id=1,
            farmer_address='0x' + 'c' * 40,
            crop_type='Coffee',
            weight_kg=Decimal('100.50'),
            location='Nairobi, Kenya'
        )
        self.assertEqual(harvest.status, 0)  # Pending
        self.assertEqual(harvest.crop_type, 'Coffee')

    def test_harvest_str(self):
        """Test OnChainHarvest string representation."""
        harvest = OnChainHarvest.objects.create(
            record_id=42,
            farmer_address='0x' + 'd' * 40,
            crop_type='Cocoa',
            weight_kg=Decimal('200.00'),
            location='Mombasa, Kenya'
        )
        self.assertIn('42', str(harvest))

    def test_harvest_status_choices(self):
        """Test harvest status can be updated."""
        harvest = OnChainHarvest.objects.create(
            record_id=2,
            farmer_address='0x' + 'e' * 40,
            crop_type='Avocado',
            weight_kg=Decimal('50.00'),
            location='Kisumu, Kenya'
        )
        harvest.status = 1  # Verified
        harvest.save()
        harvest.refresh_from_db()
        self.assertEqual(harvest.status, 1)


class MpesaPayoutTests(TestCase):
    """Test suite for MpesaPayout model."""

    def test_create_payout(self):
        """Test creating an M-Pesa payout."""
        harvest = OnChainHarvest.objects.create(
            record_id=100,
            farmer_address='0x' + 'f' * 40,
            crop_type='Tea',
            weight_kg=Decimal('75.00'),
            location='Kericho, Kenya'
        )
        payout = MpesaPayout.objects.create(
            harvest=harvest,
            phone_number='254712345678',
            amount_kes=Decimal('5000.00'),
            conversion_rate=Decimal('150.0000')
        )
        self.assertEqual(payout.status, 'PENDING')
        self.assertEqual(payout.amount_kes, Decimal('5000.00'))

    def test_payout_str(self):
        """Test MpesaPayout string representation."""
        harvest = OnChainHarvest.objects.create(
            record_id=101,
            farmer_address='0x' + '1' * 40,
            crop_type='Macadamia',
            weight_kg=Decimal('30.00'),
            location='Thika, Kenya'
        )
        payout = MpesaPayout.objects.create(
            harvest=harvest,
            phone_number='254700000000',
            amount_kes=Decimal('2000.00'),
            conversion_rate=Decimal('148.5000')
        )
        self.assertIn('101', str(payout))
        self.assertIn('PENDING', str(payout))

    def test_payout_one_to_one(self):
        """Test that each harvest can only have one payout."""
        harvest = OnChainHarvest.objects.create(
            record_id=102,
            farmer_address='0x' + '2' * 40,
            crop_type='Cashew',
            weight_kg=Decimal('45.00'),
            location='Malindi, Kenya'
        )
        MpesaPayout.objects.create(
            harvest=harvest,
            phone_number='254711111111',
            amount_kes=Decimal('3000.00'),
            conversion_rate=Decimal('149.0000')
        )
        with self.assertRaises(Exception):
            MpesaPayout.objects.create(
                harvest=harvest,
                phone_number='254722222222',
                amount_kes=Decimal('3500.00'),
                conversion_rate=Decimal('149.0000')
            )


from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class BlockchainSyncAPITests(APITestCase):
    """Integration tests for blockchain_sync API endpoints."""

    def setUp(self):
        # Create and authenticate a test user
        self.user = User.objects.create_user(username='testapi', password='testpass123')
        self.client.force_authenticate(user=self.user)

        # Setup data
        self.farmer_address = '0x1234567890abcdef1234567890abcdef12345678'
        self.farmer = FarmerProfile.objects.create(
            celo_address=self.farmer_address,
            phone_number='254712345678',
            full_name='Test Farmer'
        )
        self.batch = MerkleBatchModel.objects.create(
            merkle_root='0x' + 'f' * 64,
            total_records=1,
            total_amount_cusd=10.0
        )
        self.harvest = OnChainHarvest.objects.create(
            record_id=100,
            farmer_address=self.farmer_address,
            crop_type='Coffee',
            weight_kg=50.0,
            batch=self.batch,
            merkle_proof=['0xabc', '0xdef']
        )

    def test_harvest_list_api(self):
        """Test the harvest listing API."""
        url = reverse('blockchain_sync:harvest-list')
        response = self.client.get(url, {'address': self.farmer_address})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that we have results (if not paginated, it returns a list)
        data = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['record_id'], 100)

    def test_harvest_proof_api(self):
        """Test retrieving Merkle proof for a specific harvest."""
        url = reverse('blockchain_sync:harvest-proof', kwargs={'record_id': 100})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['record_id'], 100)
        self.assertEqual(response.data['proof'], ['0xabc', '0xdef'])
        self.assertEqual(response.data['merkle_root'], self.batch.merkle_root)

    def test_harvest_proof_not_found(self):
        """Test proof retrieval for non-existent record."""
        url = reverse('blockchain_sync:harvest-proof', kwargs={'record_id': 999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mpesa_callback_success(self):
        """Test successful M-Pesa payout callback via API client."""
        from decimal import Decimal
        
        payout = MpesaPayout.objects.create(
            harvest=self.harvest,
            phone_number='254712345678',
            amount_kes=Decimal('1000.00'),
            conversion_rate=Decimal('150.0'),
            originator_conversation_id='CID_123',
            status='INITIATED'
        )
        
        # M-Pesa callback is AllowAny, so unauthenticated POST works
        self.client.force_authenticate(user=None)  # Clear auth like Daraja would
        url = reverse('blockchain_sync:mpesa-callback')
        callback_data = {
            "Result": {
                "ResultType": 0,
                "ResultCode": 0,
                "ResultDesc": "Process completed successfully",
                "OriginatorConversationID": "CID_123",
                "ConversationID": "CONV_123",
                "TransactionID": "REC_123",
                "ResultParameters": {
                    "ResultParameter": [
                        {"Key": "MpesaReceiptNo", "Value": "REC_123"}
                    ]
                }
            }
        }
        
        response = self.client.post(url, callback_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payout.refresh_from_db()
        self.assertEqual(payout.status, 'COMPLETED')
        self.assertEqual(payout.receipt_number, 'REC_123')

class FarmEventModelTests(TestCase):
    """Test suite for FarmEvent model."""

    def setUp(self):
        self.farmer = FarmerProfile.objects.create(
            celo_address='0x1234567890abcdef1234567890abcdef12345678',
            phone_number='254712345678',
            full_name='Test Farmer'
        )
        self.plot = Plot.objects.create(
            farmer=self.farmer,
            name='Test Plot',
            boundary={"type": "Polygon", "coordinates": [[[0,0], [0,1], [1,1], [1,0], [0,0]]]}
        )

    def test_create_farm_event(self):
        """Test creating a farm event."""
        from .models import FarmEvent
        event = FarmEvent.objects.create(
            event_type='PLANTING',
            plot=self.plot,
            farmer=self.farmer,
            notes='Test planting event'
        )
        self.assertEqual(event.event_type, 'PLANTING')
        self.assertEqual(event.plot, self.plot)
        self.assertEqual(event.farmer, self.farmer)

    def test_farm_event_str(self):
        """Test FarmEvent string representation."""
        from .models import FarmEvent
        event = FarmEvent.objects.create(
            event_type='INSPECTION',
            plot=self.plot,
            farmer=self.farmer
        )
        self.assertIn('Inspection', str(event))
        self.assertIn('Test Plot', str(event))

class JWTClaimsTests(APITestCase):
    """Test suite for custom JWT claims (roles)."""

    def setUp(self):
        from django.contrib.auth.models import Group
        self.user = User.objects.create_user(username='testuser', password='password123', email='test@example.com')
        self.group = Group.objects.get_or_create(name='Agronomist')[0]
        self.user.groups.add(self.group)

    def test_jwt_contains_roles(self):
        """Test that the JWT contains the correct role claims."""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': 'testuser', 'password': 'password123'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        access_token = response.data['access']
        
        # Decode token
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken(access_token)
        
        self.assertIn('roles', token.payload)
        self.assertIn('Agronomist', token.payload['roles'])
        self.assertEqual(token.payload['primary_role'], 'Agronomist')
        self.assertEqual(token.payload['username'], 'testuser')
