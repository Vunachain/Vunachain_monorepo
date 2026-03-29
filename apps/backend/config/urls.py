"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from .diagnostics import debug_db_view
from .health import health_check

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from blockchain_sync.api.auth import CustomTokenObtainPairView

from rest_framework.routers import DefaultRouter
from .admin_api import SystemHealthView, UserManagementViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='admin-user-management')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Authentication
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair_v1'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_v1'),
    # Unified API entry point
    path('api/', include('lead_capture.urls')),
    path('api/v1/', include('blockchain_sync.urls')), # Added for frontend compatibility
    path('api/blockchain/', include('blockchain_sync.urls')),
    path('api/debug-db/', permission_classes([IsAdminUser])(debug_db_view)),
    path('api/health/', health_check),
    
    # New Admin API
    path('api/v1/admin/system/', SystemHealthView.as_view(), name='admin-system-health'),
    path('api/v1/admin/', include(router.urls)),
]

