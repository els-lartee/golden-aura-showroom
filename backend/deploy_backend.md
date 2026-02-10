# Backend Deployment Notes

## Server Stack
- **OS:** Ubuntu (DigitalOcean Droplet)
- **IP:** 159.223.27.66
- **App Server:** Gunicorn (bound to Unix socket `/run/gunicorn.sock`)
- **Reverse Proxy:** Nginx (listening on port 80)
- **Framework:** Django + Django REST Framework

---

## Issues & Fixes

### 1. STATIC_URL Set to Filesystem Path
**Error:**
```
NS_ERROR_CORRUPTED_CONTENT on all static file requests
GET http://159.223.27.66:8000/root/golden-aura-showroom/backend/golden_aura/static/rest_framework/css/bootstrap.min.css
```

**Cause:** `STATIC_URL` in `settings.py` was set using the filesystem path:
```python
STATIC_URL = f'{PROJECT_DIR}/static/'
# Resolved to: /root/golden-aura-showroom/backend/golden_aura/static/
```
The browser tried to fetch files at that literal path as a URL, which doesn't exist.

**Fix:** Changed to a proper URL path:
```python
STATIC_URL = '/static/'
```

---

### 2. CSRF Cookie Rejected on HTTP
**Error:**
```
Cookie "csrftoken" has been rejected because a non-HTTPS cookie can't be set as "secure".
```

**Cause:** `CSRF_COOKIE_SECURE` and `SESSION_COOKIE_SECURE` defaulted to `True` (via `DJANGO_SECURE_COOKIES` env var defaulting to `"true"`), but the site is served over plain HTTP.

**Fix:** Changed the default to `False` in `settings.py`:
```python
# Before
SECURE_COOKIES = os.getenv("DJANGO_SECURE_COOKIES", "true").lower() == "true"

# After
SECURE_COOKIES = os.getenv("DJANGO_SECURE_COOKIES", "false").lower() == "true"
```
Set `DJANGO_SECURE_COOKIES=true` in the environment when HTTPS is enabled.

---

### 3. Nginx Proxy Loop (502 Bad Gateway)
**Error:**
```
GET http://159.223.27.66:8000/api/ [HTTP/1.1 502 Bad Gateway]
```

**Cause:** Nginx was listening on port 8000 and proxying to `http://127.0.0.1:8000` — proxying to itself in a loop. Meanwhile, Gunicorn was bound to a Unix socket (`/run/gunicorn.sock`), not a TCP port.

**Fix:** Updated `/etc/nginx/sites-available/default`:
```nginx
# Before
listen 8000;
proxy_pass http://127.0.0.1:8000;

# After
listen 80;
proxy_pass http://unix:/run/gunicorn.sock;
```

---

### 4. Static Files 403 Forbidden (Permission Denied)
**Error:**
```
GET http://159.223.27.66/static/rest_framework/css/bootstrap.min.css [HTTP/1.1 403 Forbidden]
```

**Cause:** Static files were being served from `/root/golden-aura-showroom/backend/golden_aura/static/`. The `/root` directory has `700` permissions, so the `www-data` user (nginx) couldn't traverse the path to reach the files.

**Fix:** Moved static and media files to a proper web-accessible location:

1. Created directories:
   ```bash
   sudo mkdir -p /var/www/golden-aura/static /var/www/golden-aura/assets
   sudo chown -R root:www-data /var/www/golden-aura
   sudo chmod -R 755 /var/www/golden-aura
   ```

2. Updated `settings.py`:
   ```python
   STATIC_ROOT = '/var/www/golden-aura/static'
   MEDIA_ROOT = '/var/www/golden-aura/assets'
   ```

3. Collected static files:
   ```bash
   python manage.py collectstatic --noinput
   ```

4. Updated nginx config:
   ```nginx
   location /static/ {
       alias /var/www/golden-aura/static/;
   }

   location /assets/ {
       alias /var/www/golden-aura/assets/;
   }
   ```

---

### 5. Mixed Content Errors (Pending)
**Error:**
```
Blocked loading mixed active content "http://159.223.27.66/api/cart/current"
```

**Cause:** The frontend is served over HTTPS but makes API calls to the backend over plain HTTP. Browsers block mixed active content (HTTP requests from HTTPS pages).

**Fix:** Either:
- Set up HTTPS on the backend (e.g., with Let's Encrypt / Certbot)
- Or proxy API requests through the same HTTPS origin that serves the frontend

---

## Final Nginx Config
`/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name 159.223.27.66;

    location /static/ {
        alias /var/www/golden-aura/static/;
    }

    location /assets/ {
        alias /var/www/golden-aura/assets/;
    }

    location / {
        proxy_pass http://unix:/run/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Restart Commands
```bash
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart gunicorn
```
