from django.http import JsonResponse
from django.db import connection
import sys

def health_check(request):
    """
    Lightweight health check for Railway.
    """
    health_status = {
        "status": "healthy",
        "database": "unknown"
    }
    
    try:
        # Just check if we can perform a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["database"] = "connected"
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"HEALTH CHECK FAILED: {error_details}", file=sys.stdout)
        print(f"HEALTH CHECK FAILED: Database error: {e}", file=sys.stderr)
        health_status["status"] = "unhealthy"
        health_status["database"] = f"error: {str(e)}"
        return JsonResponse(health_status, status=503)

    return JsonResponse(health_status)
