from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_admin import (
    AdminOrderViewSet,
    AdminProductViewSet,
    AdminDashboardView,
    CategoryAdminViewSet,
    BrandAdminViewSet,
)

router = DefaultRouter()
router.register(r"orders", AdminOrderViewSet, basename="admin-orders")
router.register(r"products", AdminProductViewSet, basename="admin-products")
router.register(r"categories", CategoryAdminViewSet, basename="admin-categories")
router.register(r"brands", BrandAdminViewSet, basename="admin-brands")

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]

urlpatterns += router.urls
