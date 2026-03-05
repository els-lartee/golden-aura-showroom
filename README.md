# Golden Aura Showroom

Jewelry e-commerce site with AR try-on. React + Vite frontend, Django backend.

## Prerequisites

- Node.js 18+
- Python 3.12+ with [uv](https://docs.astral.sh/uv/)

## Frontend

```sh
npm install
npm run dev
```

The dev server runs on port 8080 and proxies `/api` requests to the backend automatically.

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

## Deployment

Both frontend and backend are deployed to the same server (DigitalOcean droplet) behind Nginx with TLS.

- **Frontend:** [deploy_frontend.md](deploy_frontend.md)
- **Backend:** [backend/deploy_backend.md](backend/deploy_backend.md)

### Quick redeploy

```sh
# Frontend
VITE_API_BASE_URL=/api npm run build
sudo cp -r dist/* /var/www/golden-aura/frontend/

# Backend
cd backend && source .venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
```