import json
import redis
from django.conf import settings

# Shared Redis client — same connection settings as FastAPI
_client: redis.Redis | None = None

def get_redis() -> redis.Redis | None:
    """Returns a Redis client, or None if Redis is unavailable."""
    global _client
    if _client is None:
        try:
            _client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            _client.ping()
        except redis.ConnectionError:
            print("⚠️  Redis unavailable — caching disabled.")
            _client = None
    return _client


def cache_get(key: str) -> list | None:
    r = get_redis()
    if not r:
        return None
    try:
        data = r.get(key)
        return json.loads(data) if data else None
    except (redis.RedisError, json.JSONDecodeError):
        return None


def cache_set(key: str, value: list) -> None:
    r = get_redis()
    if not r:
        return
    try:
        r.setex(key, settings.REDIS_CACHE_TTL, json.dumps(value))
    except redis.RedisError as e:
        print(f"Cache write error: {e}")


def cache_invalidate_users() -> None:
    """Delete all user-list cache keys — called after POST."""
    r = get_redis()
    if not r:
        return
    try:
        for key in r.scan_iter(match="backend:users:limit:*"):
            r.delete(key)
    except redis.RedisError as e:
        print(f"Cache invalidation error: {e}")