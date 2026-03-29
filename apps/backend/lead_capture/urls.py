from django.urls import path
from . import views

app_name = 'lead_capture'

urlpatterns = [
    # Demo request form (Now at /api/leads/demo-request/)
    path('leads/demo-request/', views.create_demo_request, name='demo-request'),
    
    # Email subscription (Now at /api/leads/subscribe/)
    path('leads/subscribe/', views.create_email_subscription, name='subscribe'),
    
    # ROI calculator analytics (Now at /api/analytics/roi-interaction/)
    path('analytics/roi-interaction/', views.log_roi_calculation, name='roi-interaction'),
    
    # Health check (Kept at /api/health/)
    # path('health/', views.health_check, name='health'),
    
    # Content Markdown Endpoint
    path('content/<slug:slug>/', views.get_content_markdown, name='content-markdown'),
]
