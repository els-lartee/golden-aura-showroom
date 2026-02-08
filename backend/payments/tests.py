from rest_framework.test import APITestCase

from orders.models import Order


class PaymentApiTests(APITestCase):
    def setUp(self) -> None:
        self.order = Order.objects.create(
            guest_email="buyer@example.com",
            status="pending",
            currency="NGN",
            subtotal="10000.00",
            tax="0.00",
            shipping="0.00",
            total="10000.00",
            shipping_name="Buyer",
            shipping_phone="+2347000000000",
            shipping_address1="1 Street",
            shipping_address2="",
            shipping_city="Abuja",
            shipping_state="FCT",
            shipping_postal_code="900001",
            shipping_country="NG",
        )

    def test_create_payment(self) -> None:
        response = self.client.post(
            "/api/payments/",
            {
                "order": self.order.id,
                "provider": "paystack",
                "reference": "ref-123",
                "status": "initiated",
                "amount": "10000.00",
                "currency": "NGN",
                "raw_payload": {},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)

    def test_initialize_verify_webhook(self) -> None:
        init_response = self.client.post(
            "/api/payments/initialize",
            {"order": self.order.id, "amount": "10000.00"},
            format="json",
        )
        self.assertEqual(init_response.status_code, 201)
        reference = init_response.data["reference"]

        verify_response = self.client.post(
            "/api/payments/verify",
            {"reference": reference},
            format="json",
        )
        self.assertEqual(verify_response.status_code, 200)

        webhook_response = self.client.post(
            "/api/payments/webhook",
            {"reference": reference},
            format="json",
        )
        self.assertEqual(webhook_response.status_code, 200)
