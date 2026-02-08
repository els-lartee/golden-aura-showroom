from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from cart.models import Cart
from catalog.models import Product, ProductVariant


class CartApiTests(APITestCase):
    def setUp(self) -> None:
        self.product = Product.objects.create(
            title="Bracelet",
            slug="bracelet",
            base_price="12000.00",
            currency="NGN",
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name="Standard",
            sku="BRACELET-STD",
            price="12000.00",
            stock_quantity=5,
        )

    def test_create_cart_and_item(self) -> None:
        cart_response = self.client.post(
            "/api/carts/", {"session_key": "session-1", "status": "open"}, format="json"
        )
        self.assertEqual(cart_response.status_code, 201)

        cart_id = cart_response.data["id"]
        item_response = self.client.post(
            "/api/cart-items/",
            {"cart": cart_id, "product_variant": self.variant.id, "quantity": 2},
            format="json",
        )
        self.assertEqual(item_response.status_code, 201)

    def test_current_cart_for_session(self) -> None:
        response = self.client.get("/api/cart/current")
        self.assertEqual(response.status_code, 200)

    def test_merge_cart(self) -> None:
        cart_response = self.client.get("/api/cart/current")
        cart_id = cart_response.data["id"]
        self.client.post(
            "/api/cart-items/",
            {"cart": cart_id, "product_variant": self.variant.id, "quantity": 1},
            format="json",
        )

        user = get_user_model().objects.create_user(
            username="cartuser", password="pass1234"
        )
        self.client.force_authenticate(user=user)
        merge_response = self.client.post("/api/cart/merge", format="json")
        self.assertEqual(merge_response.status_code, 200)

    def test_abandon_cart(self) -> None:
        cart_response = self.client.get("/api/cart/current")
        cart_id = cart_response.data["id"]
        abandon_response = self.client.post("/api/cart/abandon", format="json")
        self.assertEqual(abandon_response.status_code, 200)
        self.assertEqual(Cart.objects.get(id=cart_id).status, Cart.Status.ABANDONED)
