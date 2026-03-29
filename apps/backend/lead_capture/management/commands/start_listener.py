import asyncio
from django.core.management.base import BaseCommand
from blockchain.listeners import blockchain_listener

class Command(BaseCommand):
    help = "Starts the Celo blockchain event listener daemon"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Initializing Celo blockchain listener..."))
        try:
            asyncio.run(blockchain_listener())
        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING("Listener stopped by user."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Listener failed: {e}"))
