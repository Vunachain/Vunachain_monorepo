# API Documentation Guide

Complete guide for setting up and maintaining API documentation using DRF Spectacular.

---

## Overview

This project uses **DRF Spectacular** to automatically generate OpenAPI (Swagger) documentation for the Django REST API. This provides an interactive interface to explore and test API endpoints.

### Key Features

- **Automatic Schema Generation**: Extracts API structure from Django REST Framework code
- **Interactive Documentation**: Swagger UI and ReDoc interfaces
- **Type Safety**: Full OpenAPI 3.0 specification support
- **Serializer Documentation**: Automatically documents serializer fields and types
- **Method Documentation**: Captures endpoint docstrings and permissions

---

## Setup

### Installation

Add to `apps/backend/requirements.txt`:

```
drf-spectacular>=0.27.0
drf-spectacular-sidecar>=0.27.0  # For serving Swagger/ReDoc assets
```

Install:

```bash
cd apps/backend
pip install -r requirements.txt
```

### Django Configuration

Add to `config/settings/base.py`:

```python
INSTALLED_APPS = [
    # ... other apps
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Vunachain API',
    'DESCRIPTION': 'Blockchain-based agricultural supply chain API',
    'VERSION': '1.0.0',
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
    'SERVE_AUTHENTICATION': None,
    'CONTACT': {
        'name': 'Vunachain Support',
        'url': 'https://vunachain.com',
        'email': 'support@vunachain.com',
    },
    'LICENSE': {
        'name': 'MIT',
        'url': 'https://opensource.org/licenses/MIT',
    },
    'SERVERS': [
        {
            'url': 'http://localhost:8000',
            'description': 'Local development',
        },
        {
            'url': 'https://api.staging.vunachain.com',
            'description': 'Staging environment',
        },
        {
            'url': 'https://api.vunachain.com',
            'description': 'Production',
        },
    ],
    'PREPROCESS_FILTER_FUNCTION': 'path.to.preprocessing_filter_spec',
    'POSTPROCESS_FILTER_FUNCTION': 'path.to.postprocessing_filter_spec',
}
```

### URL Configuration

Add to `config/urls.py`:

```python
from drf_spectacular.views import SpectacularSwaggerView, SpectacularReDocView, SpectacularAPIView
from django.urls import path

urlpatterns = [
    # ... other patterns

    # API Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ReDoc
    path('api/redoc/', SpectacularReDocView.as_view(url_name='schema'), name='redoc'),
]
```

---

## Documenting Endpoints

### Basic Endpoint Documentation

```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .serializers import FarmerSerializer
from .models import Farmer

class FarmerViewSet(viewsets.ModelViewSet):
    """
    Manage farmer profiles.

    Farmers are the primary users of the platform and can log harvests,
    manage plots, and participate in contracts.
    """
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer

    @extend_schema(
        summary='List all farmers',
        description='Returns a paginated list of all farmers',
        tags=['farmers'],
        examples=[
            {
                'value': {
                    'count': 100,
                    'results': [
                        {
                            'id': 1,
                            'full_name': 'John Doe',
                            'phone_number': '+254712345678',
                            'national_id': '12345678'
                        }
                    ]
                }
            }
        ]
    )
    def list(self, request):
        return super().list(request)

    @extend_schema(
        summary='Create a new farmer',
        description='Register a new farmer in the system',
        tags=['farmers'],
        request=FarmerSerializer,
        responses={201: FarmerSerializer}
    )
    def create(self, request):
        return super().create(request)

    @extend_schema(
        summary='Retrieve farmer details',
        description='Get detailed information about a specific farmer',
        tags=['farmers'],
        responses={200: FarmerSerializer}
    )
    def retrieve(self, request, pk=None):
        return super().retrieve(request, pk)

    @extend_schema(
        summary='Update farmer information',
        description='Partially update a farmer\'s profile',
        tags=['farmers'],
        request=FarmerSerializer,
        responses={200: FarmerSerializer}
    )
    def partial_update(self, request, pk=None):
        return super().partial_update(request, pk)

    @extend_schema(
        summary='Delete farmer',
        description='Remove a farmer from the system',
        tags=['farmers'],
        responses={204: None}
    )
    def destroy(self, request, pk=None):
        return super().destroy(request, pk)

    @extend_schema(
        summary='Get farmer statistics',
        description='Retrieve aggregated statistics for a farmer',
        tags=['farmers'],
        responses={200: {
            'type': 'object',
            'properties': {
                'total_harvest': {'type': 'number'},
                'total_plots': {'type': 'integer'},
                'avg_yield': {'type': 'number'}
            }
        }}
    )
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get farmer statistics."""
        farmer = self.get_object()
        # Implementation here
        return Response({
            'total_harvest': 1000,
            'total_plots': 5,
            'avg_yield': 200
        })
```

