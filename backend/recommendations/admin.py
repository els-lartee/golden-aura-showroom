from django.contrib import admin

from recommendations.models import ProductFeature, Recommendation, UserFeature


@admin.register(UserFeature)
class UserFeatureAdmin(admin.ModelAdmin):
    list_display = ("user", "updated_at")


@admin.register(ProductFeature)
class ProductFeatureAdmin(admin.ModelAdmin):
    list_display = ("product", "updated_at")


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "score", "model_version", "created_at")
