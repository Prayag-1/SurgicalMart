from django.contrib import admin
from .models import Category, Product, BulkInquiry, Order, OrderItem


# -----------------------------
# CATEGORY ADMIN
# -----------------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


# -----------------------------
# PRODUCT ADMIN
# -----------------------------
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "is_active", "is_featured", "created_at")
    list_filter = ("category", "is_active", "is_featured")
    search_fields = ("name", "sku", "description")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("price", "is_active", "is_featured")
    ordering = ("-created_at",)


# -----------------------------
# BULK INQUIRY ADMIN
# -----------------------------
@admin.register(BulkInquiry)
class BulkInquiryAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created_at")
    search_fields = ("name", "email")
    ordering = ("-created_at",)


# -----------------------------
# ORDER ITEMS INLINE
# -----------------------------
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "price", "quantity", "subtotal")


# -----------------------------
# ORDER ADMIN
# -----------------------------
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "phone", "total_amount", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("full_name", "email", "phone")
    ordering = ("-created_at",)

    list_editable = ("status",)
    inlines = [OrderItemInline]