### Serializer Documentation

```python
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Farmer

class FarmerSerializer(serializers.ModelSerializer):
    """Serializer for farmer profiles with full validation."""

    class Meta:
        model = Farmer
        fields = [
            'id',
            'full_name',
            'phone_number',
            'national_id',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(serializers.CharField(required=True, min_length=1, max_length=255))
    def get_full_name(self, obj):
        return obj.full_name
```

### Custom Request/Response Schemas

```python
from drf_spectacular.utils import extend_schema, OpenApiResponse

class HarvestViewSet(viewsets.ModelViewSet):
    @extend_schema(
        summary='Log a harvest',
        description='Create a record of a harvest event',
        tags=['harvests'],
        request={
            'type': 'object',
            'properties': {
                'farmer_id': {'type': 'integer', 'description': 'ID of the farmer'},
                'date': {'type': 'string', 'format': 'date'},
                'quantity': {'type': 'number', 'description': 'Quantity harvested in kg'},
                'crop_type': {'type': 'string'},
                'gps_location': {'type': 'string', 'description': 'GPS coordinates'}
            },
            'required': ['farmer_id', 'date', 'quantity', 'crop_type']
        },
        responses={
            201: OpenApiResponse(
                description='Harvest logged successfully',
                response={
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer'},
                        'transaction_hash': {'type': 'string'}
                    }
                }
            ),
            400: OpenApiResponse(description='Invalid input data'),
            401: OpenApiResponse(description='Authentication required')
        }
    )
    def create(self, request):
        # Implementation here
        pass
```

---

## Viewing Documentation

### Development

Once configured, access documentation at:

```
Swagger UI:  http://localhost:8000/api/docs/
ReDoc:       http://localhost:8000/api/redoc/
OpenAPI:     http://localhost:8000/api/schema/
```

### Testing Endpoints

The Swagger UI allows direct testing of endpoints:

1. Navigate to http://localhost:8000/api/docs/
2. Find the endpoint you want to test
3. Click "Try it out"
4. Fill in required parameters
5. Click "Execute"
6. View the response

---

## Schema Customization

### Preprocessing Schema

Add custom logic before schema generation:

```python
# config/settings/base.py
def preprocessing_filter_spec(endpoints):
    """Filter and customize endpoints before schema generation."""
    filtered = []
    for path, path_item, method, operation in endpoints:
        # Skip internal endpoints
        if path.startswith('/api/internal/'):
            continue

        # Add custom tags
        if 'farmer' in path.lower():
            operation['tags'] = ['Farmers']

        filtered.append((path, path_item, method, operation))

    return filtered

SPECTACULAR_SETTINGS = {
    'PREPROCESS_FILTER_FUNCTION': 'config.schema.preprocessing_filter_spec',
}
```

### Postprocessing Schema

Modify schema after generation:

```python
def postprocessing_filter_spec(endpoints):
    """Modify schema after generation."""
    # Add info/security definitions
    return endpoints

SPECTACULAR_SETTINGS = {
    'POSTPROCESS_FILTER_FUNCTION': 'config.schema.postprocessing_filter_spec',
}
```

