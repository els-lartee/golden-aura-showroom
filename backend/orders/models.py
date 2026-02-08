from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FULFILLED = "fulfilled", "Fulfilled"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    guest_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    currency = models.CharField(max_length=10, default="NGN")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    shipping_name = models.CharField(max_length=200)
    shipping_phone = models.CharField(max_length=30)
    shipping_address1 = models.CharField(max_length=255)
    shipping_address2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=120)
    shipping_state = models.CharField(max_length=120)
    shipping_postal_code = models.CharField(max_length=30)
    shipping_country = models.CharField(max_length=120)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Order {self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_variant = models.ForeignKey(
        "catalog.ProductVariant", on_delete=models.SET_NULL, null=True, related_name="order_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=12, decimal_places=2)
    product_title = models.CharField(max_length=255)
    variant_name = models.CharField(max_length=200, blank=True)
    sku_snapshot = models.CharField(max_length=120, blank=True)

    def __str__(self) -> str:
        return f"{self.order_id} - {self.product_title}"
