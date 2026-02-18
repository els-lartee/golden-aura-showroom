from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase

from analytics.models import Event
from catalog.models import Product
from recommendations.scoring import update_recommendation_from_event


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


class RecommendationScoringTests(TestCase):
    def test_ar_session_start_increases_score(self) -> None:
        user = get_user_model().objects.create_user(
            username="arstart", email="arstart@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="AR Start Ring",
            slug="ar-start-ring",
            base_price="10000.00",
            currency="NGN",
        )
        event = Event.objects.create(
            user=user,
            product=product,
            event_type=Event.EventType.AR_SESSION_START,
            metadata={"model_url": "/models/ar-start.glb"},
        )

        update_recommendation_from_event(event)

        self.assertEqual(user.recommendation_set.count(), 1)
        rec = user.recommendation_set.first()
        self.assertIsNotNone(rec)
        self.assertGreater(rec.score, 0)

    def test_ar_session_end_below_threshold_does_not_score(self) -> None:
        user = get_user_model().objects.create_user(
            username="arshort", email="arshort@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="AR Short Ring",
            slug="ar-short-ring",
            base_price="12000.00",
            currency="NGN",
        )
        event = Event.objects.create(
            user=user,
            product=product,
            event_type=Event.EventType.AR_SESSION_END,
            metadata={"duration_seconds": 10},
        )

        update_recommendation_from_event(event)

        self.assertEqual(user.recommendation_set.count(), 0)

    def test_ar_session_end_above_threshold_scores(self) -> None:
        user = get_user_model().objects.create_user(
            username="arlong", email="arlong@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="AR Long Ring",
            slug="ar-long-ring",
            base_price="14000.00",
            currency="NGN",
        )
        event = Event.objects.create(
            user=user,
            product=product,
            event_type=Event.EventType.AR_SESSION_END,
            metadata={"duration_seconds": 25},
        )

        update_recommendation_from_event(event)

        self.assertEqual(user.recommendation_set.count(), 1)
        rec = user.recommendation_set.first()
        self.assertIsNotNone(rec)
        self.assertGreater(rec.score, 0)
