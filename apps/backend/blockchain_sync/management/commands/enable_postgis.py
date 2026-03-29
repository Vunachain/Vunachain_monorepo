from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Enable PostGIS extension in the database'

    def handle(self, *args, **options):
        engine = connection.settings_dict.get('ENGINE', '')
        
        if 'postgis' not in engine and 'postgresql' not in engine:
            self.stdout.write(self.style.WARNING(f"Skipping PostGIS initialization for engine: {engine}"))
            return

        self.stdout.write("Ensuring PostGIS extension is enabled...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            self.stdout.write(self.style.SUCCESS("PostGIS extension enabled or already exists."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to enable PostGIS: {e}"))
            # In some environments, the user might not have superuser rights to CREATE EXTENSION
            # but usually Railway/Managed DBs provide a way or it's already there.
