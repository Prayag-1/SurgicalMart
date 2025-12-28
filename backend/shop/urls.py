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
)
# -------------------------------
# CUSTOMER ROUTES
# -------------------------------
urlpatterns = [
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
]
