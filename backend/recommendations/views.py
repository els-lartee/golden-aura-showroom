from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError

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


class RecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Recommendation.objects.select_related("user", "product")
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get("product_id")

        if self.request.user.is_authenticated:
            queryset = queryset.filter(user_id=self.request.user.id)
        else:
            session_key = self.request.query_params.get("session_key")
            if not session_key:
                raise ValidationError(
                    {"session_key": "This query parameter is required for anonymous requests."}
                )

            active_session_key = self.request.session.session_key
            if not active_session_key:
                self.request.session.save()
                active_session_key = self.request.session.session_key

            if session_key != active_session_key:
                raise PermissionDenied("Invalid session scope for recommendations.")

            queryset = queryset.filter(session_key=session_key)

        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
