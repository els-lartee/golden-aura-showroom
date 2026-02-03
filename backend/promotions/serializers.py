from rest_framework import serializers

from promotions.models import Coupon, PromotionRule


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = "__all__"


class PromotionRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionRule
        fields = "__all__"
