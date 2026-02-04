from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product, ProductVariant
from analytics.models import Event
from analytics.serializers import EventSerializer
from orders.models import Order
from payments.models import Payment


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class EventBatchView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        events = request.data.get("events", [])
        serializer = EventSerializer(data=events, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"created": len(serializer.data)}, status=status.HTTP_201_CREATED)


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
