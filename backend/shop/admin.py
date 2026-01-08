from django.contrib import admin
from .models import Category, Product, BulkInquiry, Order, OrderItem, Brand, HeroSlide, HomepageSection


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
# BRAND ADMIN
# -----------------------------
@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "featured", "created_at")
    list_filter = ("is_active", "featured")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


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
    list_display = ("order_number", "customer_name", "phone", "total_amount", "status", "payment_status", "created_at")
    list_filter = ("status", "payment_status", "created_at")
    search_fields = ("order_number", "customer_name", "customer_email", "phone")
    ordering = ("-created_at",)

    list_editable = ("status",)
    inlines = [OrderItemInline]


# -----------------------------
# HOMEPAGE CONFIG
# -----------------------------
@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "is_active", "link_url", "created_at")
    list_editable = ("order", "is_active")
    search_fields = ("link_url",)
    ordering = ("order", "id")


@admin.register(HomepageSection)
class HomepageSectionAdmin(admin.ModelAdmin):
    filter_horizontal = ("new_arrivals", "featured_categories", "featured_brands")
