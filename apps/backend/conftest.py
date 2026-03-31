"""
Pytest configuration and fixtures for Vunachain backend.
"""

import os
import pytest
from django.test import Client
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


@pytest.fixture
def django_db_setup(django_db_setup, django_db_blocker):
    """
    Configure Django test database.
    """
    with django_db_blocker.unblock():
        pass


@pytest.fixture
def api_client():
    """
    Fixture providing a DRF API client for testing.
    """
    return APIClient()


@pytest.fixture
def authenticated_api_client(db, django_user_model):
    """
    Fixture providing an authenticated API client.
    """
    client = APIClient()
    user = django_user_model.objects.create_user(
        username='testuser',
        email='testuser@example.com',
        password='testpass123'
    )
    token = Token.objects.create(user=user)
    client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
    return client


@pytest.fixture
def test_user(db, django_user_model):
    """
    Fixture providing a test user.
    """
    return django_user_model.objects.create_user(
        username='testuser',
        email='testuser@example.com',
        password='testpass123'
    )


@pytest.fixture
def test_admin_user(db, django_user_model):
    """
    Fixture providing a test admin user.
    """
    return django_user_model.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )


@pytest.fixture
def client():
    """
    Fixture providing a Django test client.
    """
    return Client()


# Markers for test categorization
def pytest_configure(config):
    """
    Register custom pytest markers.
    """
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "api: marks tests as API endpoint tests"
    )
    config.addinivalue_line(
        "markers", "blockchain: marks tests as blockchain-related tests"
    )


@pytest.fixture(scope="session", autouse=True)
def set_test_environment():
    """
    Set test environment variables.
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.test')
    os.environ['DEBUG'] = 'True'
    os.environ['TESTING'] = 'True'
