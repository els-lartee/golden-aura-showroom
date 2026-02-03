from django.db import models


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percent"
        FIXED = "fixed", "Fixed"

    code = models.CharField(max_length=60, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    active = models.BooleanField(default=True)
    max_uses = models.PositiveIntegerField(default=0)
    used_count = models.PositiveIntegerField(default=0)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return self.code


class PromotionRule(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "percent", "Percent"
        FIXED = "fixed", "Fixed"

    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    min_cart_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    applies_to_collection = models.ForeignKey(
        "catalog.Collection", on_delete=models.SET_NULL, null=True, blank=True
    )
    applies_to_product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, blank=True
    )
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self) -> str:
        return self.name
