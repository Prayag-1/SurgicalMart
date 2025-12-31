from django.db import models
from django.db.models import Index
from django.db.models.functions import Lower
from django.contrib.auth import get_user_model

User = get_user_model()


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey("self", null=True, blank=True, related_name="children", on_delete=models.CASCADE)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.TextField(blank=True)
    seo_keywords = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        indexes = [
            Index(fields=["slug"]),
            Index(fields=["parent"]),
        ]
        constraints = [
            models.UniqueConstraint(Lower("slug"), name="category_slug_ci_unique"),
        ]

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.TextField(blank=True)
    seo_keywords = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=["slug"]),
        ]
        constraints = [
            models.UniqueConstraint(Lower("slug"), name="brand_slug_ci_unique"),
        ]

    def __str__(self):
        return self.name


class AdminSetting(models.Model):
    site_name = models.CharField(max_length=150, default="Surgical Mart")
    default_meta_title = models.CharField(max_length=255, blank=True)
    default_meta_description = models.TextField(blank=True)
    default_meta_keywords = models.CharField(max_length=255, blank=True)
    default_og_image = models.ImageField(upload_to="settings/", null=True, blank=True)
    notify_admin_email = models.BooleanField(default=True)
    notify_admin_whatsapp = models.BooleanField(default=False)
    notify_customer_email = models.BooleanField(default=True)
    notify_customer_whatsapp = models.BooleanField(default=False)
    admin_notification_email = models.EmailField(blank=True)
    admin_notification_phone = models.CharField(max_length=30, blank=True)
    whatsapp_api_url = models.URLField(blank=True)
    whatsapp_api_token = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.site_name


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=100, unique=True)
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.TextField(blank=True)
    seo_keywords = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            Index(fields=["is_active"]),
            Index(fields=["stock"]),
            Index(fields=["category"]),
            Index(fields=["created_at"]),
        ]


class BulkInquiry(models.Model):
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inquiries")
    quantity = models.PositiveIntegerField()
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inquiry for {self.product.name} by {self.name}"


class Order(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_CONFIRMED = "CONFIRMED"
    STATUS_PACKED = "PACKED"
    STATUS_SHIPPED = "SHIPPED"
    STATUS_DELIVERED = "DELIVERED"
    STATUS_CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_PACKED, "Packed"),
        (STATUS_SHIPPED, "Shipped"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()

    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )

    invoice_pdf = models.FileField(upload_to="invoices/", blank=True, null=True)

    stock_adjusted = models.BooleanField(default=False)
    admin_note = models.TextField(blank=True)

    PAYMENT_METHOD_COD = "COD"
    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_METHOD_COD, "Cash on Delivery"),
    ]

    PAYMENT_STATUS_PENDING = "pending"
    PAYMENT_STATUS_CONFIRMED = "confirmed"
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, "Pending"),
        (PAYMENT_STATUS_CONFIRMED, "Confirmed"),
    ]

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default=PAYMENT_METHOD_COD,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_STATUS_PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name}"

    class Meta:
        indexes = [
            Index(fields=["status"]),
            Index(fields=["created_at"]),
            Index(fields=["payment_status"]),
        ]


class OrderStatusLog(models.Model):
    order = models.ForeignKey(Order, related_name="status_logs", on_delete=models.CASCADE)
    previous_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class OrderStatusAuditLog(models.Model):
    order = models.ForeignKey(Order, related_name="status_audits", on_delete=models.CASCADE)
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="order_status_audits")
    actor_email_snapshot = models.EmailField(blank=True)
    from_status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    to_status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    reason = models.TextField(blank=True)
    meta = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            Index(fields=["order", "created_at"]),
            Index(fields=["from_status"]),
            Index(fields=["to_status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=~models.Q(from_status=models.F("to_status")),
                name="order_status_audit_transition_change",
            )
        ]


class OrderAdminNote(models.Model):
    order = models.ForeignKey(Order, related_name="admin_notes", on_delete=models.CASCADE)
    author = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="order_admin_notes")
    author_email_snapshot = models.EmailField(blank=True)
    note = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            Index(fields=["order", "created_at"]),
            Index(fields=["order", "is_pinned", "created_at"]),
        ]

    def __str__(self):
        return f"Note for Order #{self.order_id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"
