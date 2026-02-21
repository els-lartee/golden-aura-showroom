from django.conf import settings
from django.db import migrations, models
from django.db.models import Q
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_initial"),
        ("recommendations", "0002_userfeature_needs_rebuild"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="recommendation",
            unique_together=set(),
        ),
        migrations.AddField(
            model_name="recommendation",
            name="session_key",
            field=models.CharField(blank=True, db_index=True, max_length=120, null=True),
        ),
        migrations.AlterField(
            model_name="recommendation",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddConstraint(
            model_name="recommendation",
            constraint=models.UniqueConstraint(
                condition=Q(user__isnull=False),
                fields=("user", "product"),
                name="uniq_recommendation_user_product",
            ),
        ),
        migrations.AddConstraint(
            model_name="recommendation",
            constraint=models.UniqueConstraint(
                condition=Q(session_key__isnull=False),
                fields=("session_key", "product"),
                name="uniq_recommendation_session_product",
            ),
        ),
        migrations.AddConstraint(
            model_name="recommendation",
            constraint=models.CheckConstraint(
                check=(
                    (Q(user__isnull=False) & Q(session_key__isnull=True))
                    | (Q(user__isnull=True) & Q(session_key__isnull=False))
                ),
                name="recommendation_has_one_owner",
            ),
        ),
    ]
