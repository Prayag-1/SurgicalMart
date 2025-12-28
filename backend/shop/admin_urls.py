from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_admin import (
    AdminOrderViewSet,
    AdminProductViewSet,
    AdminDashboardView,
)

router = DefaultRouter()
router.register(r"orders", AdminOrderViewSet, basename="admin-orders")
router.register(r"products", AdminProductViewSet, basename="admin-products")

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]

urlpatterns += router.urls
