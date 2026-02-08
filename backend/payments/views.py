import uuid

from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from payments.models import Payment
from payments.serializers import PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("order")
    serializer_class = PaymentSerializer


class PaymentInitializeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order")
        if not order_id:
            return Response({"detail": "order is required"}, status=status.HTTP_400_BAD_REQUEST)

        reference = request.data.get("reference") or str(uuid.uuid4())
        payment = Payment.objects.create(
            order_id=order_id,
            provider=request.data.get("provider", "paystack"),
            reference=reference,
            status=Payment.Status.INITIATED,
            amount=request.data.get("amount"),
            currency=request.data.get("currency", "NGN"),
            raw_payload=request.data.get("raw_payload", {}),
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        reference = request.data.get("reference")
        if not reference:
            return Response({"detail": "reference is required"}, status=status.HTTP_400_BAD_REQUEST)

        payment = Payment.objects.filter(reference=reference).first()
        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        payment.status = Payment.Status.CAPTURED
        payment.raw_payload = request.data.get("raw_payload", payment.raw_payload)
        payment.save()
        payment.order.status = Order.Status.PAID
        payment.order.save()

        return Response(PaymentSerializer(payment).data)


class PaymentWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        reference = request.data.get("reference")
        payment = Payment.objects.filter(reference=reference).first()
        if not payment:
            return Response({"detail": "Payment not found"}, status=status.HTTP_404_NOT_FOUND)

        payment.status = Payment.Status.CAPTURED
        payment.raw_payload = request.data.get("raw_payload", request.data)
        payment.save()
        payment.order.status = Order.Status.PAID
        payment.order.save()
        return Response({"detail": "ok"})
