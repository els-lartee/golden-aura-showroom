import logging

from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product, ProductVariant
from catalog.serializers import ProductSerializer
from analytics.models import Event
from analytics.serializers import EventSerializer
from orders.models import Order
from payments.models import Payment
from recommendations.scoring import update_recommendation_from_event, mark_user_dirty

logger = logging.getLogger(__name__)


def _trigger_recommendations(events):
    """Fire real-time scoring for a list of saved Event instances."""
    for event in events:
        try:
            update_recommendation_from_event(event)
            if event.user_id:
                mark_user_dirty(event.user_id)
        except Exception:
            logger.exception("Failed to update recommendation for event %s", event.pk)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def perform_create(self, serializer):
        event = serializer.save()
        _trigger_recommendations([event])


class EventBatchView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        events = request.data.get("events", [])
        serializer = EventSerializer(data=events, many=True)
        serializer.is_valid(raise_exception=True)
        saved_events = serializer.save()
        _trigger_recommendations(saved_events)
        return Response({"created": len(serializer.data)}, status=status.HTTP_201_CREATED)


class RecentViewsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get("limit", 8))
        events = (
            Event.objects.filter(
                user=request.user,
                event_type=Event.EventType.VIEW,
                product__isnull=False,
            )
            .select_related("product")
            .order_by("-created_at")
        )

        product_ids: list[int] = []
        seen = set()
        for product_id in events.values_list("product_id", flat=True):
            if product_id in seen:
                continue
            seen.add(product_id)
            product_ids.append(product_id)
            if len(product_ids) >= limit:
                break

        if not product_ids:
            return Response([])

        products = (
            Product.objects.filter(id__in=product_ids)
            .prefetch_related("variants", "media", "collections")
            .select_related("category")
        )
        product_lookup = {product.id: product for product in products}
        ordered_products = [product_lookup[pid] for pid in product_ids if pid in product_lookup]
        return Response(ProductSerializer(ordered_products, many=True).data)

    def delete(self, request):
        deleted, _ = Event.objects.filter(
            user=request.user,
            event_type=Event.EventType.VIEW,
            product__isnull=False,
        ).delete()
        return Response({"deleted": deleted})


class AdminMetricsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        User = get_user_model()
        metrics = {
            "total_orders": Order.objects.count(),
            "total_revenue": Payment.objects.filter(status="captured").aggregate(total=Sum("amount"))["total"]
            or 0,
            "total_customers": User.objects.filter(is_staff=False, is_superuser=False).count(),
            "total_products": Product.objects.count(),
            "low_inventory_variants": ProductVariant.objects.filter(stock_quantity__lte=5).count(),
        }
        return Response(metrics)
