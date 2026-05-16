import os
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

# Local imports
from .database import get_db, Base, engine
from .crud import get_users, create_user
from .schemas import User, UserCreate

# Redis imports
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError, RedisError
from fastapi.responses import JSONResponse

from .populate import populate_users
# -----------------------------------------------------------------------------
# 1. Configuration & Redis Client Setup
# -----------------------------------------------------------------------------

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# decode_responses=True ensures we get str instead of bytes from Redis
redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)


# -----------------------------------------------------------------------------
# 2. Application Lifecycle (Startup/Shutdown)
# -----------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events.
    - Creates DB tables
    - Verifies Redis connection
    - Closes Redis connection on shutdown
    """
    # --- Startup ---
    print("Starting up application...")
    
    # Create DB Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created/verified.")

    
    async with AsyncSession(engine) as session:
        existing = await get_users(session, limit=1)
        if not existing:
            print("Database is empty — seeding 101,000 users...")
            await populate_users(session, 150_000)
            print("✅ Seeding complete.")
    # Check Redis Connection
    try:
        await redis_client.ping()
        print("✅ Connected to Redis successfully.")
    except ConnectionError:
        print("⚠️ WARNING: Could not connect to Redis. Caching will be disabled.")

    yield  # Application runs here

    # --- Shutdown ---
    print("Shutting down application...")
    await redis_client.close()
    print("Redis connection closed.")


app = FastAPI(
    title="FastAPI Backend - Performance Test",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://example.com",
        ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=['*'],
    expose_headers=['X-Cache-Hit']
)
# -----------------------------------------------------------------------------
# 3. API Endpoints
# -----------------------------------------------------------------------------


@app.get("/api/users")
async def read_users(
    limit: int = Query(100, ge=1, le=100000),
    cache: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"backend:users:limit:{limit}"

    # ── 1. Try cache ──────────────────────────────────────────────────────────
    if cache:
        try:
            cached_data = await redis_client.get(cache_key)
            if cached_data:
                return JSONResponse(
                    content=json.loads(cached_data),
                    headers={"X-Cache-Hit": "true"},   # benchmark can read this
                )
        except (RedisError, json.JSONDecodeError, TypeError) as e:
            print(f"Cache read error: {e}")

    # ── 2. Fetch from DB ──────────────────────────────────────────────────────
    users = await get_users(db, limit=limit)
    if not users:
        return JSONResponse(content=[], headers={"X-Cache-Hit": "false"})

    # ── 3. Serialize ──────────────────────────────────────────────────────────
    try:
        # user_dicts = [User.model_validate(u).model_dump(mode='json') for u in users]
        
        user_dicts = [
            {
                k: (v.isoformat() if hasattr(v, 'isoformat') else v)
                for k, v in u.__dict__.items()
                if k != '_sa_instance_state'
            }
            for u in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Serialization error: {str(e)}")

    # ── 4. Write to cache ─────────────────────────────────────────────────────
    if cache:
        try:
            await redis_client.setex(cache_key, 3000, json.dumps(user_dicts))
        except RedisError as e:
            print(f"Cache write error: {e}")

    return JSONResponse(
        content=user_dicts,
        headers={"X-Cache-Hit": "false"},
    )
    
@app.post("/api/users", response_model=User)
async def add_user(
    user: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user and invalidate relevant caches.
    """
    new_user = await create_user(db, user)
    # await populate_users(db, 100000)
    
    # --- Cache Invalidation ---
    # Invalidate all 'users list' caches to ensure consistency
    if new_user:
        try:
            # Use scan_iter instead of keys() to avoid blocking Redis in production
            async for key in redis_client.scan_iter(match="backend:users:limit:*"):
                await redis_client.delete(key)
        except RedisError as e:
            print(f"Cache invalidation error: {e}")
        
    return new_user