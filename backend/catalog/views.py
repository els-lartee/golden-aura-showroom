from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, Collection, Product, ProductMedia, ProductVariant, Tag
from catalog.serializers import (
    CategorySerializer,
    CollectionSerializer,
    ProductMediaSerializer,
    ProductSerializer,
    ProductVariantSerializer,
    TagSerializer,
)


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().prefetch_related("variants", "media", "collections").select_related(
        "category"
    )
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("query")
        collection = self.request.query_params.get("collection")
        tag = self.request.query_params.get("tag")
        category = self.request.query_params.get("category")
        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")
        sort = self.request.query_params.get("sort")

        if query:
            queryset = queryset.filter(title__icontains=query)
        if collection:
            queryset = queryset.filter(collections__id=collection)
        if tag:
            queryset = queryset.filter(tags__id=tag)
        if category:
            queryset = queryset.filter(category_id=category)
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
    parser_classes = [MultiPartParser, FormParser]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class LowInventoryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        threshold = int(request.query_params.get("threshold", 5))
        variants = ProductVariant.objects.filter(stock_quantity__lte=threshold)
        return Response(ProductVariantSerializer(variants, many=True).data)
