from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import LoginView, LogoutView, MeView, PasswordResetView, RegisterView, UserProfileViewSet
from analytics.views import AdminMetricsView, EventBatchView, EventViewSet
from cart.views import CartItemViewSet, CartViewSet
from catalog.views import CollectionViewSet, LowInventoryView, ProductMediaViewSet, ProductVariantViewSet, ProductViewSet
from orders.views import CheckoutView, OrderItemViewSet, OrderViewSet
from payments.views import PaymentInitializeView, PaymentVerifyView, PaymentViewSet, PaymentWebhookView
from promotions.views import ActivePromotionsView, CouponValidateView, CouponViewSet, PromotionRuleViewSet
from recommendations.views import ProductFeatureViewSet, RecommendationViewSet, UserFeatureViewSet

router = DefaultRouter()
router.register("profiles", UserProfileViewSet, basename="profile")
router.register("collections", CollectionViewSet, basename="collection")
router.register("products", ProductViewSet, basename="product")
router.register("product-variants", ProductVariantViewSet, basename="product-variant")
router.register("product-media", ProductMediaViewSet, basename="product-media")
router.register("carts", CartViewSet, basename="cart")
router.register("cart-items", CartItemViewSet, basename="cart-item")
router.register("orders", OrderViewSet, basename="order")
router.register("order-items", OrderItemViewSet, basename="order-item")
router.register("payments", PaymentViewSet, basename="payment")
router.register("coupons", CouponViewSet, basename="coupon")
router.register("promotion-rules", PromotionRuleViewSet, basename="promotion-rule")
router.register("events", EventViewSet, basename="event")
router.register("user-features", UserFeatureViewSet, basename="user-feature")
router.register("product-features", ProductFeatureViewSet, basename="product-feature")
router.register("recommendations", RecommendationViewSet, basename="recommendation")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register", RegisterView.as_view()),
    path("api/auth/login", LoginView.as_view()),
    path("api/auth/logout", LogoutView.as_view()),
    path("api/auth/password-reset", PasswordResetView.as_view()),
    path("api/me", MeView.as_view()),
    path("api/cart/current", CartViewSet.as_view({"get": "current"})),
    path("api/cart/merge", CartViewSet.as_view({"post": "merge"})),
    path("api/cart/abandon", CartViewSet.as_view({"post": "abandon"})),
    path("api/checkout", CheckoutView.as_view()),
    path("api/payments/initialize", PaymentInitializeView.as_view()),
    path("api/payments/verify", PaymentVerifyView.as_view()),
    path("api/payments/webhook", PaymentWebhookView.as_view()),
    path("api/coupons/validate", CouponValidateView.as_view()),
    path("api/promotions/active", ActivePromotionsView.as_view()),
    path("api/events/batch", EventBatchView.as_view()),
    path("api/admin/metrics", AdminMetricsView.as_view()),
    path("api/admin/inventory/low", LowInventoryView.as_view()),
    path("api/", include(router.urls)),
]
