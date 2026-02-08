from decimal import Decimal

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from cart.models import Cart
from orders.models import Order, OrderItem
from orders.serializers import OrderItemSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related("items")
    serializer_class = OrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        email = self.request.query_params.get("email")
        if email:
            return queryset.filter(guest_email=email)
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return queryset.filter(user=self.request.user)
        return queryset

    @action(detail=True, methods=["post"], url_path="refund")
    def refund(self, request, pk=None):
        order = self.get_object()
        order.status = Order.Status.REFUNDED
        order.save()
        order.payments.update(status="refunded")
        return Response(OrderSerializer(order).data)


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related("order", "product_variant")
    serializer_class = OrderItemSerializer


class CheckoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart_id = request.data.get("cart_id")
        cart = None
        if cart_id:
            cart = Cart.objects.prefetch_related("items__product_variant").filter(id=cart_id).first()
        elif request.user.is_authenticated:
            cart = Cart.objects.prefetch_related("items__product_variant").filter(
                user=request.user, status=Cart.Status.OPEN
            ).first()
        else:
            if not request.session.session_key:
                request.session.save()
            cart = Cart.objects.prefetch_related("items__product_variant").filter(
                session_key=request.session.session_key, status=Cart.Status.OPEN
            ).first()

        if not cart or not cart.items.exists():
            return Response({"detail": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        guest_email = request.data.get("guest_email", "")
        if not request.user.is_authenticated and not guest_email:
            return Response({"detail": "guest_email is required"}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = Decimal("0.00")
        for item in cart.items.select_related("product_variant", "product_variant__product"):
            subtotal += item.product_variant.price * item.quantity

        order = Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            guest_email=guest_email,
            status=Order.Status.PENDING,
            currency=request.data.get("currency", "NGN"),
            subtotal=subtotal,
            tax=Decimal(request.data.get("tax", "0.00")),
            shipping=Decimal(request.data.get("shipping", "0.00")),
            total=subtotal + Decimal(request.data.get("tax", "0.00")) + Decimal(request.data.get("shipping", "0.00")),
            shipping_name=request.data.get("shipping_name"),
            shipping_phone=request.data.get("shipping_phone"),
            shipping_address1=request.data.get("shipping_address1"),
            shipping_address2=request.data.get("shipping_address2", ""),
            shipping_city=request.data.get("shipping_city"),
            shipping_state=request.data.get("shipping_state"),
            shipping_postal_code=request.data.get("shipping_postal_code"),
            shipping_country=request.data.get("shipping_country"),
        )

        for item in cart.items.select_related("product_variant", "product_variant__product"):
            OrderItem.objects.create(
                order=order,
                product_variant=item.product_variant,
                quantity=item.quantity,
                price_at_purchase=item.product_variant.price,
                product_title=item.product_variant.product.title,
                variant_name=item.product_variant.name,
                sku_snapshot=item.product_variant.sku,
            )

        cart.status = Cart.Status.CONVERTED
        cart.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
