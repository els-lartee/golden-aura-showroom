from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Coupon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=60, unique=True)),
                ("discount_type", models.CharField(choices=[("percent", "Percent"), ("fixed", "Fixed")], max_length=20)),
                ("value", models.DecimalField(decimal_places=2, max_digits=12)),
                ("active", models.BooleanField(default=True)),
                ("max_uses", models.PositiveIntegerField(default=0)),
                ("used_count", models.PositiveIntegerField(default=0)),
                ("start_at", models.DateTimeField(blank=True, null=True)),
                ("end_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="PromotionRule",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True)),
                ("active", models.BooleanField(default=True)),
                ("min_cart_value", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("discount_type", models.CharField(choices=[("percent", "Percent"), ("fixed", "Fixed")], max_length=20)),
                ("value", models.DecimalField(decimal_places=2, max_digits=12)),
                (
                    "applies_to_collection",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="catalog.collection"),
                ),
                (
                    "applies_to_product",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="catalog.product"),
                ),
            ],
        ),
    ]
