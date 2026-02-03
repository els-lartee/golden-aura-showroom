from rest_framework import serializers

from recommendations.models import ProductFeature, Recommendation, UserFeature


class UserFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFeature
        fields = "__all__"


class ProductFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFeature
        fields = "__all__"


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = "__all__"
