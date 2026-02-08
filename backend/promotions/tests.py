from rest_framework.test import APITestCase


class PromotionsApiTests(APITestCase):
    def test_create_coupon(self) -> None:
        response = self.client.post(
            "/api/coupons/",
            {
                "code": "WELCOME10",
                "discount_type": "percent",
                "value": "10.00",
                "active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        validate_response = self.client.post(
            "/api/coupons/validate",
            {"code": "WELCOME10"},
            format="json",
        )
        self.assertEqual(validate_response.status_code, 200)

    def test_create_promotion_rule(self) -> None:
        response = self.client.post(
            "/api/promotion-rules/",
            {
                "name": "Launch Offer",
                "description": "10 off",
                "active": True,
                "min_cart_value": "10000.00",
                "discount_type": "fixed",
                "value": "1000.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        active_response = self.client.get("/api/promotions/active")
        self.assertEqual(active_response.status_code, 200)
