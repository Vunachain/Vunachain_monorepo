import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from blockchain_sync.models import Cooperative, FarmerProfile, Plot, FarmEvent, SupplyContract

def seed_data():
    print("Initializing Kenyan Coffee Context Seed...")

    # 1. Groups & Roles
    print("Creating System Admin, GIS Admin, and Customer Support groups...")
    gis_group, _ = Group.objects.get_or_create(name='GIS Admin')
    support_group, _ = Group.objects.get_or_create(name='Customer Support')
    sys_admin_group, _ = Group.objects.get_or_create(name='System Admin')

    # Give GIS Admin view/change plot permissions
    plot_ct = ContentType.objects.get_for_model(Plot)
    gis_permissions = Permission.objects.filter(content_type=plot_ct)
    gis_group.permissions.add(*gis_permissions)

    # Give Support view/change farmer permissions
    farmer_ct = ContentType.objects.get_for_model(FarmerProfile)
    support_permissions = Permission.objects.filter(content_type=farmer_ct)
    support_group.permissions.add(*support_permissions)

    # Superuser 'admin' setup
    admin_user, created = User.objects.get_or_create(username='admin')
    if created:
        admin_user.set_password('Vunachain2024!')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("Created default admin user (admin/Vunachain2024!)")

    manager2, created2 = User.objects.get_or_create(username='coop2_manager')
    if created2:
        manager2.set_password('Vunachain2024!')
        manager2.save()

    # 2. Cooperatives
    print("Generating Kenyan Coffee Cooperatives...")
    Cooperative.objects.all().delete()
    coop1, _ = Cooperative.objects.get_or_create(
        name="Nyeri Farmers Cooperative Society", 
        location="Nyeri County, Kenya",
        manager=admin_user
    )
    coop2, _ = Cooperative.objects.get_or_create(
        name="Mt. Elgon Organic Coffee Growers", 
        location="Bungoma County, Kenya",
        manager=manager2
    )

    # 3. Farmers
    print("Registering local farmers...")
    FarmerProfile.objects.all().delete()
    celo_base = "0x" + "1" * 39
    farmers_data = [
        ("Kamau Mwangi", "0712345678", coop1, celo_base + "1"),
        ("Wanjiku Njoroge", "0723456789", coop1, celo_base + "2"),
        ("Omondi Otieno", "0734567890", coop2, celo_base + "3"),
        ("Akinyi Oloo", "0745678901", coop2, celo_base + "4"),
    ]

    farmers = []
    for (name, phone, coop, acc) in farmers_data:
        f = FarmerProfile.objects.create(
            full_name=name,
            phone_number=phone,
            cooperative=coop,
            celo_address=acc,
            is_verified=True,
            credit_score=random.randint(650, 850),
            kyc_data={"national_id": "ID" + str(random.randint(100000, 999999)), "region": "Kenya Highlands"}
        )
        farmers.append(f)

    # 4. Plots
    print("Generating plots and GPS boundaries...")
    Plot.objects.all().delete()
    
    # Simple rectangular polygon bounds around Nyeri (approx 36.9E, 0.4S)
    nyeri_polygon = {
        "type": "Polygon",
        "coordinates": [[
            [36.90, -0.40],
            [36.90, -0.41],
            [36.91, -0.41],
            [36.91, -0.40],
            [36.90, -0.40]
        ]]
    }
    
    plots = []
    for f in farmers:
        plot = Plot.objects.create(
            farmer=f,
            cooperative=f.cooperative,
            name=f"{f.full_name}'s Arabica Block",
            boundary=nyeri_polygon,
            area_hectares=round(random.uniform(0.5, 3.5), 2),
            is_eudr_compliant=True
        )
        plots.append(plot)

    # 5. Farm Events (Agronomy & Field tracking)
    print("Simulating event pipeline (Input Applications, Soil Tests)...")
    FarmEvent.objects.all().delete()
    event_types = ['INPUT_APPLICATION', 'SOIL_TEST', 'INSPECTION']
    for p in plots:
        for _ in range(2):
            ev_type = random.choice(event_types)
            FarmEvent.objects.create(
                event_type=ev_type,
                plot=p,
                farmer=p.farmer,
                timestamp=timezone.now() - timedelta(days=random.randint(1, 30)),
                quality_grade=random.choice(['A', 'B', None]),
                notes=f"Logged {ev_type} on {p.name}. Variety: SL28 / SL34. Altitude >1700m."
            )

    # 6. Supply Contracts (Offtaker Needs)
    print("Creating Offtaker Supply Contracts...")
    SupplyContract.objects.all().delete()
    SupplyContract.objects.create(
        commodity="Premium Arabica Coffee (Washed)",
        buyer=admin_user,
        cooperative=coop1,
        target_volume_kg=5000,
        price_per_kg_cusd=4.50,
        status='ACTIVE',
        quality_specs='Grade: AA | Moisture: <11% | Certs: EUDR, Rainforest Alliance | Notes: SL28 variety only.',
        deadline=timezone.now().date() + timedelta(days=60)
    )
    SupplyContract.objects.create(
        commodity="Specialty Arabica Coffee (Natural)",
        buyer=admin_user,
        cooperative=coop2,
        target_volume_kg=3000,
        price_per_kg_cusd=5.20,
        status='OPEN',
        quality_specs='Grade: AB | Moisture: <12% | Certs: Fairtrade, EUDR',
        deadline=timezone.now().date() + timedelta(days=90)
    )

    print("Success! Kenyan Coffee Context Seed Complete.")

if __name__ == "__main__":
    seed_data()
