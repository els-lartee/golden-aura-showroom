from django.conf import settings
from django.db import models


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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE)
    score = models.FloatField(default=0)
    model_version = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")

    def __str__(self) -> str:
        return f"{self.user_id} - {self.product_id}"
