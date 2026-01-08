from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_admin import (
    AdminOrderViewSet,
    AdminProductViewSet,
    AdminDashboardView,
    CategoryAdminViewSet,
    BrandAdminViewSet,
    AdminSettingView,
    HomepageSettingsView,
    HeroSlideViewSet,
)

router = DefaultRouter()
router.register(r"orders", AdminOrderViewSet, basename="admin-orders")
router.register(r"products", AdminProductViewSet, basename="admin-products")
router.register(r"categories", CategoryAdminViewSet, basename="admin-categories")
router.register(r"brands", BrandAdminViewSet, basename="admin-brands")
router.register(r"settings/slides", HeroSlideViewSet, basename="admin-hero-slides")

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("settings/", AdminSettingView.as_view(), name="admin-settings"),
    path("settings/homepage/", HomepageSettingsView.as_view(), name="admin-homepage-settings"),
]

urlpatterns += router.urls
