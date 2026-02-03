from rest_framework.test import APITestCase

from cart.models import Cart, CartItem
from catalog.models import Product, ProductVariant


class OrderApiTests(APITestCase):
    def setUp(self) -> None:
        self.product = Product.objects.create(
            title="Necklace",
            slug="necklace",
            base_price="45000.00",
            currency="NGN",
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name="Gold",
            sku="NECKLACE-GOLD",
            price="45000.00",
            stock_quantity=2,
        )

    def test_create_order(self) -> None:
        response = self.client.post(
            "/api/orders/",
            {
                "guest_email": "guest@example.com",
                "status": "pending",
                "currency": "NGN",
                "subtotal": "45000.00",
                "tax": "0.00",
                "shipping": "0.00",
                "total": "45000.00",
                "shipping_name": "Guest Buyer",
                "shipping_phone": "+2347000000000",
                "shipping_address1": "1 Example St",
                "shipping_address2": "",
                "shipping_city": "Lagos",
                "shipping_state": "Lagos",
                "shipping_postal_code": "100001",
                "shipping_country": "NG",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        order_id = response.data["id"]

        item_response = self.client.post(
            "/api/order-items/",
            {
                "order": order_id,
                "product_variant": self.variant.id,
                "quantity": 1,
                "price_at_purchase": "45000.00",
                "product_title": self.product.title,
                "variant_name": self.variant.name,
                "sku_snapshot": self.variant.sku,
            },
            format="json",
        )
        self.assertEqual(item_response.status_code, 201)

    def test_checkout_and_refund(self) -> None:
        cart = Cart.objects.create(session_key="sess-1")
        CartItem.objects.create(cart=cart, product_variant=self.variant, quantity=1)

        checkout_response = self.client.post(
            "/api/checkout",
            {
                "cart_id": cart.id,
                "guest_email": "guest@example.com",
                "shipping_name": "Guest Buyer",
                "shipping_phone": "+2347000000000",
                "shipping_address1": "1 Example St",
                "shipping_city": "Lagos",
                "shipping_state": "Lagos",
                "shipping_postal_code": "100001",
                "shipping_country": "NG",
            },
            format="json",
        )
        self.assertEqual(checkout_response.status_code, 201)
        order_id = checkout_response.data["id"]

        refund_response = self.client.post(f"/api/orders/{order_id}/refund/", format="json")
        self.assertEqual(refund_response.status_code, 200)

    def test_orders_by_email(self) -> None:
        self.client.post(
            "/api/orders/",
            {
                "guest_email": "guest@example.com",
                "status": "pending",
                "currency": "NGN",
                "subtotal": "45000.00",
                "tax": "0.00",
                "shipping": "0.00",
                "total": "45000.00",
                "shipping_name": "Guest Buyer",
                "shipping_phone": "+2347000000000",
                "shipping_address1": "1 Example St",
                "shipping_address2": "",
                "shipping_city": "Lagos",
                "shipping_state": "Lagos",
                "shipping_postal_code": "100001",
                "shipping_country": "NG",
            },
            format="json",
        )

        list_response = self.client.get("/api/orders/?email=guest@example.com")
        self.assertEqual(list_response.status_code, 200)

        order_id = list_response.data[0]["id"]
        patch_response = self.client.patch(
            f"/api/orders/{order_id}/",
            {"status": "fulfilled"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
