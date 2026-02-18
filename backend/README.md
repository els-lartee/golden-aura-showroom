# Golden Aura — Backend

Django + Django REST Framework API for the Golden Aura jewellery e-commerce platform.

## Local Development

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (or pip + venv)
- PostgreSQL (or use SQLite for quick setup)

### Setup

```bash
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

If Postgres is unavailable, prefix commands with `DJANGO_USE_SQLITE=true`.

For CSRF/secure cookie issues in development, also add `DJANGO_SECURE_COOKIES=false`.

### Environment Variables

Create a `.env` file in `backend/golden_aura/` for local overrides. See [deploy_backend.md](deploy_backend.md) for the full list.

Key variables for local dev:

```env
DJANGO_DEBUG=true
DJANGO_USE_SQLITE=true
DJANGO_SECURE_COOKIES=false
AR_MIN_ENGAGED_SECONDS=20
```

## Tests

```bash
uv run python manage.py test
```

## API Endpoints

| Path | Description |
|---|---|
| `/api/auth/register` | User registration |
| `/api/auth/login` | Session login |
| `/api/auth/logout` | Session logout |
| `/api/auth/csrf` | Get CSRF token |
| `/api/me` | Current user profile |
| `/api/categories/` | Product categories |
| `/api/collections/` | Product collections |
| `/api/products/` | Products (CRUD) |
| `/api/cart/` | Shopping cart |
| `/api/orders/` | Orders |
| `/api/promotions/` | Promotions |
| `/api/events/` | Analytics events |
| `/api/recommendations/` | User recommendations |
| `/admin/` | Django admin |

## Recommendation System

Uses a hybrid real-time + daily rebuild approach:

- **Real-time:** Every analytics event instantly updates recommendation scores via `update_recommendation_from_event()`
- **Daily cron (3 AM UTC):** Recalculates time-decay and tag-similarity scores for users with new activity

```bash
# Rebuild only dirty users (default)
python manage.py rebuild_recommendations

# Full rebuild
python manage.py rebuild_recommendations --full
```

## Deployment

See [deploy_backend.md](deploy_backend.md) for the full production deployment guide (HTTPS on goldenaura.tech).

