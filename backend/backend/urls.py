from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/core/', include('core.urls')),
    path('api/shop/', include('shop.urls')),
    path("api/admin/login/", TokenObtainPairView.as_view(), name="admin_login"),
    path("api/admin/refresh/", TokenRefreshView.as_view(), name="admin_refresh"),
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

