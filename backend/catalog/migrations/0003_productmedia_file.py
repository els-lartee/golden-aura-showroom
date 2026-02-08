from django.db import migrations, models
import catalog.models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_tags"),
    ]

    operations = [
        migrations.AddField(
            model_name="productmedia",
            name="file",
            field=models.FileField(blank=True, null=True, upload_to=catalog.models.product_media_upload_path),
        ),
        migrations.AlterField(
            model_name="productmedia",
            name="url",
            field=models.URLField(blank=True),
        ),
    ]
