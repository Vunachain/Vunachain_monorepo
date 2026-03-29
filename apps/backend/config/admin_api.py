from django.contrib.auth.models import User, Group
from django.db import connection
from django.utils import timezone
from rest_framework import viewsets, permissions, serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
import psutil
import os
import sys
import time

# --- Serializers ---

class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined', 'roles']
        read_only_fields = ['id', 'date_joined']

    def get_roles(self, obj):
        return list(obj.groups.values_list('name', flat=True))

# --- Views ---

class SystemHealthView(APIView):
    """
    Advanced observability for system administrators.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        health_data = {
            "timestamp": timezone.now(),
            "services": {
                "database": self._check_db(),
                "blockchain_sync": self._check_blockchain_sync(),
            },
            "infrastructure": {
                "python_version": sys.version,
                "process_uptime": f"{int(time.time() - psutil.Process().create_time())}s",
                "memory_usage_mb": int(psutil.Process().memory_info().rss / 1024 / 1024),
                "cpu_percent": psutil.cpu_percent(interval=None),
                "os": sys.platform
            }
        }
        return Response(health_data)

    def _check_db(self):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return {"status": "connected", "latency": "low"}
        except Exception as e:
            return {"status": "disconnected", "error": str(e)}

    def _check_blockchain_sync(self):
        # In a real app, this would query the listener's state or a SyncLog model
        # For now, we'll return mock/calculated data based on the MerkleBatchModel
        from blockchain_sync.models import MerkleBatchModel
        try:
            latest_batch = MerkleBatchModel.objects.order_by('-created_at').first()
            return {
                "status": "active",
                "last_synced_batch": latest_batch.merkle_root[:10] if latest_batch else "None",
                "last_sync_time": latest_batch.created_at if latest_batch else None
            }
        except Exception:
            return {"status": "error", "message": "Could not fetch sync stats"}

class UserManagementViewSet(viewsets.ModelViewSet):
    """
    API for managing platform users and their administrative roles.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        # We prefer deactivation over deletion for audit logs as per user preference
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({"status": "user deactivated"}, status=status.HTTP_200_OK)
