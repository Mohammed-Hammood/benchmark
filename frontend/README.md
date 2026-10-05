# Benchmark: Go/Gin vs Python/FastAPI

React + TypeScript + Vite frontend that sends the same request to two backends and compares them.

## Run locally

```bash
# Go / Gin on :8081
go run main.go
# Python / FastAPI on :8080
uvicorn main:app --port 8080
# Frontend on :3000 (proxies /go -> :8081 and /python -> :8080)
npm install && npm run dev
```

## Endpoints used

| Test            | Endpoint                | `n` range                 |
| --------------- | ----------------------- | ------------------------- |
| Math calculation | `GET /api/math?n=`     | 1,000 – 1,000,000,000     |
| Data generation  | `GET /api/generate?n=` | 1,000 – 1,000,000         |

Ranges and backend URLs live in `src/config.ts`.

## Production

`nginx.conf` proxies `/go/` to `go:8081` and `/python/` to `fastapi:8080` with 1-hour timeouts.
Rename the upstream hosts to match your docker-compose service names.
