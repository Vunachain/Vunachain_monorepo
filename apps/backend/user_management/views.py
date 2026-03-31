from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import UserProfile, UserSettings
from .serializers import UserProfileSerializer, UserSettingsSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing user profiles.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.groups.filter(
            name__in=['Auditor', 'System Admin']
        ).exists():
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=user)

    @action(detail=False, methods=['GET', 'PATCH', 'PUT'], url_path='me')
    def me(self, request):
        """
        Manage the current authenticated user's profile.
        """
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user-specific platform settings.
    """
    serializer_class = UserSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserSettings.objects.filter(user=self.request.user)

    @action(detail=False, methods=['GET', 'PATCH', 'PUT'], url_path='my-settings')
    def my_settings(self, request):
        """
        Manage the current authenticated user's settings.
        """
        settings, created = UserSettings.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
