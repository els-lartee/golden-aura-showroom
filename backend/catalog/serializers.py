from django.utils.text import slugify
from rest_framework import serializers

from catalog.models import Collection, Product, ProductMedia, ProductVariant, Tag


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = "__all__"


class ProductMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMedia
        fields = "__all__"


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

    class Meta:
        model = Product
        fields = "__all__"
