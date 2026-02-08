from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from cart.models import Cart, CartItem
from cart.serializers import CartItemSerializer, CartSerializer


class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all().prefetch_related("items")
    serializer_class = CartSerializer

    def _get_session_key(self, request):
        if not request.session.session_key:
            request.session.save()
        return request.session.session_key

    @action(detail=False, methods=["get"], url_path="current")
    def current(self, request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user, status=Cart.Status.OPEN)
        else:
            session_key = self._get_session_key(request)
            cart, _ = Cart.objects.get_or_create(
                session_key=session_key, status=Cart.Status.OPEN
            )
        return Response(self.get_serializer(cart).data)

    @action(detail=False, methods=["post"], url_path="merge")
    def merge(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=401)

        session_key = request.data.get("session_key") or self._get_session_key(request)
        session_cart = Cart.objects.filter(
            session_key=session_key, status=Cart.Status.OPEN
        ).first()
        user_cart, _ = Cart.objects.get_or_create(user=request.user, status=Cart.Status.OPEN)

        if session_cart:
            for item in session_cart.items.all():
                existing = user_cart.items.filter(product_variant=item.product_variant).first()
                if existing:
                    existing.quantity += item.quantity
                    existing.save()
                else:
                    item.cart = user_cart
                    item.save()
            session_cart.status = Cart.Status.CONVERTED
            session_cart.save()

        return Response(self.get_serializer(user_cart).data)

    @action(detail=False, methods=["post"], url_path="abandon")
    def abandon(self, request):
        if request.user.is_authenticated:
            updated = Cart.objects.filter(
                user=request.user, status=Cart.Status.OPEN
            ).update(status=Cart.Status.ABANDONED)
        else:
            session_key = self._get_session_key(request)
            updated = Cart.objects.filter(
                session_key=session_key, status=Cart.Status.OPEN
            ).update(status=Cart.Status.ABANDONED)
        return Response({"abandoned": updated}, status=status.HTTP_200_OK)


class CartItemViewSet(viewsets.ModelViewSet):
    queryset = CartItem.objects.select_related("cart", "product_variant")
    serializer_class = CartItemSerializer
