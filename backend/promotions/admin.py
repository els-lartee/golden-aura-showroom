from django.contrib import admin

from promotions.models import Coupon, PromotionRule


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "active")
    search_fields = ("code",)


@admin.register(PromotionRule)
class PromotionRuleAdmin(admin.ModelAdmin):
    list_display = ("name", "discount_type", "value", "active")
    search_fields = ("name",)
