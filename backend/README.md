## Setup

```sh
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

If Postgres is unavailable, prefix commands with `DJANGO_USE_SQLITE=true`.

For CSRF/secure cookie issues in development, also add `DJANGO_SECURE_COOKIES=false`.

## Tests

```sh
uv run python manage.py test
```

