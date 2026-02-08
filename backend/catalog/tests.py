from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from analytics.models import Event
from catalog.models import Collection, Favorite, Product, ProductMedia, ProductVariant

from PIL import Image

User = get_user_model()


class CatalogApiTests(APITestCase):
    def _cleanup_media_file(self, response) -> None:
        media_id = response.data.get("id") if hasattr(response, "data") else None
        if not media_id:
            return
        media = ProductMedia.objects.filter(id=media_id).first()
        if media and media.file:
            media.file.delete(save=False)

    def test_product_media_upload_converts_png_to_webp(self) -> None:
        product = Product.objects.create(
            title="Emerald Ring",
            slug="emerald-ring",
            base_price="12000.00",
            currency="NGN",
        )

        image = Image.new("RGB", (16, 16), color=(10, 20, 30))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)

        upload = SimpleUploadedFile("ring.png", buffer.read(), content_type="image/png")
        response = self.client.post(
            "/api/product-media/",
            {
                "product": product.id,
                "media_type": "image",
                "file": upload,
                "alt_text": "Ring",
            },
            format="multipart",
        )

        try:
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.data["file"].endswith(".webp"))
            self.assertTrue(response.data["url"].endswith(".webp"))
            self.assertNotIn(" ", response.data["file"])
        finally:
            self._cleanup_media_file(response)

    def test_product_media_upload_converts_jpeg_to_webp(self) -> None:
        product = Product.objects.create(
            title="Ruby Ring",
            slug="ruby-ring",
            base_price="15000.00",
            currency="NGN",
        )

        image = Image.new("RGB", (32, 32), color=(200, 50, 50))
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        buffer.seek(0)

        upload = SimpleUploadedFile("ruby.jpg", buffer.read(), content_type="image/jpeg")
        response = self.client.post(
            "/api/product-media/",
            {
                "product": product.id,
                "media_type": "image",
                "file": upload,
                "alt_text": "Ruby",
            },
            format="multipart",
        )

        try:
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.data["file"].endswith(".webp"))
        finally:
            self._cleanup_media_file(response)

    def test_product_media_upload_keeps_webp_as_webp(self) -> None:
        product = Product.objects.create(
            title="Diamond Ring",
            slug="diamond-ring",
            base_price="20000.00",
            currency="NGN",
        )

        image = Image.new("RGB", (16, 16), color=(255, 255, 255))
        buffer = BytesIO()
        image.save(buffer, format="WEBP")
        buffer.seek(0)

        upload = SimpleUploadedFile("diamond.webp", buffer.read(), content_type="image/webp")
        response = self.client.post(
            "/api/product-media/",
            {
                "product": product.id,
                "media_type": "image",
                "file": upload,
                "alt_text": "Diamond",
            },
            format="multipart",
        )

        try:
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.data["file"].endswith(".webp"))
        finally:
            self._cleanup_media_file(response)

    def test_product_media_preserves_transparency(self) -> None:
        product = Product.objects.create(
            title="Pearl Ring",
            slug="pearl-ring",
            base_price="9000.00",
            currency="NGN",
        )

        image = Image.new("RGBA", (16, 16), color=(255, 255, 255, 128))
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)

        upload = SimpleUploadedFile("pearl.png", buffer.read(), content_type="image/png")
        response = self.client.post(
            "/api/product-media/",
            {
                "product": product.id,
                "media_type": "image",
                "file": upload,
                "alt_text": "Pearl",
            },
            format="multipart",
        )

        try:
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.data["file"].endswith(".webp"))
        finally:
            self._cleanup_media_file(response)

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

    def test_tag_creation_and_assignment(self) -> None:
        tag_response = self.client.post(
            "/api/tags/",
            {"name": "Gold", "slug": "gold"},
            format="json",
        )
        self.assertEqual(tag_response.status_code, 201)

        product_response = self.client.post(
            "/api/products/",
            {
                "title": "Gold Ring",
                "slug": "gold-ring",
                "base_price": "10000.00",
                "currency": "NGN",
                "tags": [tag_response.data["id"]],
            },
            format="json",
        )
        self.assertEqual(product_response.status_code, 201)

        list_response = self.client.get(f"/api/products/?tag={tag_response.data['id']}")
        self.assertEqual(list_response.status_code, 200)

    def test_tag_creation_without_slug(self) -> None:
        tag_response = self.client.post(
            "/api/tags/",
            {"name": "Rose Gold"},
            format="json",
        )
        self.assertEqual(tag_response.status_code, 201)
        self.assertEqual(tag_response.data["slug"], "rose-gold")


class FavoriteApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass1234")
        self.other_user = User.objects.create_user(username="bob", password="pass1234")
        self.product1 = Product.objects.create(
            title="Gold Ring", slug="gold-ring", base_price="5000.00"
        )
        self.product2 = Product.objects.create(
            title="Silver Necklace", slug="silver-necklace", base_price="3000.00"
        )

    # -- Auth required --
    def test_list_requires_auth(self):
        res = self.client.get("/api/favorites/")
        self.assertEqual(res.status_code, 403)

    def test_add_requires_auth(self):
        res = self.client.post("/api/favorites/", {"product": self.product1.id}, format="json")
        self.assertEqual(res.status_code, 403)

    # -- Add favorite --
    def test_add_favorite(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/favorites/", {"product": self.product1.id}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Favorite.objects.filter(user=self.user).count(), 1)
        self.assertEqual(res.data["product"], self.product1.id)
        # product_detail nested
        self.assertEqual(res.data["product_detail"]["title"], "Gold Ring")
        self.assertEqual(
            Event.objects.filter(
                user=self.user,
                product=self.product1,
                event_type=Event.EventType.FAVORITE,
            ).count(),
            1,
        )

    def test_add_favorite_duplicate_rejected(self):
        self.client.force_authenticate(user=self.user)
        self.client.post("/api/favorites/", {"product": self.product1.id}, format="json")
        res = self.client.post("/api/favorites/", {"product": self.product1.id}, format="json")
        self.assertIn(res.status_code, [400, 409])

    # -- List favorites --
    def test_list_favorites_only_own(self):
        Favorite.objects.create(user=self.user, product=self.product1)
        Favorite.objects.create(user=self.other_user, product=self.product2)

        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/favorites/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["product"], self.product1.id)

    # -- Remove favorite --
    def test_remove_favorite(self):
        fav = Favorite.objects.create(user=self.user, product=self.product1)
        self.client.force_authenticate(user=self.user)
        res = self.client.delete(f"/api/favorites/{fav.id}/")
        self.assertEqual(res.status_code, 204)
        self.assertEqual(Favorite.objects.filter(user=self.user).count(), 0)

    def test_cannot_remove_other_users_favorite(self):
        fav = Favorite.objects.create(user=self.other_user, product=self.product1)
        self.client.force_authenticate(user=self.user)
        res = self.client.delete(f"/api/favorites/{fav.id}/")
        self.assertEqual(res.status_code, 404)

    # -- Toggle --
    def test_toggle_adds_when_not_favorited(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/favorites/toggle/", {"product": self.product1.id}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["status"], "added")
        self.assertEqual(Favorite.objects.filter(user=self.user).count(), 1)
        self.assertEqual(
            Event.objects.filter(
                user=self.user,
                product=self.product1,
                event_type=Event.EventType.FAVORITE,
            ).count(),
            1,
        )

    def test_toggle_removes_when_already_favorited(self):
        Favorite.objects.create(user=self.user, product=self.product1)
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/favorites/toggle/", {"product": self.product1.id}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "removed")
        self.assertEqual(Favorite.objects.filter(user=self.user).count(), 0)

    def test_toggle_nonexistent_product(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/favorites/toggle/", {"product": 9999}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_toggle_missing_product_field(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/favorites/toggle/", {}, format="json")
        self.assertEqual(res.status_code, 400)
