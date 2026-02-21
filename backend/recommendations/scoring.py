from __future__ import annotations

from datetime import datetime, timezone
from math import exp
from typing import Any

from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import transaction

from analytics.models import Event
from catalog.models import Product
from recommendations.models import Recommendation

EVENT_WEIGHTS = {
    Event.EventType.VIEW: 1.0,
    Event.EventType.CLICK: 2.0,
    Event.EventType.LIKE: 3.0,
    Event.EventType.FAVORITE: 4.0,
    Event.EventType.ADD_TO_CART: 5.0,
    Event.EventType.PURCHASE: 8.0,
    Event.EventType.AR_SESSION_START: 1.5,
    Event.EventType.AR_SESSION_END: 4.0,
    Event.EventType.AR_SCREENSHOT: 3.0,
}

DECAY_DAYS = 7
MAX_RECOMMENDATIONS_PER_USER = 50
TAG_SIMILARITY_WEIGHT = 0.5
AR_MIN_ENGAGED_SECONDS = getattr(settings, "AR_MIN_ENGAGED_SECONDS", 20)


def _decay_factor(created_at: datetime) -> float:
    if not created_at:
        return 1.0
    delta_days = (datetime.now(timezone.utc) - created_at).total_seconds() / 86400
    return exp(-delta_days / DECAY_DAYS)


def _duration_boost(metadata: dict) -> float:
    seconds = metadata.get("seconds") or metadata.get("duration") or 0
    try:
        seconds = float(seconds)
    except (TypeError, ValueError):
        return 1.0
    return min(1.0 + seconds / 30.0, 2.0)


def _get_duration_seconds(metadata: dict) -> float:
    seconds = metadata.get("duration_seconds") or metadata.get("seconds") or metadata.get("duration") or 0
    try:
        return float(seconds)
    except (TypeError, ValueError):
        return 0.0


def _should_score_event(event: Event) -> bool:
    if event.event_type == Event.EventType.AR_SESSION_END:
        return _get_duration_seconds(event.metadata) >= AR_MIN_ENGAGED_SECONDS
    return True


def _trim_recommendations(owner_filters: dict[str, Any]) -> None:
    ids_to_keep = (
        Recommendation.objects.filter(**owner_filters)
        .order_by("-score")
        .values_list("id", flat=True)[:MAX_RECOMMENDATIONS_PER_USER]
    )
    Recommendation.objects.filter(**owner_filters).exclude(id__in=ids_to_keep).delete()


def update_recommendation_from_event(event: Event) -> None:
    if not event.product_id:
        return
    if not _should_score_event(event):
        return

    owner_filters: dict[str, Any]
    if event.user_id:
        owner_filters = {"user_id": event.user_id, "session_key": None}
    elif event.session_key:
        owner_filters = {"user": None, "session_key": event.session_key}
    else:
        return

    base_weight = EVENT_WEIGHTS.get(event.event_type, 1.0)
    score_delta = base_weight * _duration_boost(event.metadata) * _decay_factor(event.created_at)

    recommendation, _ = Recommendation.objects.get_or_create(
        product_id=event.product_id,
        defaults={"model_version": "heuristic-v1", **owner_filters},
        **owner_filters,
    )
    recommendation.score = (recommendation.score or 0) + score_delta
    recommendation.model_version = "heuristic-v1"
    recommendation.save(update_fields=["score", "model_version"])

    _trim_recommendations(owner_filters)


def rebuild_recommendations_for_user(user_id: int) -> None:
    events = (
        Event.objects.filter(user_id=user_id)
        .select_related("product")
        .prefetch_related("product__tags")
        .order_by("-created_at")
    )
    if not events.exists():
        Recommendation.objects.filter(user_id=user_id).delete()
        return

    scores: dict[int, float] = {}
    tag_weights: dict[int, float] = {}
    for event in events:
        if not _should_score_event(event):
            continue
        if not event.product_id:
            continue
        base_weight = EVENT_WEIGHTS.get(event.event_type, 1.0)
        score_delta = base_weight * _duration_boost(event.metadata) * _decay_factor(event.created_at)
        scores[event.product_id] = scores.get(event.product_id, 0.0) + score_delta

        if event.product_id and event.product:
            for tag in event.product.tags.all():
                tag_weights[tag.id] = tag_weights.get(tag.id, 0.0) + score_delta

    if tag_weights:
        tag_ids = list(tag_weights.keys())
        tagged_products = Product.objects.filter(tags__in=tag_ids).prefetch_related("tags").distinct()
        for product in tagged_products:
            tag_score = sum(tag_weights.get(tag.id, 0.0) for tag in product.tags.all())
            if tag_score:
                scores[product.id] = scores.get(product.id, 0.0) + tag_score * TAG_SIMILARITY_WEIGHT

    Recommendation.objects.filter(user_id=user_id).delete()
    recommendations = [
        Recommendation(
            user_id=user_id,
            session_key=None,
            product_id=product_id,
            score=score,
            model_version="heuristic-v1",
        )
        for product_id, score in scores.items()
    ]
    Recommendation.objects.bulk_create(recommendations)

    _trim_recommendations({"user_id": user_id, "session_key": None})


