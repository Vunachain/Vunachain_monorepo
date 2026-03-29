from django.http import JsonResponse
from django.db import connection, connections
from django.db.utils import OperationalError
import os
import traceback

def debug_db_view(request):
    # Determine the actual DB engine being used
    current_engine = connection.settings_dict.get('ENGINE')
    
    data = {
        "status": "partial",
        "environment": {
            "RAILWAY_ENVIRONMENT_NAME": os.getenv("RAILWAY_ENVIRONMENT_NAME"),
            "DATABASE_URL_PRESENT": "DATABASE_URL" in os.environ,
            "DATABASE_URL_LEN": len(os.getenv("DATABASE_URL", "")),
        },
        "connection_details": {
            "engine": current_engine,
            "name": connection.settings_dict.get('NAME'),
            "host": connection.settings_dict.get('HOST'),
            "port": connection.settings_dict.get('PORT'),
            "user": connection.settings_dict.get('USER'),
        }
    }
    
    try:
        # Force a connection attempt
        connection.ensure_connection()
        data["connection_established"] = True
        data["tables"] = connection.introspection.table_names()
        data["auth_user_exists"] = "auth_user" in data["tables"]
        data["status"] = "success"
    except OperationalError as oe:
        data["status"] = "error"
        data["error_type"] = "OperationalError"
        data["error_message"] = str(oe)
    except Exception as e:
        data["status"] = "error"
        data["error_type"] = type(e).__name__
        data["error_message"] = str(e)
        data["traceback"] = traceback.format_exc()

    return JsonResponse(data)
