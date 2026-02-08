# Golden Aura Showroom

Jewelry e-commerce site with AR try-on. React + Vite frontend, Django backend.

## Prerequisites

- Node.js
- Python 3.12+ with [uv](https://docs.astral.sh/uv/)

## Frontend

```sh
npm install
npm run dev
```

Create a `.env` file in the project root:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Backend

```sh
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

If Postgres is unavailable (e.g. for Codespaces), prefix commands with `DJANGO_USE_SQLITE=true`.

## Tests

```sh
# frontend
npm run test

# backend
cd backend && uv run python manage.py test
```
```