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
            name="Cart",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("session_key", models.CharField(blank=True, max_length=120)),
                ("status", models.CharField(choices=[("open", "Open"), ("abandoned", "Abandoned"), ("converted", "Converted")], default="open", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="carts", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="CartItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("added_at", models.DateTimeField(auto_now_add=True)),
                (
                    "cart",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="cart.cart"),
                ),
                (
                    "product_variant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cart_items", to="catalog.productvariant"),
                ),
            ],
            options={
                "unique_together": {("cart", "product_variant")},
            },
        ),
    ]
