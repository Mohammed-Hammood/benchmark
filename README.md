
# 🚀 Data Fetching & Caching Performance Test Suite

This project is designed to benchmark and compare the performance of data retrieval across two Python backends (**Django** and **FastAPI**) and a **React frontend**, under varying dataset sizes (`1k`, `10k`, `100k` records) and caching configurations (**with Redis** vs **without Redis**).

Ideal for evaluating:
- Backend response times under load
- Impact of caching on latency and throughput
- Frontend rendering performance with large datasets
- Scalability trade-offs between Django ORM and FastAPI + async

---

## 📁 Project Structure

```
.
├── django-backend/          # Django REST API (sync)
│   ├── app/                 # Django app logic
│   ├── myenv/               # Virtual environment
│   ├── Dockerfile
│   └── requirements.txt
│
├── fastapi-backend/         # FastAPI async API
│   ├── app/                 # FastAPI routes & models
│   ├── env/                 # Virtual environment
│   ├── docker-compose.yml   # Includes Redis service
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                # React + Vite frontend
│   ├── src/                 # React components & services
│   ├── public/
│   ├── node_modules/
│   ├── Dockerfile
│   ├── nginx.conf           # For production serving
│   ├── package.json
│   ├── vite.config.ts
│   └── ...                  # Config files
│
├── docker-compose.yml       # Root compose (orchestrates all services)
├── .env                     # Environment variables (Redis URL, DB, etc.)
└── README.md                # This file
```

---

## 🧪 Testing Scenarios

Each backend exposes endpoints that return paginated or bulk JSON data. The frontend fetches this data and renders it in a table/list UI while measuring:

| Scenario             | Dataset Size | Caching       | Measured Metrics                     |
|----------------------|--------------|---------------|--------------------------------------|
| Baseline (no cache)  | 1k           | ❌ No Redis    | Time to first byte, render time      |
| Cached               | 1k           | ✅ With Redis  | Cache hit rate, reduced latency      |
| Medium Load          | 10k          | ❌ / ✅        | Memory usage, GC pauses, FPS drop    |
| Heavy Load           | 100k         | ❌ / ✅        | Timeout risks, browser crash threshold |

> 💡 All tests are run via automated scripts or manual triggers from the frontend UI.

---

## ⚙️ Setup Instructions

### Prerequisites

- Docker & Docker Compose installed
- Node.js ≥ 18 (for local frontend dev)
- Python ≥ 3.11 (for local backend dev)

---

### Option 1: Run Everything with Docker Compose (Recommended)

From root directory:

```bash
docker-compose up --build
```

Services will be available at:

- **Frontend**: http://localhost:3000
- **Django Backend**: http://localhost:8000
- **FastAPI Backend**: http://localhost:8001
- **Redis Inspector (optional)**: Use `redis-cli` inside container or connect via GUI tool like Another Redis Desktop Manager

> 🔐 Default `.env` includes Redis URL: `redis://redis:6379`

---

### Option 2: Local Development

#### Django Backend

```bash
cd django-backend
source myenv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

#### FastAPI Backend

```bash
cd fastapi-backend
source env/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

> Make sure Redis is running locally if testing with cache:  
> ```bash
> docker run -p 6379:6379 redis
> ```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Update `.env.local` or `vite.config.ts` to point to correct backend URLs during local dev.

---

## 📊 How to Run Tests

### Via Frontend UI (Interactive)

Navigate to http://localhost:3000 → You’ll see:

- Dropdowns to select:
  - Backend: `Django` or `FastAPI`
  - Dataset size: `1k`, `10k`, `100k`
  - Caching: `Enabled` / `Disabled`
- Button: “Fetch & Render”
- Real-time metrics displayed:
  - Request duration (ms)
  - Render time (ms)
  - DOM nodes created
  - Memory delta (if supported by browser DevTools)

> 📈 Optional: Enable Chrome DevTools Performance tab to record frame drops and memory leaks.

