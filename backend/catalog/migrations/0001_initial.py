from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Collection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("slug", models.SlugField(max_length=220, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("slug", models.SlugField(max_length=255, unique=True)),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("active", "Active"), ("archived", "Archived")], default="draft", max_length=20)),
                ("base_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("currency", models.CharField(default="NGN", max_length=10)),
                ("is_featured", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="ProductVariant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("sku", models.CharField(max_length=120, unique=True)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("stock_quantity", models.IntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "product",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="variants", to="catalog.product"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProductMedia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("url", models.URLField()),
                ("media_type", models.CharField(choices=[("image", "Image"), ("video", "Video"), ("model", "3D Model")], default="image", max_length=20)),
                ("alt_text", models.CharField(blank=True, max_length=200)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_primary", models.BooleanField(default=False)),
                (
                    "product",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="media", to="catalog.product"),
                ),
            ],
        ),
        migrations.AddField(
            model_name="product",
            name="collections",
            field=models.ManyToManyField(blank=True, related_name="products", to="catalog.collection"),
        ),
    ]
