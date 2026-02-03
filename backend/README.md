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

## Tests

- `uv run python manage.py test`
