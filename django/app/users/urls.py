from django.urls import path
from .views import UserListView

urlpatterns = [
    path("users", UserListView.as_view()),   # GET /api/users  POST /api/users
]