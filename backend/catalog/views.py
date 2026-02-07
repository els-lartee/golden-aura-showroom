from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import Event
from catalog.models import Category, Collection, Favorite, Product, ProductMedia, ProductVariant, Tag
from catalog.serializers import (
    CategorySerializer,
    CollectionSerializer,
    FavoriteSerializer,
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


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    Authenticated user's favorites.
    - GET    /favorites/         → list current user's favorites
    - POST   /favorites/         → add a favorite (body: {product: <id>})
    - DELETE /favorites/{id}/    → remove by favorite id
    - POST   /favorites/toggle/  → add or remove, returns {status: "added"|"removed"}
    """

    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related("product", "product__category")
            .prefetch_related("product__media", "product__variants", "product__collections")
        )

    def create(self, request, *args, **kwargs):
        """Add a product to favorites. Returns 400 if already favorited."""
        product_id = request.data.get("product")
        if not product_id:
            return Response({"detail": "product is required."}, status=status.HTTP_400_BAD_REQUEST)
        if Favorite.objects.filter(user=request.user, product_id=product_id).exists():
            return Response(
                {"detail": "Already in favorites."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        favorite = Favorite.objects.create(user=request.user, product_id=product_id)
        Event.objects.create(
            user=request.user,
            product_id=product_id,
            event_type=Event.EventType.FAVORITE,
            metadata={"source": "favorites"},
        )
        serializer = self.get_serializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        """Toggle favorite: adds if absent, removes if present."""
        product_id = request.data.get("product")
        if not product_id:
            return Response({"detail": "product is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        favorite, created = Favorite.objects.get_or_create(user=request.user, product=product)
        if not created:
            favorite.delete()
            return Response({"status": "removed", "product": product.id})
        Event.objects.create(
            user=request.user,
            product=product,
            event_type=Event.EventType.FAVORITE,
            metadata={"source": "favorites"},
        )
        return Response(
            {"status": "added", "product": product.id, "id": favorite.id},
            status=status.HTTP_201_CREATED,
        )


class LowInventoryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        threshold = int(request.query_params.get("threshold", 5))
        variants = ProductVariant.objects.filter(stock_quantity__lte=threshold)
        return Response(ProductVariantSerializer(variants, many=True).data)
