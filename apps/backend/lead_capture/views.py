from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from .models import DemoRequest, EmailSubscription, ROICalculation
from .serializers import (
    DemoRequestSerializer,
    EmailSubscriptionSerializer,
    ROICalculationSerializer
)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def create_demo_request(request):
    """
    API endpoint to handle demo request form submissions.
    
    POST /api/leads/demo-request/
    
    Expected payload:
    {
        "name": "John Doe",
        "email": "john@company.com",
        "company": "Export Ltd",
        "interest": "compliance"
    }
    """
    serializer = DemoRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'id': serializer.data['id'],
            'message': 'Demo request received successfully',
            'created_at': serializer.data['created_at']
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def create_email_subscription(request):
    """
    API endpoint to handle email subscription submissions.
    
    POST /api/leads/subscribe/
    
    Expected payload:
    {
        "email": "user@example.com",
        "source": "footer"  // optional: footer, exit_intent, hero
    }
    """
    serializer = EmailSubscriptionSerializer(data=request.data)
    
    if serializer.is_valid():
        subscription = serializer.save()
        return Response({
            'id': subscription.id,
            'message': 'Successfully subscribed to updates',
            'email': subscription.email,
            'created_at': subscription.created_at
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def log_roi_calculation(request):
    """
    API endpoint to log ROI calculator interactions for analytics.
    
    POST /api/analytics/roi-interaction/
    
    Expected payload:
    {
        "input_volume": 5000,
        "calculated_loss": 125000.00,
        "crop_type": "Coffee",
        "session_id": "abc123"  // optional
    }
    """
    serializer = ROICalculationSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'id': serializer.data['id'],
            'message': 'ROI calculation logged successfully'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def health_check(request):
    """
    Simple health check endpoint.
    
    GET /api/health/
    """
    return Response({
        'status': 'healthy',
        'service': 'Vunachain Backend',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_content_markdown(request, slug):
    """
    Fetches raw Markdown content for a Sanity post.
    Ported from Next.js route for LLM compatibility.
    
    GET /api/content/<slug>/
    """
    from django.http import HttpResponse
    from .sanity import fetch_sanity_content
    
    content = fetch_sanity_content(slug)
    
    if not content:
        return Response({'error': 'Content not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return HttpResponse(
        content['full_markdown'],
        content_type='text/markdown; charset=utf-8'
    )
