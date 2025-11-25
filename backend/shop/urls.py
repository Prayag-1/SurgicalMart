from django.urls import path
from .views import CategoryListView, ProductListView, ProductDetailView
from .views import CategoryListView, ProductListView, ProductDetailView, BulkInquiryCreateView
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
from .views import OrderListView


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
    path("orders/", OrderListView.as_view(), name="order-list"),
    path("bulk-inquiry/", BulkInquiryCreateView.as_view(), name="bulk-inquiry"),


]




from django.urls import path
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
)
