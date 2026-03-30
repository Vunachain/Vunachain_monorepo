import os
import django
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User, Group
from django.core.management.base import BaseCommand

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from blockchain_sync.models import Cooperative, FarmerProfile, Plot, FarmEvent, SupplyContract, OnChainHarvest, MerkleBatchModel, MpesaPayout
from user_management.models import UserProfile, UserSettings

class Command(BaseCommand):
    help = 'Seeds a production-grade dataset for supply chain simulation and profile management.'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting high-fidelity production seeding...")

        # 0. Cleanup
        self.stdout.write("Cleaning up existing data...")
        MpesaPayout.objects.all().delete()
        OnChainHarvest.objects.all().delete()
        MerkleBatchModel.objects.all().delete()
        FarmEvent.objects.all().delete()
        Plot.objects.all().delete()
        FarmerProfile.objects.all().delete()
        SupplyContract.objects.all().delete()
        Cooperative.objects.all().delete()
        UserProfile.objects.all().delete()
        UserSettings.objects.all().delete()
        
        # 0. Groups Setup
        self.stdout.write("Configuring permission groups...")
        coop_group, _ = Group.objects.get_or_create(name='CoopManager')
        offtaker_group, _ = Group.objects.get_or_create(name='Offtaker')
        agent_group, _ = Group.objects.get_or_create(name='FieldAgent')
        agro_group, _ = Group.objects.get_or_create(name='Agronomist')
        auditor_group, _ = Group.objects.get_or_create(name='Auditor')

        # 0.1 Cleanup
        self.stdout.write("Cleaning up existing data...")
        
        nyeri_manager, _ = User.objects.get_or_create(username='nyeri_admin', defaults={'email': 'manager@nyericoop.com'})
        nyeri_manager.set_password('Vunachain2024!')
        nyeri_manager.groups.add(coop_group)
        nyeri_manager.save()
        self.create_profile_and_settings(nyeri_manager, "Nyeri Cooperative Manager", "Agricultural lead with 15 years experience in the Central Highlands.")
        
        elgon_manager, _ = User.objects.get_or_create(username='elgon_admin', defaults={'email': 'ops@elgoncoffee.com'})
        elgon_manager.set_password('Vunachain2024!')
        elgon_manager.groups.add(coop_group)
        elgon_manager.save()
        self.create_profile_and_settings(elgon_manager, "Mt. Elgon Operations Head", "Expert in organic coffee certification and cooperative governance.")

        coop_nyeri = Cooperative.objects.create(name="Nyeri Farmers Cooperative Society", location="Nyeri Town, Central Kenya", manager=nyeri_manager)
        coop_elgon = Cooperative.objects.create(name="Mt. Elgon Organic Coffee Growers", location="Chwele, Bungoma County, Kenya", manager=elgon_manager)

        # 2. Create Offtakers & Contracts
        self.stdout.write("Initializing Offtakers and Supply Contracts...")
        
        buyer1, _ = User.objects.get_or_create(username='coffee_intl_buyer', defaults={'email': 'sourcing@coffeeintl.com'})
        buyer1.set_password('Vunachain2024!')
        buyer1.groups.add(offtaker_group)
        buyer1.save()
        self.create_profile_and_settings(buyer1, "Global Sourcing Director")

        buyer2, _ = User.objects.get_or_create(username='global_grains_offtaker', defaults={'email': 'ops@globalgrains.com'})
        buyer2.set_password('Vunachain2024!')
        buyer2.groups.add(offtaker_group)
        buyer2.save()
        self.create_profile_and_settings(buyer2, "Supply Chain Analyst")

        # Contracts for Nyeri
        SupplyContract.objects.create(
            buyer=buyer1, cooperative=coop_nyeri, commodity="Premium Arabica (Washed)", 
            target_volume_kg=15000, price_per_kg_cusd=4.75, status='COMPLETED', deadline=timezone.now().date() - timedelta(days=30)
        )
        SupplyContract.objects.create(
            buyer=buyer1, cooperative=coop_nyeri, commodity="Premium Arabica (SL28)", 
            target_volume_kg=10000, price_per_kg_cusd=5.10, status='ACTIVE', deadline=timezone.now().date() + timedelta(days=45)
        )
        # Contracts for Elgon
        SupplyContract.objects.create(
            buyer=buyer2, cooperative=coop_elgon, commodity="Organic Specialty Coffee", 
            target_volume_kg=8000, price_per_kg_cusd=5.50, status='ACTIVE', deadline=timezone.now().date() + timedelta(days=60)
        )
        SupplyContract.objects.create(
            buyer=buyer2, cooperative=coop_elgon, commodity="Natural Process Arabica", 
            target_volume_kg=12000, price_per_kg_cusd=4.90, status='OPEN', deadline=timezone.now().date() + timedelta(days=90)
        )

        # 3. Create Farmers & Plots (30 per Coop)
        self.stdout.write("Registering 60+ Farmers and generating Geo-data...")
        
        self.seed_farmers(coop_nyeri, 30, (36.95, -0.42)) # Near Nyeri
        self.seed_farmers(coop_elgon, 30, (34.55, 0.78)) # Near Mt Elgon

        # 4. Workflow Simulation (Historical Records)
        self.stdout.write("Simulating historical events and payouts...")
        self.simulate_workflow_history(coop_nyeri)
        self.simulate_workflow_history(coop_elgon)

        self.stdout.write(self.style.SUCCESS("Successfully seeded high-fidelity production dataset."))

    def create_profile_and_settings(self, user, position="", bio=""):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.position = position
        profile.bio = bio
        profile.phone_number = f"+254 7{random.randint(10, 99)} {random.randint(100,999)} {random.randint(100,999)}"
        profile.avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}"
        profile.save()
        
        UserSettings.objects.get_or_create(user=user, defaults={'theme_preference': 'DARK' if random.random() > 0.5 else 'LIGHT'})

    def seed_farmers(self, coop, count, center):
        lng_c, lat_c = center
        for i in range(count):
            username = f"{coop.name[:3].lower()}_farmer_{i+1}"
            first_name = random.choice(["John", "Mary", "Peter", "Jane", "Alice", "David", "Grace", "Sam"])
            last_name = random.choice(["Kamau", "Ochieng", "Njoroge", "Musa", "Wambui", "Kibet", "Muthoni"])
            
            user, _ = User.objects.get_or_create(username=username, defaults={'email': f"{username}@example.com"})
            user.first_name = first_name
            user.last_name = last_name
            user.set_password('Farmer2024!')
            user.save()
            
            self.create_profile_and_settings(user, "Farmer", f"Smallholder farmer registered with {coop.name}.")
            
            farmer = FarmerProfile.objects.create(
                celo_address="0x" + "".join([random.choice("0123456789abcdef") for _ in range(40)]),
                phone_number=f"2547{random.randint(10000000, 99999999)}",
                full_name=f"{first_name} {last_name}",
                cooperative=coop,
                national_id=f"ID{random.randint(1000000, 9999999)}",
                is_verified=True,
                credit_score=random.randint(400, 900)
            )
            
            # Plot logic
            area = round(random.uniform(0.5, 12.0), 2)
            # Distribution: Most small, few large (approx 10-15%)
            if i % 8 == 0: area = round(random.uniform(4.1, 15.0), 2)
            else: area = round(random.uniform(0.5, 3.9), 2)
            
            lng = lng_c + random.uniform(-0.01, 0.01)
            lat = lat_c + random.uniform(-0.01, 0.01)
            
            boundary = {}
            if area < 4.0:
                # Rule: Centroid for < 4 Ha
                boundary = {"type": "Point", "coordinates": [lng, lat]}
            else:
                # Rule: Trace Preexisting boundaries (10 points)
                # Create a jittered polygon around the center
                points = []
                for angle in range(0, 360, 36): # 10 points
                    dist = random.uniform(0.001, 0.003)
                    import math
                    px = lng + dist * math.cos(math.radians(angle))
                    py = lat + dist * math.sin(math.radians(angle))
                    points.append([px, py])
                points.append(points[0]) # Close polygon
                boundary = {"type": "Polygon", "coordinates": [points]}
            
            Plot.objects.create(
                farmer=farmer, cooperative=coop, name=f"{farmer.full_name}'s Main Plot",
                boundary=boundary, area_hectares=area, is_eudr_compliant=True
            )

    def simulate_workflow_history(self, coop):
        # Pick 5 farmers per coop to have recent history
        targeted_farmers = coop.farmers.all()[:5]
        for f in targeted_farmers:
            plot = f.plots.first()
            # 1. Historical Harvest & Payout
            batch = MerkleBatchModel.objects.create(
                merkle_root="0x" + "".join([random.choice("0123456789abcdef") for _ in range(64)]),
                total_records=1, total_amount_cusd=random.randint(200, 500), status='CONFIRMED', is_distributed=True
            )
            
            harvest = OnChainHarvest.objects.create(
                record_id=random.randint(10000, 99999), farmer_address=f.celo_address,
                crop_type="Coffee", weight_kg=random.randint(100, 1000), 
                location="Generated Origin", status=3, # Paid
                payout_amount_cusd=batch.total_amount_cusd, batch=batch, verified_at=timezone.now() - timedelta(days=15)
            )
            
            MpesaPayout.objects.create(
                harvest=harvest, phone_number=f.phone_number, amount_kes=int(harvest.payout_amount_cusd) * 150,
                status='COMPLETED', conversion_rate=150.0, completed_at=timezone.now() - timedelta(days=14)
            )
            
            # 2. Recent Events
            FarmEvent.objects.create(
                event_type='INSPECTION', plot=plot, farmer=f, timestamp=timezone.now() - timedelta(days=5),
                quality_grade='A', notes="Pre-harvest inspection complete. Satellite data confirms zero deforestation."
            )
            FarmEvent.objects.create(
                event_type='PLANTING', plot=plot, farmer=f, timestamp=timezone.now() - timedelta(days=120),
                notes="Seasonal planting of SL28 seedlings completed under shade-grown canopy."
            )
