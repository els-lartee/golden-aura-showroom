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