---

## Authentication Documentation

### Token Authentication

```python
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

class ProtectedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='Get user profile',
        description='Requires authentication token',
        tags=['users'],
        security=[{'tokenAuth': []}]
    )
    def retrieve(self, request, pk=None):
        pass
```

Configure in settings:

```python
SPECTACULAR_SETTINGS = {
    'SECURITY': [
        {
            'tokenAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'Authorization',
                'description': 'Token-based authentication'
            }
        }
    ]
}
```

---

## Best Practices

### 1. Write Clear Summaries

```python
@extend_schema(
    summary='Create a new contract',  # Short, action-oriented
    description='Create a procurement contract between a farmer and buyer'  # More detail
)
def create(self, request):
    pass
```

### 2. Document All Status Codes

```python
@extend_schema(
    responses={
        201: FarmerSerializer,
        400: OpenApiResponse(description='Validation failed'),
        401: OpenApiResponse(description='Unauthenticated'),
        403: OpenApiResponse(description='Permission denied')
    }
)
def create(self, request):
    pass
```

### 3. Use Examples

```python
@extend_schema(
    examples=[
        {
            'value': {
                'full_name': 'John Doe',
                'phone_number': '+254712345678',
                'national_id': '12345678'
            }
        }
    ]
)
def create(self, request):
    pass
```

### 4. Document Query Parameters

```python
from drf_spectacular.utils import OpenApiParameter

@extend_schema(
    parameters=[
        OpenApiParameter(
            name='status',
            description='Filter by harvest status',
            required=False,
            type=str,
            enum=['pending', 'completed', 'rejected']
        ),
        OpenApiParameter(
            name='date_from',
            description='Start date (YYYY-MM-DD)',
            required=False,
            type=str,
            format='date'
        )
    ]
)
def list(self, request):
    pass
```

### 5. Document Custom Fields

```python
class ContractSerializer(serializers.ModelSerializer):
    status_display = serializers.SerializerMethodField(
        help_text='Human-readable status label'
    )

    def get_status_display(self, obj):
        return obj.get_status_display()
```

---

## CI/CD Integration

### Generate Schema in GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Generate API schema
  run: |
    cd apps/backend
    python manage.py spectacular --file schema.yml

- name: Upload schema
  uses: actions/upload-artifact@v3
  with:
    name: api-schema
    path: apps/backend/schema.yml
```

---

## Documentation Maintenance

### Version Management

Keep `VERSION` in `SPECTACULAR_SETTINGS` in sync with project version:

```python
SPECTACULAR_SETTINGS = {
    'VERSION': '1.0.0',  # Update when releasing
}
```

### Deprecations

Mark deprecated endpoints:

```python
from drf_spectacular.utils import extend_schema

@extend_schema(
    deprecated=True,
    summary='[DEPRECATED] Use /v2/farmers/ instead'
)
def list(self, request):
    pass
```

### Changelog

Document API changes in `CHANGELOG.md`:

```markdown
## [1.0.0] - 2026-03-30

### Added
- New `/api/harvests/` endpoint
- Batch operations support

### Changed
- Renamed `/api/crops/` to `/api/harvest-types/`
- Updated authentication to use Bearer tokens

### Deprecated
- `/api/v1/farmers/` (use `/api/farmers/` instead)
```

---

## Troubleshooting

### Schema Not Updating

```bash
# Clear Django cache
rm -rf .django_cache/

# Regenerate schema
python manage.py spectacular --file schema.yml
```

### Missing Endpoints

Ensure ViewSet/APIView has proper docstrings and uses DRF classes.

### Type Issues

Install type stubs:

```bash
pip install djangorestframework-stubs django-stubs
```

---

## Resources

- [DRF Spectacular Documentation](https://drf-spectacular.readthedocs.io/)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.0)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)

---

**Last Updated:** March 30, 2026
