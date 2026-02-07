from django.utils.text import slugify
from rest_framework import serializers

from catalog.models import Category, Collection, Favorite, Product, ProductMedia, ProductVariant, Tag


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Category
        fields = "__all__"

    def _build_unique_slug(self, base_slug: str, instance_id: int | None = None) -> str:
        candidate = base_slug or "category"
        suffix = 1
        queryset = Category.objects.all()
        if instance_id is not None:
            queryset = queryset.exclude(id=instance_id)
        while queryset.filter(slug=candidate).exists():
            suffix += 1
            candidate = f"{base_slug}-{suffix}"
        return candidate

    def create(self, validated_data):
        if not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("name", "")) or "category"
            validated_data["slug"] = self._build_unique_slug(base_slug)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("name") or instance.name) or "category"
            validated_data["slug"] = self._build_unique_slug(base_slug, instance.id)
        return super().update(instance, validated_data)


class ProductMediaSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = ProductMedia
        fields = "__all__"

    def validate(self, attrs):
        url = attrs.get("url")
        file = attrs.get("file")
        media_type = attrs.get("media_type") or getattr(self.instance, "media_type", None)
        if not url and not file and self.instance is None:
            raise serializers.ValidationError("Either url or file is required.")
        if media_type == ProductMedia.MediaType.MODEL:
            if file is not None:
                name = getattr(file, "name", "") or ""
                if not name.lower().endswith(".glb"):
                    raise serializers.ValidationError("3D model must be a .glb file.")
            if url:
                if not str(url).lower().endswith(".glb"):
                    raise serializers.ValidationError("3D model URL must end with .glb.")
        if media_type == ProductMedia.MediaType.IMAGE:
            if file is not None:
                name = getattr(file, "name", "") or ""
                if not name.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
                    raise serializers.ValidationError("Image must be png, jpg, jpeg, webp, or gif.")
            if url:
                if not str(url).lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")):
                    raise serializers.ValidationError("Image URL must be png, jpg, jpeg, webp, or gif.")
        return attrs

    def create(self, validated_data):
        media = super().create(validated_data)
        if media.file and not media.url:
            media.url = media.file.url
            media.save(update_fields=["url"])
        return media

    def update(self, instance, validated_data):
        media = super().update(instance, validated_data)
        if media.file and not media.url:
            media.url = media.file.url
            media.save(update_fields=["url"])
        return media


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = "__all__"


class TagSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Tag
        fields = "__all__"

    def _build_unique_slug(self, base_slug: str, instance_id: int | None = None) -> str:
        candidate = base_slug or "tag"
        suffix = 1
        queryset = Tag.objects.all()
        if instance_id is not None:
            queryset = queryset.exclude(id=instance_id)
        while queryset.filter(slug=candidate).exists():
            suffix += 1
            candidate = f"{base_slug}-{suffix}"
        return candidate

    def create(self, validated_data):
        if not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("name", "")) or "tag"
            validated_data["slug"] = self._build_unique_slug(base_slug)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "slug" in validated_data and not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("name") or instance.name) or "tag"
            validated_data["slug"] = self._build_unique_slug(base_slug, instance.id)
        return super().update(instance, validated_data)


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    media = ProductMediaSerializer(many=True, read_only=True)
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all(), required=False)

    def validate_base_price(self, value):
        if value is None:
            raise serializers.ValidationError("Base price is required.")
        if value <= 0:
            raise serializers.ValidationError("Base price must be greater than 0.")
        return value

    class Meta:
        model = Product
        fields = "__all__"


class FavoriteSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "user", "product", "product_detail", "created_at"]
        read_only_fields = ["user", "created_at"]
