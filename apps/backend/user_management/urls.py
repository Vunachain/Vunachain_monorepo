from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, SettingsViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='userprofile')
router.register(r'settings', SettingsViewSet, basename='usersetting')

urlpatterns = [
    path('', include(router.urls)),
]
