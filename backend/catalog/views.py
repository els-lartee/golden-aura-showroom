from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Collection, Product, ProductMedia, ProductVariant
from catalog.serializers import (
    CollectionSerializer,
    ProductMediaSerializer,
    ProductSerializer,
    ProductVariantSerializer,
)


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related("variants", "media", "collections")
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("query")
        collection = self.request.query_params.get("collection")
        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")
        sort = self.request.query_params.get("sort")

        if query:
            queryset = queryset.filter(title__icontains=query)
        if collection:
            queryset = queryset.filter(collections__id=collection)
        if price_min:
            queryset = queryset.filter(base_price__gte=price_min)
        if price_max:
            queryset = queryset.filter(base_price__lte=price_max)
        if sort:
            queryset = queryset.order_by(sort)

        return queryset.distinct()


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.select_related("product")
    serializer_class = ProductVariantSerializer


class ProductMediaViewSet(viewsets.ModelViewSet):
    queryset = ProductMedia.objects.select_related("product")
    serializer_class = ProductMediaSerializer


class LowInventoryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        threshold = int(request.query_params.get("threshold", 5))
        variants = ProductVariant.objects.filter(stock_quantity__lte=threshold)
        return Response(ProductVariantSerializer(variants, many=True).data)
