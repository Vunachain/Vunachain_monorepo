from django.core.management.base import BaseCommand
from blockchain_sync.farmos import FarmOSClient

class Command(BaseCommand):
    help = 'Synchronize land assets and boundaries from farmOS'

    def handle(self, *args, **options):
        self.stdout.write("Starting farmOS synchronization...")
        client = FarmOSClient()
        count = client.sync_plots()
        self.stdout.write(self.style.SUCCESS(f"Successfully synced {count} plots from farmOS."))
