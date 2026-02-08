from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from catalog.models import Product


class AnalyticsApiTests(APITestCase):
    def test_create_event(self) -> None:
        product = Product.objects.create(
            title="Ring",
            slug="ring",
            base_price="20000.00",
            currency="NGN",
        )
        user = get_user_model().objects.create_user(
            username="eventuser", email="event@example.com", password="pass1234"
        )

        response = self.client.post(
            "/api/events/",
            {"event_type": "view", "product": product.id, "user": user.id},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_batch_and_admin_metrics(self) -> None:
        product = Product.objects.create(
            title="Pendant",
            slug="pendant",
            base_price="15000.00",
            currency="NGN",
        )
        user = get_user_model().objects.create_user(
            username="batchuser", email="batch@example.com", password="pass1234"
        )

        batch_response = self.client.post(
            "/api/events/batch",
            {
                "events": [
                    {"event_type": "view", "product": product.id, "user": user.id},
                    {"event_type": "click", "product": product.id, "user": user.id},
                ]
            },
            format="json",
        )
        self.assertEqual(batch_response.status_code, 201)

        admin_user = get_user_model().objects.create_superuser(
            username="admin", email="admin@example.com", password="pass1234"
        )
        self.client.force_authenticate(user=admin_user)
        metrics_response = self.client.get("/api/admin/metrics")
        self.assertEqual(metrics_response.status_code, 200)

    def test_recent_views_requires_auth(self) -> None:
        response = self.client.get("/api/recent-views")
        self.assertEqual(response.status_code, 403)

    def test_recent_views_returns_unique_products(self) -> None:
        user = get_user_model().objects.create_user(
            username="recentuser", email="recent@example.com", password="pass1234"
        )
        product_one = Product.objects.create(
            title="Gold Ring",
            slug="gold-ring",
            base_price="10000.00",
            currency="NGN",
        )
        product_two = Product.objects.create(
            title="Silver Necklace",
            slug="silver-necklace",
            base_price="12000.00",
            currency="NGN",
        )

        self.client.force_authenticate(user=user)
        self.client.post(
            "/api/events/",
            {"event_type": "view", "product": product_one.id, "user": user.id},
            format="json",
        )
        self.client.post(
            "/api/events/",
            {"event_type": "view", "product": product_one.id, "user": user.id},
            format="json",
        )
        self.client.post(
            "/api/events/",
            {"event_type": "view", "product": product_two.id, "user": user.id},
            format="json",
        )

        response = self.client.get("/api/recent-views?limit=4")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["id"], product_two.id)
        self.assertEqual(response.data[1]["id"], product_one.id)

    def test_clear_recent_views(self) -> None:
        user = get_user_model().objects.create_user(
            username="clearuser", email="clear@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="Bracelet",
            slug="bracelet",
            base_price="9000.00",
            currency="NGN",
        )

        self.client.force_authenticate(user=user)
        self.client.post(
            "/api/events/",
            {"event_type": "view", "product": product.id, "user": user.id},
            format="json",
        )

        delete_response = self.client.delete("/api/recent-views")
        self.assertEqual(delete_response.status_code, 200)
        self.assertEqual(delete_response.data["deleted"], 1)

        list_response = self.client.get("/api/recent-views")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data, [])
