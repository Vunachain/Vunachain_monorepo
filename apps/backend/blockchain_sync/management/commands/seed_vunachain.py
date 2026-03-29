import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from django.utils import timezone
from blockchain_sync.models import Cooperative, FarmerProfile, Plot, FarmEvent, OnChainHarvest
import random

class Command(BaseCommand):
    help = 'Seed the database with dummy data for testing each user persona workflow'

    def handle(self, *args, **options):
        self.stdout.write("Seeding Vunachain database (Simplified JSON Mapping)...")

        # 1. Create Superuser if it doesn't exist
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@vunachain.com', 'Vunachain2024!')
            self.stdout.write(self.style.SUCCESS('Superuser "admin" created.'))

        # 2. Re-run setup_roles to ensure groups exist
        from django.core.management import call_command
        call_command('setup_roles')

        # 3. Create Persona Users
        personas = [
            {'username': 'coop_manager', 'group': 'CoopManager'},
            {'username': 'field_agent', 'group': 'FieldAgent'},
            {'username': 'agronomist', 'group': 'Agronomist'},
            {'username': 'offtaker', 'group': 'Offtaker'},
            {'username': 'auditor', 'group': 'Auditor'},
        ]

        password = 'Vunachain2024!'
        for p in personas:
            user, created = User.objects.get_or_create(username=p['username'])
            if created:
                user.set_password(password)
                user.save()
            
            group = Group.objects.get(name=p['group'])
            user.groups.add(group)
            self.stdout.write(self.style.SUCCESS(f"User '{p['username']}' created and added to group '{p['group']}'."))

        # 4. Create Cooperatives
        coops_data = [
            {'name': 'Nyeri Highlands Coffee Coop', 'location': 'Nyeri, Kenya'},
            {'name': 'Muranga Central Cooperative', 'location': 'Muranga, Kenya'},
        ]
        coops = []
        for c_data in coops_data:
            coop, _ = Cooperative.objects.get_or_create(name=c_data['name'], defaults={'location': c_data['location']})
            coops.append(coop)
        
        # Assign first cooperative to coop_manager
        coop_mgr_user = User.objects.get(username='coop_manager')
        coops[0].manager = coop_mgr_user
        coops[0].save()
        self.stdout.write(self.style.SUCCESS(f"Cooperatives created and '{coops[0].name}' assigned to 'coop_manager'."))

        # 5. Create Farmer Profiles
        farmers_data = [
            {'full_name': 'John Doe', 'phone': '254700000001', 'address': '0x' + '1' * 40, 'coop': coops[0]},
            {'full_name': 'Jane Smith', 'phone': '254700000002', 'address': '0x' + '2' * 40, 'coop': coops[0]},
            {'full_name': 'Samuel Kamau', 'phone': '254700000003', 'address': '0x' + '3' * 40, 'coop': coops[1]},
            {'full_name': 'Mary Wambui', 'phone': '254700000004', 'address': '0x' + '4' * 40, 'coop': coops[1]},
        ]
        farmers = []
        for f_data in farmers_data:
            farmer, _ = FarmerProfile.objects.get_or_create(
                celo_address=f_data['address'],
                defaults={
                    'full_name': f_data['full_name'],
                    'phone_number': f_data['phone'],
                    'cooperative': f_data['coop'],
                    'is_verified': True,
                    'credit_score': random.randint(600, 850)
                }
            )
            farmers.append(farmer)
        self.stdout.write(self.style.SUCCESS(f"{len(farmers)} farmer profiles created."))

        # 6. Create Plots with JSON Boundaries
        def get_dummy_boundary(lat, lon, size=0.005):
            # Returns a GeoJSON-style Polygon dictionary
            return {
                "type": "Polygon",
                "coordinates": [[
                    [lon, lat],
                    [lon + size, lat],
                    [lon + size, lat + size],
                    [lon, lat + size],
                    [lon, lat]
                ]]
            }

        for i, farmer in enumerate(farmers):
            Plot.objects.get_or_create(
                farmer=farmer,
                name=f"{farmer.full_name}'s Main Plot",
                defaults={
                    'cooperative': farmer.cooperative,
                    'boundary': get_dummy_boundary(-0.4 + (i * 0.05), 36.9 + (i * 0.05)),
                    'area_hectares': 2.5 + i,
                    'is_eudr_compliant': True
                }
            )
        self.stdout.write(self.style.SUCCESS("Plots created with simplified JSON boundaries."))

        # 7. Create Farm Events
        event_types = ['PLANTING', 'SPRAYING', 'INSPECTION']
        plots = Plot.objects.all()
        for plot in plots:
            for etype in event_types:
                FarmEvent.objects.create(
                    event_type=etype,
                    plot=plot,
                    farmer=plot.farmer,
                    timestamp=timezone.now() - timezone.timedelta(days=random.randint(1, 60)),
                    location={"type": "Point", "coordinates": plot.boundary['coordinates'][0][0]},
                    quality_grade=random.choice(['A', 'B', 'C']),
                    notes=f"Periodic {etype.lower()} task performed successfully."
                )
        self.stdout.write(self.style.SUCCESS(f"{FarmEvent.objects.count()} farm events created."))

        # 8. Create On-Chain Harvests
        for i, farmer in enumerate(farmers):
            OnChainHarvest.objects.get_or_create(
                record_id=1000 + i,
                defaults={
                    'farmer_address': farmer.celo_address,
                    'farmer_id': str(farmer.id),
                    'crop_type': 'Arabica Coffee',
                    'weight_kg': 500.0 + (i * 100),
                    'location': f"Station {1+i}, {farmer.cooperative.name}",
                    'status': random.choice([1, 1, 3]), # Verified or Paid
                    'payout_amount_cusd': 150.0 + (i * 20),
                    'verified_at': timezone.now() - timezone.timedelta(days=i)
                }
            )
        self.stdout.write(self.style.SUCCESS("Harvest records seeded."))

        self.stdout.write(self.style.SUCCESS("\nDatabase seeded successfully!"))
        self.stdout.write(self.style.NOTICE("\nCredentials for testing:"))
        self.stdout.write("Admin: admin / Vunachain2024!")
        for p in personas:
            self.stdout.write(f"{p['group']}: {p['username']} / {password}")
