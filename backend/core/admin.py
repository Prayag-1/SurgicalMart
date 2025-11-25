from django.contrib import admin
from django.utils.html import format_html
from .models import Brand


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "brand_logo", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "slug", "description")
    readonly_fields = ("brand_logo",)
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)

    def brand_logo(self, obj):
        """Display thumbnail in admin."""
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: contain;" />',
                obj.image.url
            )
        return "No Image"

    brand_logo.short_description = "Logo Preview"
