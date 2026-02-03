from rest_framework import viewsets

from recommendations.models import ProductFeature, Recommendation, UserFeature
from recommendations.serializers import (
    ProductFeatureSerializer,
    RecommendationSerializer,
    UserFeatureSerializer,
)


class UserFeatureViewSet(viewsets.ModelViewSet):
    queryset = UserFeature.objects.select_related("user")
    serializer_class = UserFeatureSerializer


class ProductFeatureViewSet(viewsets.ModelViewSet):
    queryset = ProductFeature.objects.select_related("product")
    serializer_class = ProductFeatureSerializer


class RecommendationViewSet(viewsets.ModelViewSet):
    queryset = Recommendation.objects.select_related("user", "product")
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get("user_id")
        product_id = self.request.query_params.get("product_id")
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
