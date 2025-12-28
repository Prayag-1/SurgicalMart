from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from shop.auth_views import AdminTokenObtainPairView

urlpatterns = [
    # Django admin (superuser/system-level)
    path('admin/', admin.site.urls),
    # Public store APIs (no auth)
    path('api/core/', include('core.urls')),
    path('api/shop/', include('shop.urls')),
    # Admin order management (JWT staff-only)
    path('api/admin/', include('shop.admin_urls')),
    # Admin-only authentication (JWT)
    path("api/auth/login/", AdminTokenObtainPairView.as_view(), name="admin_login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="admin_refresh"),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

