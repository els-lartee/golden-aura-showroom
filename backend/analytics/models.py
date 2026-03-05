from django.conf import settings
from django.db import models


class Event(models.Model):
    class EventType(models.TextChoices):
        VIEW = "view", "View"
        CLICK = "click", "Click"
        LIKE = "like", "Like"
        FAVORITE = "favorite", "Favorite"
        ADD_TO_CART = "add_to_cart", "Add to Cart"
        REMOVE_FROM_CART = "remove_from_cart", "Remove from Cart"
        PURCHASE = "purchase", "Purchase"
        AR_SESSION_START = "ar_session_start", "AR Session Start"
        AR_SESSION_END = "ar_session_end", "AR Session End"
        AR_SCREENSHOT = "ar_screenshot", "AR Screenshot"

    session_key = models.CharField(max_length=120, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, blank=True
    )
    event_type = models.CharField(max_length=50, choices=EventType.choices)
    metadata = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.event_type} ({self.id})"
