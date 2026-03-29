"""
seed_full.py
-----------------------------
Full end-to-end seed command for the Vunachain platform.

Covers ALL user personas:
  - System Admin (superuser, Django admin access)
  - GIS Admin (internal staff)
  - Customer Support (internal staff)
  - Cooperative Manager (coop-scoped management)
  - Field Agent (harvest & event logging)
  - Agronomist (crop advisory, map view)
  - Offtaker (supply contracts, batch discovery)
  - Auditor (read-only compliance view)

Context: Kenyan Arabica Coffee supply chain (Nyeri + Kirinyaga highlands)
Password for all test accounts: Vunachain2024!
"""
import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from blockchain_sync.models import (
    Cooperative, FarmerProfile, Plot, FarmEvent,
    OnChainHarvest, MerkleBatchModel, SupplyContract
)

PASSWORD = 'Vunachain2024!'
VALID_EVENT_TYPES = ['PLANTING', 'SPRAYING', 'HARVESTING', 'INSPECTION', 'OTHER']
VALID_GRADES = ['A', 'B', 'C']


class Command(BaseCommand):
    help = 'Full end-to-end seed of dummy data for all Vunachain user personas'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n🌱 Starting Vunachain Full Seed (Kenyan Coffee Context)...\n'))

        # ──────────────────────────────────────────────
        # STEP 1: Roles / Groups
        # ──────────────────────────────────────────────
        self.stdout.write('Step 1/8 — Setting up roles...')
        call_command('setup_roles', verbosity=0)

        # Create additional internal-staff groups not covered by setup_roles
        gis_group, _ = Group.objects.get_or_create(name='GIS Admin')
        support_group, _ = Group.objects.get_or_create(name='Customer Support')
        sys_admin_group, _ = Group.objects.get_or_create(name='System Admin')

        # GIS Admin: full CRUD on plots
        plot_ct = ContentType.objects.get_for_model(Plot)
        gis_group.permissions.set(Permission.objects.filter(content_type=plot_ct))

        # Customer Support: view + change on farmers
        farmer_ct = ContentType.objects.get_for_model(FarmerProfile)
        support_group.permissions.set(Permission.objects.filter(
            content_type=farmer_ct, codename__in=['view_farmerprofile', 'change_farmerprofile']
        ))
        self.stdout.write(self.style.SUCCESS('  ✔ Groups: Auditor, CoopManager, FieldAgent, Agronomist, Offtaker, GIS Admin, Customer Support, System Admin'))

        # ──────────────────────────────────────────────
        # STEP 2: Users
        # ──────────────────────────────────────────────
        self.stdout.write('Step 2/8 — Creating persona users...')

        persona_map = [
            # (username, email, group_names, is_staff, is_superuser)
            ('admin',         'admin@vunachain.com',         ['System Admin'],       True,  True),
            ('gis_admin',     'gis@vunachain.com',           ['GIS Admin'],          True,  False),
            ('support',       'support@vunachain.com',       ['Customer Support'],   True,  False),
            ('CoopManager1',  'cm1@vunachain.com',           ['CoopManager'],        False, False),
            ('CoopManager2',  'cm2@vunachain.com',           ['CoopManager'],        False, False),
            ('FieldAgent1',   'fa1@vunachain.com',           ['FieldAgent'],         False, False),
            ('FieldAgent2',   'fa2@vunachain.com',           ['FieldAgent'],         False, False),
            ('Agro1',         'agro1@vunachain.com',         ['Agronomist'],         False, False),
            ('Offtaker1',     'offtaker1@vunachain.com',     ['Offtaker'],           False, False),
            ('Auditor1',      'auditor1@vunachain.com',      ['Auditor'],            False, False),
        ]

        user_objects = {}
        for username, email, groups, is_staff, is_superuser in persona_map:
            user, created = User.objects.get_or_create(username=username)
            if created or not user.has_usable_password():
                user.set_password(PASSWORD)
            user.email = email
            user.is_staff = is_staff
            user.is_superuser = is_superuser
            user.save()
            for gname in groups:
                grp = Group.objects.get(name=gname)
                user.groups.add(grp)
            user_objects[username] = user
            status = 'created' if created else 'updated'
            self.stdout.write(f'  ✔ [{status}] {username} → {", ".join(groups)}')

        # ──────────────────────────────────────────────
        # STEP 3: Cooperatives
        # ──────────────────────────────────────────────
        self.stdout.write('Step 3/8 — Seeding Kenyan coffee cooperatives...')
        coops_raw = [
            ('Nyeri Highlands Farmers Cooperative',  'Nyeri County, Kenya',     'CoopManager1'),
            ('Kirinyaga Coffee Growers Society',      'Kirinyaga County, Kenya', 'CoopManager2'),
        ]
        coops = []
        for name, location, manager_username in coops_raw:
            coop, _ = Cooperative.objects.get_or_create(
                name=name,
                defaults={'location': location, 'manager': user_objects[manager_username]}
            )
            coop.manager = user_objects[manager_username]
            coop.save()
            coops.append(coop)
            self.stdout.write(f'  ✔ Coop: {name} (Manager: {manager_username})')

        # ──────────────────────────────────────────────
        # STEP 4: Farmer Profiles
        # ──────────────────────────────────────────────
        self.stdout.write('Step 4/8 — Registering farmers...')

        # Nyeri coop farmers
        nyeri_farmers_raw = [
            ('Kamau Mwangi',    '254712345678', '0x' + 'a1' * 20),
            ('Wanjiku Njoroge', '254723456789', '0x' + 'a2' * 20),
            ('James Mungai',    '254734567890', '0x' + 'a3' * 20),
        ]
        # Kirinyaga coop farmers
        kirinyaga_farmers_raw = [
            ('Akinyi Otieno',   '254745678901', '0x' + 'b1' * 20),
            ('Samuel Kariuki',  '254756789012', '0x' + 'b2' * 20),
            ('Mary Wangari',    '254767890123', '0x' + 'b3' * 20),
        ]

        all_farmer_raw = [(r, coops[0]) for r in nyeri_farmers_raw] + \
                          [(r, coops[1]) for r in kirinyaga_farmers_raw]

        farmers = []
        for (name, phone, addr), coop in all_farmer_raw:
            farmer, _ = FarmerProfile.objects.get_or_create(
                celo_address=addr,
                defaults={
                    'full_name': name,
                    'phone_number': phone,
                    'cooperative': coop,
                    'is_verified': True,
                    'credit_score': random.randint(600, 900),
                    'kyc_data': {
                        'national_id': 'KE' + str(random.randint(10000000, 99999999)),
                        'region': coop.location,
                        'variety': random.choice(['SL28', 'SL34', 'Ruiru 11']),
                        'altitude_m': random.randint(1500, 2200)
                    }
                }
            )
            farmers.append(farmer)
        self.stdout.write(f'  ✔ {len(farmers)} farmer profiles seeded')

        # ──────────────────────────────────────────────
        # STEP 5: Plots with GeoJSON Boundaries
        # ──────────────────────────────────────────────
        self.stdout.write('Step 5/8 — Generating plots with GeoJSON boundaries...')

        # Realistic Nyeri/Kirinyaga coordinate clusters
        base_coords = [
            (-0.416, 36.946),  # Nyeri cluster
            (-0.418, 36.951),
            (-0.414, 36.943),
            (-0.672, 37.254),  # Kirinyaga cluster
            (-0.675, 37.258),
            (-0.669, 37.248),
        ]

        plots = []
        for i, farmer in enumerate(farmers):
            lat, lon = base_coords[i % len(base_coords)]
            size = round(random.uniform(0.003, 0.008), 4)
            boundary = {
                "type": "Polygon",
                "coordinates": [[
                    [lon,        lat],
                    [lon + size, lat],
                    [lon + size, lat + size],
                    [lon,        lat + size],
                    [lon,        lat]
                ]]
            }
            plot, _ = Plot.objects.get_or_create(
                farmer=farmer,
                name=f"{farmer.full_name.split()[0]}'s Arabica Block",
                defaults={
                    'cooperative': farmer.cooperative,
                    'boundary': boundary,
                    'area_hectares': round(random.uniform(0.5, 3.5), 2),
                    'is_eudr_compliant': True,
                }
            )
            plots.append(plot)
        self.stdout.write(f'  ✔ {len(plots)} plots seeded with GPS boundaries')

        # ──────────────────────────────────────────────
        # STEP 6: Farm Events
        # ──────────────────────────────────────────────
        self.stdout.write('Step 6/8 — Logging farm events (Field Agent / Agronomist workflows)...')

        event_templates = [
            ('PLANTING',    'SL28 seedlings transplanted. Spacing: 2.7m x 2.7m. Bed prep confirmed.'),
            ('SPRAYING',    'Foliar application of copper fungicide (2g/L). Coverage: full canopy.'),
            ('INSPECTION',  'EUDR compliance check passed. No deforestation markers found.'),
            ('HARVESTING',  'Selective cherry picking. Avg Brix: 22. Sorted Grade A: 80%.'),
            ('OTHER',       'Soil pH test conducted. Result: 6.2. Lime application recommended.'),
        ]

        created_events = 0
        for plot in plots:
            for days_ago in [45, 30, 15, 5]:
                etype, note = random.choice(event_templates)
                FarmEvent.objects.create(
                    event_type=etype,
                    plot=plot,
                    farmer=plot.farmer,
                    timestamp=timezone.now() - timedelta(days=days_ago + random.randint(0, 5)),
                    location={"type": "Point", "coordinates": plot.boundary['coordinates'][0][0]},
                    quality_grade=random.choice(VALID_GRADES + [None]),
                    notes=f"[{plot.cooperative.name}] {note}",
                )
                created_events += 1
        self.stdout.write(f'  ✔ {created_events} farm events logged')

        # ──────────────────────────────────────────────
        # STEP 7: On-Chain Harvests + Merkle Batch
        # ──────────────────────────────────────────────
        self.stdout.write('Step 7/8 — Seeding blockchain harvests and Merkle batch...')

        harvests = []
        for i, farmer in enumerate(farmers):
            harvest, _ = OnChainHarvest.objects.get_or_create(
                record_id=2000 + i,
                defaults={
                    'farmer_address': farmer.celo_address,
                    'farmer_id': str(farmer.id),
                    'crop_type': 'Arabica Coffee',
                    'weight_kg': round(random.uniform(300, 800), 2),
                    'location': f"Wet Mill Station {i+1}, {farmer.cooperative.name}",
                    'status': random.choice([1, 1, 1, 3]),  # mostly Verified or Paid
                    'payout_amount_cusd': round(random.uniform(120, 400), 4),
                    'verified_at': timezone.now() - timedelta(days=random.randint(1, 20)),
                    'transaction_hash': '0x' + ('%064x' % random.getrandbits(256)),
                }
            )
            harvests.append(harvest)

        # Create a single Merkle batch grouping verified harvests
        batch, _ = MerkleBatchModel.objects.get_or_create(
            merkle_root='0x' + 'cafe' * 16,
            defaults={
                'total_records': len(harvests),
                'total_amount_cusd': sum(h.payout_amount_cusd for h in harvests),
                'transaction_hash': '0x' + 'dead' * 16,
                'status': 'CONFIRMED',
                'is_distributed': False,
            }
        )
        self.stdout.write(f'  ✔ {len(harvests)} harvests seeded | Merkle batch: {batch.merkle_root[:14]}...')

        # ──────────────────────────────────────────────
        # STEP 8: Supply Contracts (Offtaker Workflow)
        # ──────────────────────────────────────────────
        self.stdout.write('Step 8/8 — Creating supply contracts (Offtaker workflow)...')

        contracts_raw = [
            {
                'commodity': 'Premium Washed Arabica (Nyeri AA)',
                'buyer': user_objects['Offtaker1'],
                'cooperative': coops[0],
                'target_volume_kg': 5000,
                'price_per_kg_cusd': 4.75,
                'status': 'ACTIVE',
                'quality_specs': 'Grade: AA | Moisture: <11% | Screen: 18+ | Certs: EUDR, Rainforest Alliance',
                'deadline_days': 60,
            },
            {
                'commodity': 'Natural Process Arabica (Kirinyaga AB)',
                'buyer': user_objects['Offtaker1'],
                'cooperative': coops[1],
                'target_volume_kg': 3000,
                'price_per_kg_cusd': 5.20,
                'status': 'OPEN',
                'quality_specs': 'Grade: AB | Moisture: <12% | Screen: 16+ | Certs: Fairtrade, EUDR',
                'deadline_days': 90,
            },
            {
                'commodity': 'Robusta Blend (Bulk)',
                'buyer': user_objects['Offtaker1'],
                'cooperative': None,
                'target_volume_kg': 10000,
                'price_per_kg_cusd': 2.80,
                'status': 'DRAFT',
                'quality_specs': 'Grade: B | Moisture: <13% | No specific cert required',
                'deadline_days': 120,
            },
        ]

        for c in contracts_raw:
            SupplyContract.objects.get_or_create(
                commodity=c['commodity'],
                buyer=c['buyer'],
                defaults={
                    'cooperative': c['cooperative'],
                    'target_volume_kg': c['target_volume_kg'],
                    'price_per_kg_cusd': c['price_per_kg_cusd'],
                    'status': c['status'],
                    'quality_specs': c['quality_specs'],
                    'deadline': timezone.now().date() + timedelta(days=c['deadline_days']),
                }
            )
        self.stdout.write(f'  ✔ {len(contracts_raw)} supply contracts seeded')

        # ──────────────────────────────────────────────
        # SUMMARY
        # ──────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('\n✅ Full seed complete!\n'))
        self.stdout.write(self.style.NOTICE('─' * 60))
        self.stdout.write(self.style.NOTICE('  LOGIN CREDENTIALS (password: Vunachain2024!)'))
        self.stdout.write(self.style.NOTICE('─' * 60))
        rows = [
            ('System Admin',      'admin',        'Django admin panel + all dashboards'),
            ('GIS Admin',         'gis_admin',    'Plot management, map layer access'),
            ('Customer Support',  'support',      'Farmer lookup and profile edits'),
            ('Coop Manager 1',    'CoopManager1', 'Nyeri Highlands coop dashboard'),
            ('Coop Manager 2',    'CoopManager2', 'Kirinyaga coop dashboard'),
            ('Field Agent 1',     'FieldAgent1',  'Harvest logging, farm events'),
            ('Field Agent 2',     'FieldAgent2',  'Harvest logging, farm events'),
            ('Agronomist',        'Agro1',        'Geospatial map, crop advisories'),
            ('Offtaker',          'Offtaker1',    'Supply contracts, batch discovery'),
            ('Auditor',           'Auditor1',     'Read-only compliance view'),
        ]
        for role, uname, access in rows:
            self.stdout.write(f'  {role:<20} | {uname:<15} | {access}')
        self.stdout.write(self.style.NOTICE('─' * 60))
        self.stdout.write('')
