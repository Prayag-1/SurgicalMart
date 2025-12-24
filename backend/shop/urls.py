from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Customer-facing views
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    BulkInquiryCreateView,
    CartDetailView,
    CartAddView,
    CartUpdateView,
    CartRemoveView,
    CartClearView,
    CheckoutView,
    OrderListView,
)

# Admin views
from .views_admin import AdminOrderViewSet, AdminProductViewSet
from .auth_views import RegisterView


# -------------------------------
# ADMIN ROUTER
# -------------------------------
router = DefaultRouter()

router.register("admin/orders", AdminOrderViewSet, basename="admin-orders")
router.register("admin/products", AdminProductViewSet, basename="admin-products")



# -------------------------------
# CUSTOMER ROUTES
# -------------------------------
urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),

    path("bulk-inquiry/", BulkInquiryCreateView.as_view(), name="bulk-inquiry"),

    path("cart/", CartDetailView.as_view(), name="cart-detail"),
    path("cart/add/", CartAddView.as_view(), name="cart-add"),
    path("cart/update/", CartUpdateView.as_view(), name="cart-update"),
    path("cart/remove/", CartRemoveView.as_view(), name="cart-remove"),
    path("cart/clear/", CartClearView.as_view(), name="cart-clear"),

    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", OrderListView.as_view(), name="order-list"),
]


# -------------------------------
# ADMIN ROUTES via router
# -------------------------------
urlpatterns += router.urls