---

### Via CLI Scripts (Automated Benchmarking)

We include simple curl-based benchmarks:

```bash
# Example: Fetch 10k items from FastAPI without cache
curl -w "\nTime: %{time_total}s\n" http://localhost:8001/api/data?limit=10000&cache=false

# With cache
curl -w "\nTime: %{time_total}s\n" http://localhost:8001/api/data?limit=10000&cache=true
```

For more advanced automation, use [`hey`](https://github.com/rakyll/hey) or [`wrk`](https://github.com/wg/wrk):

```bash
hey -n 100 -c 10 "http://localhost:8001/api/data?limit=10000&cache=true"
```

---

## 🗃️ Caching Strategy

Both backends implement optional Redis caching using key-value storage:

- Key format: `data:{backend}:{limit}:{page}`
- TTL: 5 minutes (configurable via env var `CACHE_TTL_SECONDS`)
- Cache invalidation: Manual trigger via `/invalidate-cache` endpoint (dev only)

Example FastAPI route snippet:

```python
@app.get("/api/data")
async def get_data(limit: int = 1000, cache: bool = True):
    cache_key = f"data:fastapi:{limit}"
    if cache:
        cached = await redis.get(cache_key)
        if cached:
            return json.loads(cached)

    data = generate_mock_data(limit)  # Simulate DB query
    if cache:
        await redis.setex(cache_key, CACHE_TTL, json.dumps(data))
    return data
```

Django uses similar pattern with `django-redis`.

---

## 📈 Expected Results Summary (Approximate)

| Backend     | Limit  | No Cache (ms) | With Redis (ms) | Improvement |
|-------------|--------|---------------|------------------|-----------|
| Django      | 1k     | ~120          | ~40              | 67% faster |
| Django      | 10k    | ~900          | ~50              | 94% faster |
| Django      | 100k   | ~8500         | ~60              | 99% faster |
| FastAPI     | 1k     | ~30           | ~15              | 50% faster |
| FastAPI     | 10k    | ~200          | ~20              | 90% faster |
| FastAPI     | 100k   | ~2000         | ~25              | 98% faster |

> ⚠️ These numbers vary based on hardware, network, and system load. Always test in your environment.

---

## 🛑 Known Limitations

- Mock data generation may not reflect real-world database I/O.
- Frontend rendering becomes sluggish beyond 50k rows without virtualization.
- Redis caching does not handle pagination state unless explicitly coded.
- No authentication or rate limiting implemented (for simplicity).

---

## 🔄 Future Enhancements

- Add WebSocket streaming for incremental loading
- Implement client-side pagination + infinite scroll
- Integrate Prometheus/Grafana for monitoring
- Add LRU eviction policy for Redis
- Support PostgreSQL instead of mock data
- Add CI/CD pipeline with performance regression checks

---

## 🤝 Contributing

Pull requests welcome! Please follow these steps:

1. Fork repo
2. Create feature branch: `git checkout -b feat/add-virtual-scroll`
3. Commit changes: `git commit -m 'Add virtualized list for 100k items'`
4. Push: `git push origin feat/add-virtual-scroll`
5. Open PR

Include before/after screenshots and benchmark results when possible.

---

## 📄 License

MIT © 2026 Your Name / Organization

---

## 🆘 Troubleshooting

### ❗ “KVM not enabled” error when starting Docker Desktop?

See [Fix KVM on Ubuntu 24](https://docs.docker.com/desktop/install/linux-install/#kvm-virtualization-support)

### ❗ Redis connection refused?

Ensure Redis service is running:

```bash
docker ps | grep redis
# If not running:
docker-compose up redis
```

Check `.env` has correct Redis URL:

```env
REDIS_URL=redis://redis:6379
```

### ❗ Frontend can’t reach backend?

Check CORS settings in both backends. In development, allow `http://localhost:3000`.

In FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

In Django (`settings.py`):

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

Install `django-cors-headers`.

---
