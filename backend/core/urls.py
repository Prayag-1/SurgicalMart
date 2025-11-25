from django.urls import path
from .views import api_overview

urlpatterns = [
    path("test/", api_overview),
]
