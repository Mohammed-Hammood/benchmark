from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import User
from .serializers import UserSerializer
from .cache import cache_get, cache_set, cache_invalidate_users


class UserListView(APIView):

    def get(self, request):
        limit  = int(request.query_params.get("limit", 100))
        use_cache = request.query_params.get("cache", "true").lower() == "true"

        # Clamp limit to sane bounds
        limit = max(1, min(limit, 100_000))

        cache_key = f"backend:users:limit:{limit}"   # ✅ same key format as FastAPI
        cache_hit = False

        # ── 1. Try cache ──────────────────────────────────────────────────────
        if use_cache:
            cached = cache_get(cache_key)
            if cached is not None:
                response = Response(cached)
                response["X-Cache-Hit"] = "true"     # ✅ for benchmark frontend
                return response

        # ── 2. Query DB ───────────────────────────────────────────────────────
        users = User.objects.all()[:limit]
        serializer = UserSerializer(users, many=True)
        data = serializer.data

        # ── 3. Write to cache ─────────────────────────────────────────────────
        if use_cache:
            # Convert to plain list so json.dumps works (date → str via DRF)
            cache_set(cache_key, list(data))

        response = Response(data)
        response["X-Cache-Hit"] = "false"
        return response

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache_invalidate_users()                  # ✅ bust stale cache
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)