def rebuild_recommendations_for_session(session_key: str) -> None:
    if not session_key:
        return

    events = (
        Event.objects.filter(session_key=session_key)
        .select_related("product")
        .prefetch_related("product__tags")
        .order_by("-created_at")
    )
    if not events.exists():
        Recommendation.objects.filter(session_key=session_key, user__isnull=True).delete()
        return

    scores: dict[int, float] = {}
    tag_weights: dict[int, float] = {}
    for event in events:
        if event.user_id or not _should_score_event(event):
            continue
        if not event.product_id:
            continue

        base_weight = EVENT_WEIGHTS.get(event.event_type, 1.0)
        score_delta = base_weight * _duration_boost(event.metadata) * _decay_factor(event.created_at)
        scores[event.product_id] = scores.get(event.product_id, 0.0) + score_delta

        if event.product:
            for tag in event.product.tags.all():
                tag_weights[tag.id] = tag_weights.get(tag.id, 0.0) + score_delta

    if tag_weights:
        tag_ids = list(tag_weights.keys())
        tagged_products = Product.objects.filter(tags__in=tag_ids).prefetch_related("tags").distinct()
        for product in tagged_products:
            tag_score = sum(tag_weights.get(tag.id, 0.0) for tag in product.tags.all())
            if tag_score:
                scores[product.id] = scores.get(product.id, 0.0) + tag_score * TAG_SIMILARITY_WEIGHT

    Recommendation.objects.filter(session_key=session_key, user__isnull=True).delete()
    recommendations = [
        Recommendation(
            user=None,
            session_key=session_key,
            product_id=product_id,
            score=score,
            model_version="heuristic-v1",
        )
        for product_id, score in scores.items()
    ]
    Recommendation.objects.bulk_create(recommendations)
    _trim_recommendations({"user": None, "session_key": session_key})


def merge_session_recommendations_into_user(session_key: str | None, user_id: int) -> None:
    if not session_key:
        return

    with transaction.atomic():
        session_recommendations = list(
            Recommendation.objects.filter(session_key=session_key, user__isnull=True)
        )
        if not session_recommendations:
            return

        existing = {
            rec.product_id: rec
            for rec in Recommendation.objects.filter(user_id=user_id, session_key__isnull=True)
        }

        to_update: list[Recommendation] = []
        to_create: list[Recommendation] = []
        for session_rec in session_recommendations:
            existing_rec = existing.get(session_rec.product_id)
            if existing_rec:
                existing_rec.score = (existing_rec.score or 0) + (session_rec.score or 0)
                existing_rec.model_version = "heuristic-v1"
                to_update.append(existing_rec)
            else:
                to_create.append(
                    Recommendation(
                        user_id=user_id,
                        session_key=None,
                        product_id=session_rec.product_id,
                        score=session_rec.score or 0,
                        model_version="heuristic-v1",
                    )
                )

        if to_create:
            Recommendation.objects.bulk_create(to_create)
        if to_update:
            Recommendation.objects.bulk_update(to_update, ["score", "model_version"])

        Recommendation.objects.filter(session_key=session_key, user__isnull=True).delete()
        _trim_recommendations({"user_id": user_id, "session_key": None})


def mark_user_dirty(user_id: int) -> None:
    """Flag a user so the daily rebuild picks them up."""
    from recommendations.models import UserFeature

    UserFeature.objects.update_or_create(
        user_id=user_id, defaults={"needs_rebuild": True}
    )


def rebuild_dirty_users() -> int:
    """Rebuild recommendations only for users with new events since last rebuild."""
    from recommendations.models import UserFeature

    dirty = UserFeature.objects.filter(needs_rebuild=True).values_list("user_id", flat=True)
    count = 0
    for user_id in dirty:
        rebuild_recommendations_for_user(user_id)
        count += 1
    UserFeature.objects.filter(user_id__in=dirty).update(needs_rebuild=False)
    return count


def rebuild_recommendations_for_all_users() -> None:
    User = get_user_model()
    user_ids = User.objects.values_list("id", flat=True)
    for user_id in user_ids:
        rebuild_recommendations_for_user(user_id)
    # Clear dirty flags after full rebuild
    from recommendations.models import UserFeature
    UserFeature.objects.filter(needs_rebuild=True).update(needs_rebuild=False)