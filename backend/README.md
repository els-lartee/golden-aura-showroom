# Golden Aura Backend

## Setup

- Create env: `uv venv`
- Install deps: `uv sync`

## Run

- `uv run python manage.py migrate`
- `uv run python manage.py createsuperuser`
- `uv run python manage.py runserver`

### If Postgres connection is refused

Codespaces typically doesn’t run Postgres by default. Use SQLite for local dev:

- `DJANGO_USE_SQLITE=true uv run python manage.py migrate`
- `DJANGO_USE_SQLITE=true uv run python manage.py runserver`
### For Codespaces/HTTPS environments (with frontend on different domain)

Required for SameSite=None cookies:

- `DJANGO_USE_SQLITE=true DJANGO_SECURE_COOKIES=true uv run python manage.py runserver`
## Tests

- `uv run python manage.py test`

## Recommendations (Batch)

- `uv run python manage.py rebuild_recommendations`

### Schedule (dev)

- `uv run python manage.py crontab add`
- `uv run python manage.py crontab show`
- `uv run python manage.py crontab remove`
