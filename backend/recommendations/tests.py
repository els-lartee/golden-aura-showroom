from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase

from analytics.models import Event
from catalog.models import Product, Tag
from recommendations.models import Recommendation
from recommendations.scoring import (
    merge_session_recommendations_into_user,
    update_recommendation_from_event,
)


class RecommendationsApiTests(APITestCase):
    def test_anonymous_request_requires_session_key(self) -> None:
        response = self.client.get("/api/recommendations/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("session_key", response.data)

    def test_anonymous_session_scope_is_isolated(self) -> None:
        product_a = Product.objects.create(
            title="Session A Product",
            slug="session-a-product",
            base_price="30000.00",
            currency="NGN",
        )
        product_b = Product.objects.create(
            title="Session B Product",
            slug="session-b-product",
            base_price="30000.00",
            currency="NGN",
        )

        client_a = APIClient()
        session_a = client_a.session
        session_a.save()
        session_key_a = session_a.session_key

        client_b = APIClient()
        session_b = client_b.session
        session_b.save()
        session_key_b = session_b.session_key

        Recommendation.objects.create(
            user=None, session_key=session_key_a, product=product_a, score=1.5
        )
        Recommendation.objects.create(
            user=None, session_key=session_key_b, product=product_b, score=2.5
        )

        own_scope_response = client_a.get(
            "/api/recommendations/", {"session_key": session_key_a}
        )
        self.assertEqual(own_scope_response.status_code, 200)
        self.assertEqual(len(own_scope_response.data), 1)
        self.assertEqual(own_scope_response.data[0]["product"], product_a.id)

        forbidden_scope_response = client_a.get(
            "/api/recommendations/", {"session_key": session_key_b}
        )
        self.assertEqual(forbidden_scope_response.status_code, 403)

    def test_authenticated_user_cannot_override_scope_via_user_id(self) -> None:
        user_a = get_user_model().objects.create_user(
            username="usera", email="usera@example.com", password="pass1234"
        )
        user_b = get_user_model().objects.create_user(
            username="userb", email="userb@example.com", password="pass1234"
        )
        product_a = Product.objects.create(
            title="User A Product",
            slug="user-a-product",
            base_price="30000.00",
            currency="NGN",
        )
        product_b = Product.objects.create(
            title="User B Product",
            slug="user-b-product",
            base_price="30000.00",
            currency="NGN",
        )

        Recommendation.objects.create(user=user_a, session_key=None, product=product_a, score=1.0)
        Recommendation.objects.create(user=user_b, session_key=None, product=product_b, score=1.0)

        self.client.force_login(user_a)
        response = self.client.get("/api/recommendations/", {"user_id": user_b.id})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["user"], user_a.id)

    def test_login_merges_session_recommendations_into_user(self) -> None:
        user = get_user_model().objects.create_user(
            username="mergeuser", email="merge@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="Merge Product",
            slug="merge-product",
            base_price="30000.00",
            currency="NGN",
        )

        client = APIClient()
        anon_session = client.session
        anon_session.save()
        session_key = anon_session.session_key

        Recommendation.objects.create(
            user=None,
            session_key=session_key,
            product=product,
            score=2.0,
            model_version="heuristic-v1",
        )

        response = client.post(
            "/api/auth/login",
            {"username": user.username, "password": "pass1234"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.assertFalse(
            Recommendation.objects.filter(session_key=session_key, user__isnull=True).exists()
        )
        merged = Recommendation.objects.get(user=user, product=product)
        self.assertEqual(merged.score, 2.0)


class RecommendationScoringTests(TestCase):
    def test_click_event_scores_tag_similar_products(self) -> None:
        user = get_user_model().objects.create_user(
            username="tagsim", email="tagsim@example.com", password="pass1234"
        )
        shared_tag = Tag.objects.create(name="Gold", slug="gold")

        clicked_product = Product.objects.create(
            title="Clicked Ring",
            slug="clicked-ring",
            base_price="12000.00",
            currency="NGN",
        )
        clicked_product.tags.add(shared_tag)

        similar_product = Product.objects.create(
            title="Similar Ring",
            slug="similar-ring",
            base_price="11000.00",
            currency="NGN",
        )
        similar_product.tags.add(shared_tag)

        event = Event.objects.create(
            user=user,
            product=clicked_product,
            event_type=Event.EventType.CLICK,
            metadata={},
        )

        update_recommendation_from_event(event)

        self.assertTrue(
            Recommendation.objects.filter(user=user, product=clicked_product).exists()
        )
        similar_rec = Recommendation.objects.get(user=user, product=similar_product)
        self.assertGreater(similar_rec.score, 0)

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

    def test_session_only_event_creates_session_recommendation(self) -> None:
        product = Product.objects.create(
            title="Session Event Ring",
            slug="session-event-ring",
            base_price="14000.00",
            currency="NGN",
        )
        event = Event.objects.create(
            user=None,
            session_key="session-event-key",
            product=product,
            event_type=Event.EventType.CLICK,
            metadata={},
        )

        update_recommendation_from_event(event)

        rec = Recommendation.objects.get(
            session_key="session-event-key", product=product, user__isnull=True
        )
        self.assertGreater(rec.score, 0)

    def test_mixed_session_and_user_events_remain_separate(self) -> None:
        user = get_user_model().objects.create_user(
            username="mixeduser", email="mixed@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="Mixed Stream Ring",
            slug="mixed-stream-ring",
            base_price="14000.00",
            currency="NGN",
        )

        session_event = Event.objects.create(
            user=None,
            session_key="mixed-session",
            product=product,
            event_type=Event.EventType.VIEW,
            metadata={},
        )
        user_event = Event.objects.create(
            user=user,
            session_key="mixed-session",
            product=product,
            event_type=Event.EventType.ADD_TO_CART,
            metadata={},
        )

        update_recommendation_from_event(session_event)
        update_recommendation_from_event(user_event)

        self.assertTrue(
            Recommendation.objects.filter(
                session_key="mixed-session", product=product, user__isnull=True
            ).exists()
        )
        self.assertTrue(
            Recommendation.objects.filter(user=user, product=product, session_key__isnull=True).exists()
        )

    def test_merge_session_recommendations_accumulates_existing_user_score(self) -> None:
        user = get_user_model().objects.create_user(
            username="mergeacc", email="mergeacc@example.com", password="pass1234"
        )
        product = Product.objects.create(
            title="Merge Acc Ring",
            slug="merge-acc-ring",
            base_price="14000.00",
            currency="NGN",
        )

        Recommendation.objects.create(
            user=user, session_key=None, product=product, score=1.0, model_version="heuristic-v1"
        )
        Recommendation.objects.create(
            user=None,
            session_key="merge-session",
            product=product,
            score=2.0,
            model_version="heuristic-v1",
        )

        merge_session_recommendations_into_user("merge-session", user.id)

        rec = Recommendation.objects.get(user=user, product=product)
        self.assertEqual(rec.score, 3.0)
        self.assertFalse(
            Recommendation.objects.filter(session_key="merge-session", user__isnull=True).exists()
        )

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
