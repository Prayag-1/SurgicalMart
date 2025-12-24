from rest_framework import serializers
from .models import (
    Category,
    Product,
    BulkInquiry,
    Order,
    OrderItem
)


# --------------------------
# CATEGORY SERIALIZER
# --------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


# --------------------------
# PRODUCT SERIALIZER (READ)
# --------------------------
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = "__all__"


# --------------------------
# PRODUCT WRITE SERIALIZER (ADMIN)
# --------------------------
class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "category",
            "short_description",
            "description",
            "price",
            "sku",
            "stock",
            "image",
            "is_featured",
            "is_active",
        ]


# --------------------------
# BULK INQUIRY SERIALIZER
# --------------------------
class BulkInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkInquiry
        fields = "__all__"
        read_only_fields = ["created_at"]


# --------------------------
# ORDER ITEM SERIALIZER
# --------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["product", "product_detail", "price", "quantity", "subtotal"]


# --------------------------
# ORDER SERIALIZER
# --------------------------
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    invoice_pdf = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "address",
            "total_amount",
            "status",
            "created_at",
            "updated_at",
            "items",
            "invoice_pdf",
        ]

    def get_invoice_pdf(self, obj):
        if not obj.invoice_pdf:
            return None

        request = self.context.get("request")
        url = obj.invoice_pdf.url

        if request:
            return request.build_absolute_uri(url)

        return url


# --------------------------
# ORDER STATUS UPDATE (ADMIN)
# --------------------------
class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
