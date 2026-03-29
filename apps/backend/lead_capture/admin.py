from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import DemoRequest, EmailSubscription, ROICalculation


@admin.register(DemoRequest)
class DemoRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'email', 'interest', 'created_at']
    list_filter = ['interest', 'created_at']
    search_fields = ['name', 'company', 'email', 'interest', 'company']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    actions = ['export_as_csv']

    @admin.action(description="Export selected leads to CSV")
    def export_as_csv(self, request, queryset):
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename={}.csv'.format(meta)
        writer = csv.writer(response)

        writer.writerow(field_names)
        for obj in queryset:
            row = writer.writerow([getattr(obj, field) for field in field_names])

        return response


@admin.register(EmailSubscription)
class EmailSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['email', 'source', 'is_active', 'created_at']
    list_filter = ['source', 'is_active', 'created_at']
    search_fields = ['email']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    actions = ['activate_subscriptions', 'deactivate_subscriptions']

    @admin.action(description="Activate selected subscriptions")
    def activate_subscriptions(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Deactivate selected subscriptions")
    def deactivate_subscriptions(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(ROICalculation)
class ROICalculationAdmin(admin.ModelAdmin):
    list_display = ['crop_type', 'input_volume', 'calculated_loss', 'session_id', 'created_at']
    list_filter = ['crop_type', 'created_at']
    search_fields = ['session_id']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
