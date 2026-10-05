# Benchmark: Go/Gin vs Python/FastAPI

A small benchmark that runs the same two CPU/IO-bound tests on two backends and
compares the results in a React UI.

| Service    | Stack                | Port (host)            |
| ---------- | -------------------- | ---------------------- |
| `go`       | Go + Gin             | `127.0.0.1:8081`       |
| `fastapi`  | Python 3.12 + FastAPI (single uvicorn worker) | `127.0.0.1:8080` |
| `frontend` | React + TypeScript + Vite, served by nginx    | `3000` (`FRONTEND_PORT`) |

The frontend talks to the backends through nginx (`/go/…` and `/python/…`), so no CORS setup is needed.

## Project structure

```
benchmark/
├── docker-compose.yml        # local stack (plain HTTP)
├── docker-compose.prod.yml   # production override (HTTPS, Let's Encrypt)
├── .env                      # Compose settings (sequential builds, ports)
├── gin/                      # Go / Gin backend
├── fastapi/                  # Python / FastAPI backend
└── frontend/                 # React UI + nginx configs
```

## Endpoints

Both backends expose the same API:

| Test             | Endpoint               | `n` range                |
| ---------------- | ---------------------- | ------------------------ |
| Math calculation | `GET /api/math?n=`     | 1,000 – 1,000,000,000    |
| Data generation  | `GET /api/generate?n=` | 1,000 – 1,000,000        |

- **math** – loops `n` times doing integer arithmetic (plus a random number in the Python version) and returns the result and execution time.
- **generate** – builds `n` random user records and writes them to `generated_data/users_<n>.json`.

Both return JSON including `execution_time_ms`. Out-of-range values are rejected with a 400/422 error. Ranges and backend URLs for the UI live in `frontend/src/config.ts`.

> Large `n` values can take minutes on Python. nginx is configured with 1-hour proxy timeouts for this reason.

## Run with Docker

```bash
docker compose up -d --build
```

Then open <http://localhost:3000>.

Direct backend access (for `curl`):

```bash
curl "http://localhost:8081/api/math?n=1000000"   # Go
curl "http://localhost:8080/api/math?n=1000000"   # FastAPI
```

### Sequential builds

Images are built **one at a time** in the order `go → fastapi → frontend`, not in parallel. This is controlled by:

- `depends_on` in `docker-compose.yml` (defines the order), and
- `COMPOSE_PARALLEL_LIMIT=1` and `COMPOSE_BAKE=false` in `.env`.

If your Compose version ignores the `.env` values, set them in the shell instead:

```bash
COMPOSE_PARALLEL_LIMIT=1 COMPOSE_BAKE=false docker compose up -d --build
```

or build explicitly:

```bash
docker compose build go && docker compose build fastapi && docker compose build frontend
docker compose up -d
```

### Production (HTTPS)

Uses Let's Encrypt certificates from the host and publishes ports 80/443. Requires Docker Compose v2.24+.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The prod override mounts `/etc/letsencrypt` and `/var/www/certbot` and builds the frontend with `nginx.prod.conf`. Backend ports are not exposed on the host.

## Run locally (without Docker)

```bash
# Go / Gin on :8081
cd gin && go run main.go

# Python / FastAPI on :8080
cd fastapi
pip install -r requirements.txt
uvicorn main:app --port 8080

# Frontend on :3000 (Vite proxies /go -> :8081 and /python -> :8080)
cd frontend
yarn install && yarn dev
```

Requirements: Go 1.26+, Python 3.12+, Node 22+.

## Notes

- The benchmark is only meaningful when both backends run under similar conditions; FastAPI intentionally runs with a single worker.
- Generated files are stored in the `go_data` and `fastapi_data` Docker volumes.
