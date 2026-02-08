from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from catalog.models import Product


class RecommendationsApiTests(APITestCase):
    def test_create_recommendation(self) -> None:
        user = get_user_model().objects.create_user(
            username="reco", email="reco@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="Gemstone",
            slug="gemstone",
            base_price="30000.00",
            currency="NGN",
        )

        response = self.client.post(
            "/api/recommendations/",
            {"user": user.id, "product": product.id, "score": 0.9},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        user_filter_response = self.client.get(f"/api/recommendations/?user_id={user.id}")
        self.assertEqual(user_filter_response.status_code, 200)

        product_filter_response = self.client.get(
            f"/api/recommendations/?product_id={product.id}"
        )
        self.assertEqual(product_filter_response.status_code, 200)
