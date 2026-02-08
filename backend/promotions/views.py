from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from promotions.models import Coupon, PromotionRule
from promotions.serializers import CouponSerializer, PromotionRuleSerializer


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer


class PromotionRuleViewSet(viewsets.ModelViewSet):
    queryset = PromotionRule.objects.select_related("applies_to_collection", "applies_to_product")
    serializer_class = PromotionRuleSerializer


class CouponValidateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return Response({"detail": "code is required"}, status=status.HTTP_400_BAD_REQUEST)

        coupon = Coupon.objects.filter(code=code, active=True).first()
        if not coupon:
            return Response({"detail": "Invalid coupon"}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        if coupon.start_at and coupon.start_at > now:
            return Response({"detail": "Coupon not active"}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.end_at and coupon.end_at < now:
            return Response({"detail": "Coupon expired"}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.max_uses and coupon.used_count >= coupon.max_uses:
            return Response({"detail": "Coupon exhausted"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(CouponSerializer(coupon).data)


class ActivePromotionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        rules = PromotionRule.objects.filter(active=True)
        return Response(PromotionRuleSerializer(rules, many=True).data)
