from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=100, unique=True)
    stock = models.IntegerField(default=0)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name}"


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
