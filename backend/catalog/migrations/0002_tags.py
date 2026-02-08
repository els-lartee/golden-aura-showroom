from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Tag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("slug", models.SlugField(max_length=120, unique=True)),
            ],
        ),
        migrations.AddField(
            model_name="product",
            name="tags",
            field=models.ManyToManyField(blank=True, related_name="products", to="catalog.tag"),
        ),
    ]
