from django.contrib import admin

from payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "provider", "status", "amount", "currency", "created_at")
    search_fields = ("reference", "order__id")
