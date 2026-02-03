from rest_framework.test import APITestCase

from catalog.models import Collection, Product, ProductVariant


class CatalogApiTests(APITestCase):
    def test_create_product_and_variant(self) -> None:
        response = self.client.post(
            "/api/products/",
            {
                "title": "Golden Ring",
                "slug": "golden-ring",
                "description": "Test",
                "status": "active",
                "base_price": "25000.00",
                "currency": "NGN",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        product_id = response.data["id"]

        variant_response = self.client.post(
            "/api/product-variants/",
            {
                "product": product_id,
                "name": "Size 7",
                "sku": "RING-7",
                "price": "25000.00",
                "stock_quantity": 10,
                "is_active": True,
            },
            format="json",
        )

        self.assertEqual(variant_response.status_code, 201)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(ProductVariant.objects.count(), 1)

    def test_collection_assignment(self) -> None:
        collection = Collection.objects.create(name="Classics", slug="classics")
        product = Product.objects.create(
            title="Pendant",
            slug="pendant",
            base_price="15000.00",
            currency="NGN",
        )
        product.collections.add(collection)

        response = self.client.get(f"/api/products/{product.id}/")
        self.assertEqual(response.status_code, 200)

    def test_search_filters_and_inventory(self) -> None:
        product = Product.objects.create(
            title="Silver Ring",
            slug="silver-ring",
            base_price="8000.00",
            currency="NGN",
        )
        ProductVariant.objects.create(
            product=product,
            name="Size 6",
            sku="SILVER-6",
            price="8000.00",
            stock_quantity=2,
        )

        search_response = self.client.get("/api/products/?query=Silver")
        self.assertEqual(search_response.status_code, 200)

        low_inventory_response = self.client.get("/api/admin/inventory/low")
        self.assertEqual(low_inventory_response.status_code, 403)

        from django.contrib.auth import get_user_model

        admin_user = get_user_model().objects.create_superuser(
            username="admin2", email="admin2@example.com", password="pass1234"
        )
        self.client.force_authenticate(user=admin_user)
        low_inventory_response = self.client.get("/api/admin/inventory/low?threshold=3")
        self.assertEqual(low_inventory_response.status_code, 200)
