# Frontend Deployment Guide

## Overview

The React frontend is a static SPA built with Vite and deployed alongside the Django backend on the same server. Nginx serves the built files directly — no Node.js process runs in production.

**URL:** http://159.223.27.66

---

## Architecture

```
Browser → Nginx (port 80)
            ├── /              → /var/www/golden-aura/frontend/  (React SPA)
            ├── /api/          → gunicorn (Django)
            ├── /admin/        → gunicorn (Django)
            ├── /static/       → /var/www/golden-aura/static/    (Django static)
            └── /assets/       → /var/www/golden-aura/assets/    (uploads)
```

Frontend and backend share the same origin, eliminating CORS and mixed-content issues.

---

## Build & Deploy

### Prerequisites

- Node.js (v18+)
- npm

### Quick deploy

```bash
cd /root/golden-aura-showroom
npm install
VITE_API_BASE_URL=/api npm run build
sudo rm -rf /var/www/golden-aura/frontend/*
sudo cp -r dist/* /var/www/golden-aura/frontend/
```

No nginx restart needed — files are served immediately.

### Environment variables

Vite injects env vars at **build time** (not runtime). Set them before `npm run build`:

| Variable | Description | Default | Production |
|---|---|---|---|
| `VITE_API_BASE_URL` | API base path | `/api` | `/api` |
| `VITE_BACKEND_URL` | Backend URL (dev proxy only) | `http://159.223.27.66` | N/A |

For production builds, the default `/api` is correct — requests are routed by nginx to gunicorn on the same server.

---

## Build Configuration

### Asset output directory

Vite outputs built JS/CSS chunks to `dist/_assets/` (configured via `assetsDir: "_assets"` in `vite.config.ts`). This avoids collision with the `/assets/` nginx location used for Django media uploads.

### Compression

The build produces pre-compressed `.gz` and `.br` files via `vite-plugin-compression`. Nginx can be configured to serve these with `gzip_static` and `brotli_static` modules for faster delivery.

### Code splitting

Chunks are split by `manualChunks` in `vite.config.ts`:

| Chunk | Contents |
|---|---|
| `vendor` | React, React DOM, React Router |
| `query` | TanStack Query |
| `ui` | Radix UI components |
| `three` | Three.js, React Three Fiber |
| `charts` | Recharts |

---

## Local Development

### Dev server with API proxy

```bash
npm install
npm run dev
```

The Vite dev server (port 8080) proxies `/api` and `/assets` requests to the backend. Configured in `vite.config.ts`:

```ts
proxy: {
  "/api": {
    target: process.env.VITE_BACKEND_URL || "http://159.223.27.66",
    changeOrigin: true,
  },
  "/assets": {
    target: process.env.VITE_BACKEND_URL || "http://159.223.27.66",
    changeOrigin: true,
  },
}
```

To point at a local backend instead:

```bash
VITE_BACKEND_URL=http://localhost:8000 npm run dev
```

---

## Updating the Deployed Frontend

After making code changes:

```bash
cd /root/golden-aura-showroom

# Install any new dependencies
npm install

# Build
VITE_API_BASE_URL=/api npm run build

# Deploy
sudo rm -rf /var/www/golden-aura/frontend/*
sudo cp -r dist/* /var/www/golden-aura/frontend/
```

Users may need to hard-refresh (`Ctrl+Shift+R`) to bypass cached assets — the hashed filenames in `_assets/` handle cache-busting for most cases.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| 404 on page refresh (e.g. `/catalog`) | `try_files` not configured | Ensure nginx has `try_files $uri $uri/ /index.html;` |
| 404 on `/_assets/*.js` | Old build in `/var/www/` | Redeploy: `sudo cp -r dist/* /var/www/golden-aura/frontend/` |
| API calls fail in dev | Proxy not reaching backend | Check `VITE_BACKEND_URL` and that backend is running |
| Stale content after deploy | Browser cache | Hard refresh or clear cache |
| Mixed content errors | API URL uses `http://` on HTTPS page | Use relative `/api` path (default) |
