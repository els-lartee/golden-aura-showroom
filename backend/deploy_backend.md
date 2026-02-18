# Backend Deployment Guide

## Server Stack

- **OS:** Ubuntu (DigitalOcean Droplet)
- **Domain:** goldenaura.tech
- **App Server:** Gunicorn (bound to Unix socket `/run/gunicorn.sock`)
- **Reverse Proxy:** Nginx (listening on port 443, HTTPS)
- **Framework:** Django + Django REST Framework
- **Database:** PostgreSQL

---

## Directory Layout

```
/var/www/golden-aura/
├── static/          # Django static files (collectstatic output)
├── assets/          # User-uploaded media (images, GLB models)
└── frontend/        # Built React SPA
```

Source code lives at `/root/golden-aura-showroom/backend/`.

---

## Environment Variables

Located at `/root/golden-aura-showroom/backend/golden_aura/.env`:

| Variable | Description | Example |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DJANGO_DEBUG` | Debug mode | `false` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed hosts | `goldenaura.tech,www.goldenaura.tech,localhost` |
| `DJANGO_SECURE_COOKIES` | Set `true` when using HTTPS | `false` |
| `DJANGO_USE_SQLITE` | Use SQLite instead of Postgres | `false` |
| `DJANGO_DB_ENGINE` | Database engine | `django.db.backends.postgresql_psycopg2` |
| `POSTGRES_DB` | Database name | `golden_aura` |
| `POSTGRES_USER` | Database user | `elsie` |
| `POSTGRES_PASSWORD` | Database password | `password` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port (empty = default 5432) | `` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `https://goldenaura.tech` |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated CSRF origins | `https://goldenaura.tech` |
| `AR_MIN_ENGAGED_SECONDS` | Minimum AR session duration (seconds) to score recommendations | `20` |

---

## Gunicorn Service

`/etc/systemd/system/gunicorn.service`:

```ini
[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

[Service]
User=root
Group=www-data
WorkingDirectory=/root/golden-aura-showroom/backend
ExecStart=/root/golden-aura-showroom/backend/.venv/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind unix:/run/gunicorn.sock \
          golden_aura.wsgi:application

[Install]
WantedBy=multi-user.target
```

---

## Nginx Config

`/etc/nginx/sites-available/default`:

```nginx
server {
    server_name goldenaura.tech www.goldenaura.tech;

    client_max_body_size 50M;

    # Django static files (admin, DRF, etc.)
    location /static/ {
        alias /var/www/golden-aura/static/;
    }

    # Django media / uploads
    location /assets/ {
        alias /var/www/golden-aura/assets/;
    }

    # API → gunicorn
    location /api/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin → gunicorn
    location /admin/ {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (React SPA) — serve index.html for all other routes
    location / {
        root /var/www/golden-aura/frontend;
        try_files $uri $uri/ /index.html;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/goldenaura.tech/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/goldenaura.tech/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = www.goldenaura.tech) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = goldenaura.tech) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name goldenaura.tech www.goldenaura.tech;
    return 404; # managed by Certbot
}
```

Key settings:
- `client_max_body_size 50M` — allows image/GLB uploads up to 50MB
- `/api/` and `/admin/` proxy to gunicorn via Unix socket
- `/static/` and `/assets/` served directly by nginx
- All other routes fall through to the React SPA (`try_files`)

---

## Deployment Steps

### Initial setup

```bash
cd /root/golden-aura-showroom/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # or: uv sync

# Create directories
sudo mkdir -p /var/www/golden-aura/{static,assets,frontend}
sudo chown -R root:www-data /var/www/golden-aura
sudo chmod -R 755 /var/www/golden-aura

# Database
python manage.py migrate
python manage.py createsuperuser

# Static files
python manage.py collectstatic --noinput
```

### Deploying updates

```bash
cd /root/golden-aura-showroom/backend
source .venv/bin/activate
git pull

# Apply migrations if needed
python manage.py migrate

# Recollect static files if changed
python manage.py collectstatic --noinput

# Restart gunicorn
sudo systemctl restart gunicorn

# If nginx config changed:
sudo nginx -t && sudo systemctl reload nginx
```

---

## Recommendation System

The recommendation system uses a **hybrid approach**:

### Real-time scoring
Every analytics event (view, click, favorite, add-to-cart, purchase) triggers `update_recommendation_from_event()` inline. This provides instant recommendation updates based on user actions.

### Daily rebuild (cron)
A daily cron job at **3:00 AM UTC** runs `rebuild_recommendations`, which:
- Only rebuilds users flagged as "dirty" (those with new events since last rebuild)
- Recalculates time-decay factors (older events lose weight)
- Propagates tag-similarity scores across products

```bash
# Manual rebuild (dirty users only)
python manage.py rebuild_recommendations

# Full rebuild (all users)
python manage.py rebuild_recommendations --full
```

The cron is configured in `settings.py`:
```python
CRONJOBS = [
    ("0 3 * * *", "django.core.management.call_command", ["rebuild_recommendations"]),
]
```

---

## Common Commands

```bash
# Restart gunicorn
sudo systemctl restart gunicorn

# Reload nginx (after config changes)
sudo nginx -t && sudo systemctl reload nginx

# Check gunicorn status
sudo systemctl status gunicorn

# View gunicorn logs
sudo journalctl -u gunicorn --no-pager -n 50

# View nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Django shell
cd /root/golden-aura-showroom/backend
source .venv/bin/activate
python manage.py shell
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 502 Bad Gateway | Gunicorn not running or wrong socket path | `sudo systemctl restart gunicorn` |
| 403 on static files | Permissions on `/var/www/` | `sudo chmod -R 755 /var/www/golden-aura` |
| 413 Request Entity Too Large | `client_max_body_size` too small | Increase in nginx config |
| CSRF cookie rejected | `DJANGO_SECURE_COOKIES=true` on HTTP | Set to `false` in `.env` |
| Mixed content blocked | Frontend on HTTPS, API on HTTP | Serve both from same origin or add HTTPS |
