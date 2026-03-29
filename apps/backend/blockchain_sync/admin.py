from django.contrib import admin
from .models import FarmerProfile, Plot, MerkleBatchModel, OnChainHarvest, MpesaPayout, FarmEvent, Cooperative, SupplyContract

# Actions
@admin.action(description='Mark selected farmers as verified (Customer Support & Admin)')
def verify_farmers(modeladmin, request, queryset):
    queryset.update(is_verified=True)

@admin.action(description='Mark selected plots as EUDR compliant (GIS Admin & Admin)')
def mark_eudr_compliant(modeladmin, request, queryset):
    queryset.update(is_eudr_compliant=True)

# Inlines to improve Observability without jumping tables
class PlotInline(admin.TabularInline):
    model = Plot
    extra = 0
    fields = ('name', 'area_hectares', 'is_eudr_compliant', 'last_checked_at')
    readonly_fields = ('last_checked_at',)
    show_change_link = True

class FarmEventInline(admin.TabularInline):
    model = FarmEvent
    extra = 0
    fields = ('event_type', 'timestamp', 'quality_grade', 'notes')
    readonly_fields = ('timestamp',)

# Admins
@admin.register(Cooperative)
class CooperativeAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'manager', 'created_at')
    search_fields = ('name', 'location', 'manager__username')
    readonly_fields = ('created_at',)

@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'celo_address', 'phone_number', 'cooperative', 'is_verified', 'credit_score')
    list_filter = ('is_verified', 'cooperative')
    search_fields = ('id', 'full_name', 'celo_address', 'phone_number')
    readonly_fields = ('celo_address', 'created_at', 'id')
    list_editable = ('is_verified',)
    actions = [verify_farmers]
    inlines = [PlotInline]

    def has_change_permission(self, request, obj=None):
        if request.user.groups.filter(name='GIS Admin').exists():
            return False # GIS shouldn't edit farmers generally
        return super().has_change_permission(request, obj)

@admin.register(Plot)
class PlotAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'farmer', 'cooperative', 'area_hectares', 'is_eudr_compliant', 'get_geom_type')
    list_filter = ('is_eudr_compliant', 'cooperative')
    search_fields = ('id', 'name', 'farmer__full_name')
    readonly_fields = ('id', 'last_checked_at')
    list_editable = ('is_eudr_compliant',)
    actions = [mark_eudr_compliant]
    inlines = [FarmEventInline]

    def get_geom_type(self, obj):
        return obj.boundary.geom_type if obj.boundary else "No Boundary"
    get_geom_type.short_description = "Geometry Type"

    def has_change_permission(self, request, obj=None):
        if request.user.groups.filter(name='Customer Support').exists():
            return False # Customer support avoids spatial data editing
        return super().has_change_permission(request, obj)

@admin.register(MerkleBatchModel)
class MerkleBatchAdmin(admin.ModelAdmin):
    list_display = ('merkle_root', 'total_records', 'total_amount_cusd', 'status', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('merkle_root', 'created_at')

@admin.register(OnChainHarvest)
class OnChainHarvestAdmin(admin.ModelAdmin):
    list_display = ('record_id', 'farmer_address', 'crop_type', 'weight_kg', 'status')
    list_filter = ('status', 'crop_type')
    search_fields = ('record_id', 'farmer_address', 'transaction_hash')
    readonly_fields = ('transaction_hash',)

@admin.register(MpesaPayout)
class MpesaPayoutAdmin(admin.ModelAdmin):
    list_display = ('harvest', 'phone_number', 'amount_kes', 'status')
    list_filter = ('status',)
    search_fields = ('phone_number', 'receipt_number')

@admin.register(FarmEvent)
class FarmEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'event_type', 'plot', 'farmer', 'timestamp', 'quality_grade')
    list_filter = ('event_type', 'quality_grade')
    search_fields = ('id', 'plot__name', 'farmer__full_name', 'notes')
    readonly_fields = ('id', 'created_at')

@admin.register(SupplyContract)
class SupplyContractAdmin(admin.ModelAdmin):
    list_display = ('id', 'commodity', 'buyer', 'cooperative', 'target_volume_kg', 'status', 'deadline')
    list_filter = ('status', 'commodity')
    search_fields = ('commodity', 'buyer__username', 'cooperative__name')
    readonly_fields = ('created_at', 'updated_at')
