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
import decimal
from decimal import Decimal
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from blockchain_sync.models import (
    Cooperative, FarmerProfile, Plot, FarmEvent,
    OnChainHarvest, MerkleBatchModel, SupplyContract, MpesaPayout
)

PASSWORD = 'Vunachain2024!'
VALID_EVENT_TYPES = ['PLANTING', 'SPRAYING', 'HARVESTING', 'INSPECTION', 'OTHER']
VALID_GRADES = ['A', 'B', 'C']


class Command(BaseCommand):
    help = 'Full end-to-end seed of dummy data for all Vunachain user personas'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\nStarting Vunachain Full Seed (Kenyan Coffee Context)...\n'))

        # ──────────────────────────────────────────────
        # STEP 1: Roles / Groups
        # ──────────────────────────────────────────────
        self.stdout.write('Step 1/10 — Setting up roles...')
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
        self.stdout.write(self.style.SUCCESS('  Groups ready: Auditor, CoopManager, FieldAgent, Agronomist, Offtaker, GIS Admin, Customer Support, System Admin'))

        # ──────────────────────────────────────────────
        # STEP 2: Users
        # ──────────────────────────────────────────────
        self.stdout.write('Step 2/10 — Creating persona users...')

        persona_map = [
            # (username, email, group_names, is_staff, is_superuser)
            ('admin',                  'admin@vunachain.com',          ['System Admin'],       True,  True),
            ('gis_admin',              'gis@vunachain.com',            ['GIS Admin'],          True,  False),
            ('support',                'support@vunachain.com',        ['Customer Support'],   True,  False),
            ('nyeri_admin',            'nyeri@vunachain.com',          ['CoopManager'],        False, False),
            ('elgon_admin',            'elgon@vunachain.com',          ['CoopManager'],        False, False),
            ('field_agent',            'fa1@vunachain.com',            ['FieldAgent'],         False, False),
            ('field_agent_2',          'fa2@vunachain.com',            ['FieldAgent'],         False, False),
            ('agronomist',             'agro1@vunachain.com',          ['Agronomist'],         False, False),
            ('coffee_intl_buyer',      'sourcing@coffeeintl.com',      ['Offtaker'],           False, False),
            ('global_grains_offtaker', 'ops@globalgrains.com',         ['Offtaker'],           False, False),
            ('auditor',                'auditor1@vunachain.com',       ['Auditor'],            False, False),
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
            self.stdout.write(f'  [{status}] {username} -> {", ".join(groups)}')

        # ──────────────────────────────────────────────
        # STEP 3: Cooperatives
        # ──────────────────────────────────────────────
        self.stdout.write('Step 3/10 — Seeding Kenyan coffee cooperatives...')
        coops_raw = [
            ('Nyeri Highlands Farmers Cooperative',  'Nyeri County, Kenya',     'nyeri_admin'),
            ('Kirinyaga Coffee Growers Society',      'Kirinyaga County, Kenya', 'elgon_admin'),
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
            self.stdout.write(f'  Coop: {name} (Manager: {manager_username})')

        nyeri_coop = coops[0]
        kirinyaga_coop = coops[1]

        # ──────────────────────────────────────────────
        # STEP 4: Farmer Profiles (30 per cooperative = 60 total)
        # ──────────────────────────────────────────────
        self.stdout.write('Step 4/10 — Registering 60 farmers (30 per cooperative)...')

        nyeri_names = [
            ('Kamau Mwangi',      '254712345678'),
            ('Wanjiku Njoroge',   '254723456789'),
            ('James Mungai',      '254734567890'),
            ('Joseph Kibura',     '254745111222'),
            ('Grace Wangari',     '254756222333'),
            ('Daniel Kariuki',    '254767333444'),
            ('Mary Njeri',        '254778444555'),
            ('Peter Waweru',      '254789555666'),
            ('Ann Wambui',        '254700666777'),
            ('John Githiga',      '254711777888'),
            ('Susan Muthoni',     '254722888999'),
            ('Paul Gichohi',      '254733999000'),
            ('Elizabeth Wairimu', '254744100200'),
            ('Moses Githinji',    '254755200300'),
            ('Ruth Wanjiru',      '254766300400'),
            ('Simon Ndegwa',      '254777400500'),
            ('Alice Nyambura',    '254788500600'),
            ('Michael Gitau',     '254799600700'),
            ('Florence Waithira', '254700700800'),
            ('Samuel Maina',      '254711800900'),
            ('Caroline Muriithi', '254722900100'),
            ('David Kamau',       '254733010101'),
            ('Agnes Wachira',     '254744020202'),
            ('Thomas Ndiritu',    '254755030303'),
            ('Esther Githae',     '254766040404'),
            ('George Muchai',     '254777050505'),
            ('Jane Kimani',       '254788060606'),
            ('Philip Karanja',    '254799070707'),
            ('Anne Muiruri',      '254700080808'),
            ('Charles Wahome',    '254711090909'),
        ]

        kirinyaga_names = [
            ('Akinyi Otieno',     '254745678901'),
            ('Samuel Kariuki',    '254756789012'),
            ('Mary Wangari',      '254767890123'),
            ('Francis Muriuki',   '254778001002'),
            ('Purity Wanjiku',    '254789002003'),
            ('Joseph Irungu',     '254700003004'),
            ('Rachel Kagendo',    '254711004005'),
            ('Patrick Mwenda',    '254722005006'),
            ('Joyce Karimi',      '254733006007'),
            ('Kenneth Gacheru',   '254744007008'),
            ('Faith Wanjiku',     '254755008009'),
            ('Collins Githinji',  '254766009010'),
            ('Millicent Njoki',   '254777010011'),
            ('Allan Kirui',       '254788011012'),
            ('Beatrice Wambui',   '254799012013'),
            ('Peter Kamando',     '254700013014'),
            ('Lydia Mwangi',      '254711014015'),
            ('Justin Muturi',     '254722015016'),
            ('Grace Njoroge',     '254733016017'),
            ('Henry Njogu',       '254744017018'),
            ('Rose Wachira',      '254755018019'),
            ('Vincent Kariuki',   '254766019020'),
            ('Esther Kamau',      '254777020021'),
            ('Edwin Njoroge',     '254788021022'),
            ('Mary Ngugi',        '254799022023'),
            ('Wilson Mwangi',     '254700023024'),
            ('Catherine Karuri',  '254711024025'),
            ('Robert Kimani',     '254722025026'),
            ('Helen Wainaina',    '254733026027'),
            ('Stephen Gitonga',   '254744027028'),
        ]

        # Celo addresses: Nyeri farmers use hex(i+1).zfill(40), Kirinyaga use hex(i+31).zfill(40)
        farmers = []

        for i, (name, phone) in enumerate(nyeri_names):
            addr = '0x' + hex(i + 1)[2:].zfill(40)
            variety = random.choice(['SL28', 'SL34', 'Ruiru 11', 'Batian'])
            farmer, _ = FarmerProfile.objects.get_or_create(
                celo_address=addr,
                defaults={
                    'full_name': name,
                    'phone_number': phone,
                    'cooperative': nyeri_coop,
                    'is_verified': True,
                    'credit_score': random.randint(600, 900),
                    'kyc_data': {
                        'national_id': 'KE' + str(random.randint(10000000, 99999999)),
                        'region': 'Nyeri County, Kenya',
                        'variety': variety,
                        'altitude_m': random.randint(1600, 2200),
                    }
                }
            )
            farmers.append((farmer, 'nyeri', i))

        for i, (name, phone) in enumerate(kirinyaga_names):
            addr = '0x' + hex(i + 31)[2:].zfill(40)
            variety = random.choice(['SL28', 'SL34', 'Ruiru 11', 'K7'])
            farmer, _ = FarmerProfile.objects.get_or_create(
                celo_address=addr,
                defaults={
                    'full_name': name,
                    'phone_number': phone,
                    'cooperative': kirinyaga_coop,
                    'is_verified': True,
                    'credit_score': random.randint(600, 900),
                    'kyc_data': {
                        'national_id': 'KE' + str(random.randint(10000000, 99999999)),
                        'region': 'Kirinyaga County, Kenya',
                        'variety': variety,
                        'altitude_m': random.randint(1400, 1900),
                    }
                }
            )
            farmers.append((farmer, 'kirinyaga', i))

        self.stdout.write(f'  {len(farmers)} farmer profiles seeded (30 Nyeri + 30 Kirinyaga)')

        # ──────────────────────────────────────────────
        # STEP 5: Plots with Realistic GeoJSON Boundaries
        # ──────────────────────────────────────────────
        self.stdout.write('Step 5/10 — Generating plots with GeoJSON boundaries...')

        # Cluster centres
        NYERI_LAT, NYERI_LON = -0.416, 36.946
        KIRINYAGA_LAT, KIRINYAGA_LON = -0.672, 37.254

        plots = []
        for farmer_obj, cluster, idx in farmers:
            if cluster == 'nyeri':
                base_lat = NYERI_LAT + (idx // 6) * 0.005 + random.uniform(-0.002, 0.002)
                base_lon = NYERI_LON + (idx % 6) * 0.006 + random.uniform(-0.002, 0.002)
            else:
                base_lat = KIRINYAGA_LAT + (idx // 6) * 0.005 + random.uniform(-0.002, 0.002)
                base_lon = KIRINYAGA_LON + (idx % 6) * 0.006 + random.uniform(-0.002, 0.002)

            lat_size = round(random.uniform(0.003, 0.010), 5)
            lon_size = round(random.uniform(0.003, 0.010), 5)
            boundary = {
                "type": "Polygon",
                "coordinates": [[
                    [base_lon,            base_lat],
                    [base_lon + lon_size, base_lat],
                    [base_lon + lon_size, base_lat + lat_size],
                    [base_lon,            base_lat + lat_size],
                    [base_lon,            base_lat],
                ]]
            }
            area = round(random.uniform(0.3, 4.5), 2)
            plot, _ = Plot.objects.get_or_create(
                farmer=farmer_obj,
                name=f"{farmer_obj.full_name.split()[0]}'s Arabica Block",
                defaults={
                    'cooperative': farmer_obj.cooperative,
                    'boundary': boundary,
                    'area_hectares': area,
                    'is_eudr_compliant': True,
                }
            )
            plots.append(plot)

        self.stdout.write(f'  {len(plots)} plots seeded with GPS boundaries')

        # ──────────────────────────────────────────────
        # STEP 6: Farm Events
        # ──────────────────────────────────────────────
        self.stdout.write('Step 6/10 — Logging farm events (Field Agent / Agronomist workflows)...')

        event_templates = [
            ('PLANTING',   'SL28 seedlings transplanted. Spacing: 2.7m x 2.7m. Bed prep confirmed.'),
            ('SPRAYING',   'Foliar application of copper fungicide (2g/L). Coverage: full canopy.'),
            ('INSPECTION', 'EUDR compliance check passed. No deforestation markers found.'),
            ('HARVESTING', 'Selective cherry picking. Avg Brix: 22. Sorted Grade A: 80%.'),
            ('OTHER',      'Soil pH test conducted. Result: 6.2. Lime application recommended.'),
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
        self.stdout.write(f'  {created_events} farm events logged')

        # ──────────────────────────────────────────────
        # STEP 7: On-Chain Harvests (2-3 per farmer)
        # ──────────────────────────────────────────────
        self.stdout.write('Step 7/10 — Seeding on-chain harvest records (2-3 per farmer)...')

        # Status weights: mostly Verified (1) and Paid (3), occasional Pending (0)
        STATUS_POOL = [0, 1, 1, 1, 3, 3, 3]

        harvests = []
        record_counter = 3000

        for farmer_obj, cluster, idx in farmers:
            num_harvests = random.randint(2, 3)
            for h in range(num_harvests):
                days_ago = random.randint(1, 180)
                status = random.choice(STATUS_POOL)
                payout_cusd = Decimal(str(round(random.uniform(80, 600), 4)))
                weight = Decimal(str(round(random.uniform(50, 900), 2)))
                tx_hash = '0x' + ('%064x' % random.getrandbits(256))

                harvest, _ = OnChainHarvest.objects.get_or_create(
                    record_id=record_counter,
                    defaults={
                        'farmer_address': farmer_obj.celo_address,
                        'farmer_id': str(farmer_obj.id),
                        'crop_type': 'Arabica Coffee',
                        'weight_kg': weight,
                        'location': f"Wet Mill Station {idx + 1}, {farmer_obj.cooperative.name}",
                        'status': status,
                        'payout_amount_cusd': payout_cusd,
                        'verified_at': timezone.now() - timedelta(days=days_ago),
                        'transaction_hash': tx_hash,
                    }
                )
                harvests.append(harvest)
                record_counter += 1

        self.stdout.write(f'  {len(harvests)} harvest records seeded (record_ids 3000-{record_counter - 1})')

        # ──────────────────────────────────────────────
        # STEP 8: M-Pesa Payouts for Verified/Paid harvests
        # ──────────────────────────────────────────────
        self.stdout.write('Step 8/10 — Creating M-Pesa payout records...')

        CONVERSION_RATE = Decimal('130.0000')
        payout_count = 0

        # Build a lookup: farmer_address -> phone_number
        address_to_phone = {}
        for farmer_obj, cluster, idx in farmers:
            address_to_phone[farmer_obj.celo_address] = farmer_obj.phone_number

        for harvest in harvests:
            # Only create payouts for Verified (1) or Paid (3) harvests
            if harvest.status not in (1, 3):
                continue

            phone = address_to_phone.get(harvest.farmer_address, '254700000000')
            amount_kes = (harvest.payout_amount_cusd * CONVERSION_RATE).quantize(
                Decimal('0.01'), rounding=decimal.ROUND_HALF_UP
            )

            if harvest.status == 3:
                mpesa_status = 'COMPLETED'
                initiated_at = harvest.verified_at
                completed_at = harvest.verified_at + timedelta(minutes=random.randint(2, 30))
                receipt = 'QK' + str(random.randint(100000000, 999999999))
            else:
                mpesa_status = 'INITIATED'
                initiated_at = harvest.verified_at
                completed_at = None
                receipt = None

            MpesaPayout.objects.get_or_create(
                harvest=harvest,
                defaults={
                    'phone_number': phone,
                    'amount_kes': amount_kes,
                    'status': mpesa_status,
                    'conversion_rate': CONVERSION_RATE,
                    'initiated_at': initiated_at,
                    'completed_at': completed_at,
                    'receipt_number': receipt,
                    'originator_conversation_id': 'OC-' + str(random.randint(100000, 999999)),
                    'conversation_id': 'CV-' + str(random.randint(100000, 999999)),
                    'metadata': {'seed': True, 'batch': 'seed_full'},
                }
            )
            payout_count += 1

        self.stdout.write(f'  {payout_count} M-Pesa payout records created')

        # ──────────────────────────────────────────────
        # STEP 9: Merkle Batches (5 batches, spread over 6 months)
        # ──────────────────────────────────────────────
        self.stdout.write('Step 9/10 — Creating 5 Merkle batches...')

        # Divide harvests into 5 roughly equal groups
        batch_size = max(1, len(harvests) // 5)
        harvest_chunks = [harvests[i:i + batch_size] for i in range(0, len(harvests), batch_size)]
        # Ensure exactly 5 batches (merge any overflow into last)
        while len(harvest_chunks) > 5:
            harvest_chunks[-2].extend(harvest_chunks[-1])
            harvest_chunks.pop()

        batch_roots = [
            '0x' + 'ba7c' * 16,
            '0x' + 'dead' * 16,
            '0x' + 'cafe' * 16,
            '0x' + 'beef' * 16,
            '0x' + 'f00d' * 16,
        ]
        batch_tx_hashes = [
            '0x' + 'ab01' * 16,
            '0x' + 'cd02' * 16,
            '0x' + 'ef03' * 16,
            '0x' + '1234' * 16,
            '0x' + '5678' * 16,
        ]

        created_batches = []
        for b_idx, chunk in enumerate(harvest_chunks):
            months_ago = 6 - b_idx  # oldest batch ~6 months ago, newest ~1 month ago
            batch_date = timezone.now() - timedelta(days=months_ago * 30)
            total_cusd = sum(h.payout_amount_cusd for h in chunk)
            batch, _ = MerkleBatchModel.objects.get_or_create(
                merkle_root=batch_roots[b_idx],
                defaults={
                    'total_records': len(chunk),
                    'total_amount_cusd': total_cusd,
                    'transaction_hash': batch_tx_hashes[b_idx],
                    'status': 'CONFIRMED',
                    'is_distributed': b_idx < 3,  # first 3 batches distributed
                }
            )
            # Link harvests to this batch (only if not already linked)
            for h in chunk:
                if h.batch_id is None:
                    h.batch = batch
                    h.save(update_fields=['batch'])
            created_batches.append(batch)

        self.stdout.write(f'  {len(created_batches)} Merkle batches created, covering {len(harvests)} harvests')

        # ──────────────────────────────────────────────
        # STEP 10: Supply Contracts (Offtaker Workflow)
        # ──────────────────────────────────────────────
        self.stdout.write('Step 10/10 — Creating supply contracts (Offtaker workflow)...')

        # coffee_intl_buyer: 3 ACTIVE + 2 OPEN + 2 COMPLETED + 1 DRAFT = 8
        # global_grains_offtaker: 2 ACTIVE + 2 OPEN + 1 COMPLETED + 1 DRAFT = 6

        contracts_raw = [
            # ---- coffee_intl_buyer contracts ----
            {
                'commodity': 'Premium Arabica AA (Nyeri)',
                'buyer': 'coffee_intl_buyer',
                'cooperative': nyeri_coop,
                'target_volume_kg': Decimal('5000.00'),
                'price_per_kg_cusd': Decimal('4.7500'),
                'status': 'ACTIVE',
                'quality_specs': 'Grade: AA | Moisture: <11% | Screen: 18+ | Certs: EUDR, Rainforest Alliance',
                'deadline_days': 60,
            },
            {
                'commodity': 'Washed Arabica SL28 (Nyeri)',
                'buyer': 'coffee_intl_buyer',
                'cooperative': nyeri_coop,
                'target_volume_kg': Decimal('3500.00'),
                'price_per_kg_cusd': Decimal('5.1000'),
                'status': 'ACTIVE',
                'quality_specs': 'Grade: AA | Variety: SL28 | Moisture: <11% | Cert: Organic, EUDR',
                'deadline_days': 45,
            },
            {
                'commodity': 'Natural Process Arabica (Kirinyaga)',
                'buyer': 'coffee_intl_buyer',
                'cooperative': kirinyaga_coop,
                'target_volume_kg': Decimal('2000.00'),
                'price_per_kg_cusd': Decimal('5.5000'),
                'status': 'ACTIVE',
                'quality_specs': 'Grade: AB | Natural process | Moisture: <12% | Cert: EUDR',
                'deadline_days': 75,
            },
            {
                'commodity': 'SL28 Specialty Lot (Nyeri)',
                'buyer': 'coffee_intl_buyer',
                'cooperative': nyeri_coop,
                'target_volume_kg': Decimal('1000.00'),
                'price_per_kg_cusd': Decimal('6.2500'),
                'status': 'OPEN',
                'quality_specs': 'Grade: AA | Variety: SL28 | Cupping score: 87+ | Cert: Fairtrade',
                'deadline_days': 90,
            },
            {
                'commodity': 'SL34 Micro-lot (Kirinyaga)',
                'buyer': 'coffee_intl_buyer',
                'cooperative': kirinyaga_coop,
                'target_volume_kg': Decimal('500.00'),
                'price_per_kg_cusd': Decimal('7.0000'),
                'status': 'OPEN',
                'quality_specs': 'Grade: AA | Variety: SL34 | Cupping score: 88+ | Anaerobic ferment',
                'deadline_days': 120,
            },
            {
                'commodity': 'Washed Arabica AB (Kirinyaga) — Completed Q1',
                'buyer': 'coffee_intl_buyer',
                'cooperative': kirinyaga_coop,
                'target_volume_kg': Decimal('4000.00'),
                'price_per_kg_cusd': Decimal('4.5000'),
                'status': 'COMPLETED',
                'quality_specs': 'Grade: AB | Moisture: <12% | Cert: Rainforest Alliance',
                'deadline_days': -30,
            },
            {
                'commodity': 'Arabica Blend (Nyeri + Kirinyaga) — Completed Q2',
                'buyer': 'coffee_intl_buyer',
                'cooperative': None,
                'target_volume_kg': Decimal('8000.00'),
                'price_per_kg_cusd': Decimal('4.2000'),
                'status': 'COMPLETED',
                'quality_specs': 'Grade: A | Mixed origin blend | Moisture: <12%',
                'deadline_days': -60,
            },
            {
                'commodity': 'Robusta Blend (Bulk) — Draft',
                'buyer': 'coffee_intl_buyer',
                'cooperative': None,
                'target_volume_kg': Decimal('10000.00'),
                'price_per_kg_cusd': Decimal('2.8000'),
                'status': 'DRAFT',
                'quality_specs': 'Grade: B | Moisture: <13% | No specific cert required',
                'deadline_days': 120,
            },
            # ---- global_grains_offtaker contracts ----
            {
                'commodity': 'Washed Arabica (Kirinyaga) — Active',
                'buyer': 'global_grains_offtaker',
                'cooperative': kirinyaga_coop,
                'target_volume_kg': Decimal('3000.00'),
                'price_per_kg_cusd': Decimal('5.2000'),
                'status': 'ACTIVE',
                'quality_specs': 'Grade: AB | Moisture: <12% | Screen: 16+ | Cert: Fairtrade, EUDR',
                'deadline_days': 90,
            },
            {
                'commodity': 'Nyeri AA Espresso Blend — Active',
                'buyer': 'global_grains_offtaker',
                'cooperative': nyeri_coop,
                'target_volume_kg': Decimal('2500.00'),
                'price_per_kg_cusd': Decimal('4.9000'),
                'status': 'ACTIVE',
                'quality_specs': 'Grade: AA | Espresso profile | Moisture: <11% | Cert: Organic',
                'deadline_days': 50,
            },
            {
                'commodity': 'SL28 Specialty (Nyeri) — Open',
                'buyer': 'global_grains_offtaker',
                'cooperative': nyeri_coop,
                'target_volume_kg': Decimal('1500.00'),
                'price_per_kg_cusd': Decimal('5.8000'),
                'status': 'OPEN',
                'quality_specs': 'Grade: AA | SL28 | Cupping: 86+ | Cert: Rainforest Alliance',
                'deadline_days': 100,
            },
            {
                'commodity': 'Natural Kirinyaga AB — Open',
                'buyer': 'global_grains_offtaker',
                'cooperative': kirinyaga_coop,
                'target_volume_kg': Decimal('800.00'),
                'price_per_kg_cusd': Decimal('6.0000'),
                'status': 'OPEN',
                'quality_specs': 'Grade: AB | Natural process | Fruity profile | Cert: EUDR',
                'deadline_days': 110,
            },
            {
                'commodity': 'Arabica Bulk (Mixed) — Completed',
                'buyer': 'global_grains_offtaker',
                'cooperative': None,
                'target_volume_kg': Decimal('6000.00'),
                'price_per_kg_cusd': Decimal('3.9000'),
                'status': 'COMPLETED',
                'quality_specs': 'Grade: A | Moisture: <12% | Bulk commercial grade',
                'deadline_days': -45,
            },
            {
                'commodity': 'Washed Robusta Blend — Draft',
                'buyer': 'global_grains_offtaker',
                'cooperative': None,
                'target_volume_kg': Decimal('7000.00'),
                'price_per_kg_cusd': Decimal('3.1000'),
                'status': 'DRAFT',
                'quality_specs': 'Grade: B | Moisture: <13% | Commercial blend — pending board approval',
                'deadline_days': 150,
            },
        ]

        contracts_created = 0
        for c in contracts_raw:
            buyer_user = user_objects[c['buyer']]
            deadline_date = timezone.now().date() + timedelta(days=c['deadline_days'])
            _, created = SupplyContract.objects.get_or_create(
                commodity=c['commodity'],
                buyer=buyer_user,
                defaults={
                    'cooperative': c['cooperative'],
                    'target_volume_kg': c['target_volume_kg'],
                    'price_per_kg_cusd': c['price_per_kg_cusd'],
                    'status': c['status'],
                    'quality_specs': c['quality_specs'],
                    'deadline': deadline_date,
                }
            )
            if created:
                contracts_created += 1

        self.stdout.write(f'  {len(contracts_raw)} supply contracts defined ({contracts_created} newly created)')
        self.stdout.write(f'    coffee_intl_buyer:      3 ACTIVE + 2 OPEN + 2 COMPLETED + 1 DRAFT')
        self.stdout.write(f'    global_grains_offtaker: 2 ACTIVE + 2 OPEN + 1 COMPLETED + 1 DRAFT')

        # ──────────────────────────────────────────────
        # SUMMARY
        # ──────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING('\nFull seed complete!\n'))
        self.stdout.write(self.style.NOTICE('-' * 70))
        self.stdout.write(self.style.NOTICE('  LOGIN CREDENTIALS (password: Vunachain2024!)'))
        self.stdout.write(self.style.NOTICE('-' * 70))
        rows = [
            ('System Admin',        'admin',                  'Django admin panel + all dashboards'),
            ('GIS Admin',           'gis_admin',              'Plot management, map layer access'),
            ('Customer Support',    'support',                'Farmer lookup and profile edits'),
            ('Coop Manager (Nyeri)',     'nyeri_admin',        'Nyeri Highlands coop dashboard'),
            ('Coop Manager (Kirinyaga)', 'elgon_admin',    'Kirinyaga coop dashboard'),
            ('Field Agent 1',       'field_agent',            'Harvest logging, farm events'),
            ('Field Agent 2',       'field_agent_2',          'Harvest logging, farm events'),
            ('Agronomist',          'agronomist',             'Geospatial map, crop advisories'),
            ('Offtaker (Coffee)',   'coffee_intl_buyer',      'Supply contracts, batch discovery'),
            ('Offtaker (Grains)',   'global_grains_offtaker', 'Supply contracts, batch discovery'),
            ('Auditor',             'auditor',                'Read-only compliance view'),
        ]
        for role, uname, access in rows:
            self.stdout.write(f'  {role:<30} | {uname:<25} | {access}')
        self.stdout.write(self.style.NOTICE('-' * 70))
        self.stdout.write(self.style.NOTICE('  DATA SUMMARY'))
        self.stdout.write(self.style.NOTICE('-' * 70))
        self.stdout.write(f'  Cooperatives:      2')
        self.stdout.write(f'  Farmers:           {len(farmers)} (30 Nyeri + 30 Kirinyaga)')
        self.stdout.write(f'  Plots:             {len(plots)}')
        self.stdout.write(f'  Farm Events:       {created_events}')
        self.stdout.write(f'  Harvests:          {len(harvests)} (record_ids 3000-{record_counter - 1})')
        self.stdout.write(f'  M-Pesa Payouts:    {payout_count}')
        self.stdout.write(f'  Merkle Batches:    {len(created_batches)}')
        self.stdout.write(f'  Supply Contracts:  {len(contracts_raw)}')
        self.stdout.write(self.style.NOTICE('-' * 70))
        self.stdout.write('')
