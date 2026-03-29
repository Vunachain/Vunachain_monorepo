from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from blockchain_sync.models import Plot, FarmerProfile, OnChainHarvest, MerkleBatchModel

class Command(BaseCommand):
    help = 'Initialize Vunachain User Groups (Auditor, CoopManager, FieldAgent, Agronomist, Offtaker)'

    def handle(self, *args, **options):
        models = [Plot, FarmerProfile, OnChainHarvest, MerkleBatchModel]
        
        # 1. Auditor Group (View only)
        auditor_group, _ = Group.objects.get_or_create(name='Auditor')
        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type, codename__startswith='view_')
            auditor_group.permissions.add(*permissions)
        self.stdout.write(self.style.SUCCESS('Auditor group configured with view-only permissions.'))

        # 2. CoopManager Group (Full access to their own data)
        coop_group, _ = Group.objects.get_or_create(name='CoopManager')
        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)
            coop_group.permissions.add(*permissions)
        self.stdout.write(self.style.SUCCESS('CoopManager group configured with full CRUD permissions.'))
        
        # 3. FieldAgent Group (Add/View Harvests, View Farmers/Plots)
        field_agent_group, _ = Group.objects.get_or_create(name='FieldAgent')
        harvest_ct = ContentType.objects.get_for_model(OnChainHarvest)
        farmer_ct = ContentType.objects.get_for_model(FarmerProfile)
        plot_ct = ContentType.objects.get_for_model(Plot)
        
        field_agent_group.permissions.add(
            *Permission.objects.filter(content_type=harvest_ct),
             Permission.objects.get(content_type=farmer_ct, codename='view_farmerprofile'),
             Permission.objects.get(content_type=plot_ct, codename='view_plot')
        )
        self.stdout.write(self.style.SUCCESS('FieldAgent group configured.'))
        
        # 4. Agronomist Group (View everything, full access to plots/logs later)
        agronomist_group, _ = Group.objects.get_or_create(name='Agronomist')
        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type, codename__startswith='view_')
            agronomist_group.permissions.add(*permissions)
        self.stdout.write(self.style.SUCCESS('Agronomist group configured.'))
        
        # 5. Offtaker Group (View batches and compliance summaries)
        offtaker_group, _ = Group.objects.get_or_create(name='Offtaker')
        batch_ct = ContentType.objects.get_for_model(MerkleBatchModel)
        offtaker_group.permissions.add(
            Permission.objects.get(content_type=batch_ct, codename='view_merklebatchmodel'),
            Permission.objects.get(content_type=plot_ct, codename='view_plot')
        )
        self.stdout.write(self.style.SUCCESS('Offtaker group configured.'))

        # 6. CaseOfficer Group (Credit & Insurance — view farmers, harvests, plots + manage payouts)
        case_officer_group, _ = Group.objects.get_or_create(name='CaseOfficer')
        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            view_perms = Permission.objects.filter(content_type=content_type, codename__startswith='view_')
            case_officer_group.permissions.add(*view_perms)
        # Full farmer access for credit/KYC review
        case_officer_group.permissions.add(
            *Permission.objects.filter(content_type=farmer_ct)
        )
        self.stdout.write(self.style.SUCCESS('CaseOfficer group configured.'))

