from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HarvestListView, get_harvest_proof, mpesa_callback, 
    FarmerViewSet, PlotViewSet, HarvestViewSet, ComplianceViewSet, 
    FarmEventViewSet, SupplyContractViewSet, AnalyticsViewSet
)

app_name = 'blockchain_sync'

router = DefaultRouter()
router.register(r'farmers', FarmerViewSet, basename='farmer')
router.register(r'plots', PlotViewSet, basename='plot')
router.register(r'harvests', HarvestViewSet, basename='harvest')
router.register(r'compliance', ComplianceViewSet, basename='compliance')
router.register(r'farm_events', FarmEventViewSet, basename='farm_events')
router.register(r'contracts', SupplyContractViewSet, basename='contract')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('harvests/history/', HarvestListView.as_view(), name='harvest-list'),
    path('harvests/<int:record_id>/proof/', get_harvest_proof, name='harvest-proof'),
    path('payouts/mpesa-callback/', mpesa_callback, name='mpesa-callback'),
    path('', include(router.urls)),
]
