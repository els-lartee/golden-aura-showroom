from django.conf import settings
from django.db import models
from django.db.models import Q


class UserFeature(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    features = models.JSONField(blank=True, default=dict)
    needs_rebuild = models.BooleanField(default=False, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"UserFeature {self.user_id}"


class ProductFeature(models.Model):
    product = models.OneToOneField("catalog.Product", on_delete=models.CASCADE)
    features = models.JSONField(blank=True, default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"ProductFeature {self.product_id}"


class Recommendation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True
    )
    session_key = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    score = models.FloatField(default=0)
    model_version = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=Q(user__isnull=False),
                name="uniq_recommendation_user_product",
            ),
            models.UniqueConstraint(
                fields=["session_key", "product"],
                condition=Q(session_key__isnull=False),
                name="uniq_recommendation_session_product",
            ),
            models.CheckConstraint(
                check=(
                    (Q(user__isnull=False) & Q(session_key__isnull=True))
                    | (Q(user__isnull=True) & Q(session_key__isnull=False))
                ),
                name="recommendation_has_one_owner",
            ),
        ]

    def __str__(self) -> str:
        owner = self.user_id or self.session_key
        return f"{owner} - {self.product_id}"
