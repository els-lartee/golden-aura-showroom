from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("catalog", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Order",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("guest_email", models.EmailField(blank=True, max_length=254)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("fulfilled", "Fulfilled"), ("cancelled", "Cancelled"), ("refunded", "Refunded")], default="pending", max_length=20)),
                ("currency", models.CharField(default="NGN", max_length=10)),
                ("subtotal", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("tax", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("shipping", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("shipping_name", models.CharField(max_length=200)),
                ("shipping_phone", models.CharField(max_length=30)),
                ("shipping_address1", models.CharField(max_length=255)),
                ("shipping_address2", models.CharField(blank=True, max_length=255)),
                ("shipping_city", models.CharField(max_length=120)),
                ("shipping_state", models.CharField(max_length=120)),
                ("shipping_postal_code", models.CharField(max_length=30)),
                ("shipping_country", models.CharField(max_length=120)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="orders", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="OrderItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("price_at_purchase", models.DecimalField(decimal_places=2, max_digits=12)),
                ("product_title", models.CharField(max_length=255)),
                ("variant_name", models.CharField(blank=True, max_length=200)),
                ("sku_snapshot", models.CharField(blank=True, max_length=120)),
                (
                    "order",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="orders.order"),
                ),
                (
                    "product_variant",
                    models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="order_items", to="catalog.productvariant"),
                ),
            ],
        ),
    ]
