from rest_framework import serializers
from .models import (
    Category,
    Product,
    BulkInquiry,
    Order,
    OrderItem,
    OrderStatusAuditLog,
    OrderAdminNote,
    Brand,
    AdminSetting,
)


# --------------------------
# CATEGORY SERIALIZER
# --------------------------
class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = "__all__"


class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "parent",
            "seo_title",
            "seo_description",
            "seo_keywords",
        ]

    def validate_slug(self, value):
        qs = Category.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(slug__iexact=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value

    def validate_parent(self, value):
        if value and self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError("Parent cannot be self.")
        return value


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = "__all__"


class BrandWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "seo_title",
            "seo_description",
            "seo_keywords",
        ]

    def validate_slug(self, value):
        qs = Brand.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(slug__iexact=value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return value


class AdminSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminSetting
        fields = [
            "id",
            "site_name",
            "default_meta_title",
            "default_meta_description",
            "default_meta_keywords",
            "default_og_image",
            "notify_admin_email",
            "notify_admin_whatsapp",
            "notify_customer_email",
            "notify_customer_whatsapp",
            "admin_notification_email",
            "admin_notification_phone",
            "whatsapp_api_url",
            "whatsapp_api_token",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]

    def validate_logo(self, value):
        if value:
            content_type = getattr(value, "content_type", "")
            if content_type and not content_type.startswith("image/"):
                raise serializers.ValidationError("Logo must be an image.")
            size = getattr(value, "size", 0)
            if size and size > 2 * 1024 * 1024:
                raise serializers.ValidationError("Logo must be smaller than 2MB.")
        return value


# --------------------------
# PRODUCT SERIALIZER (READ)
# --------------------------
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"

    def get_brand(self, obj):
        if obj.brand:
            return {"id": obj.brand.id, "name": obj.brand.name, "slug": obj.brand.slug}
        return None


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
            "brand",
            "short_description",
            "description",
            "price",
            "sku",
            "stock",
            "image",
            "is_featured",
            "is_active",
            "seo_title",
            "seo_description",
            "seo_keywords",
        ]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be greater than or equal to 0.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock must be greater than or equal to 0.")
        return value


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
            "payment_method",
            "payment_status",
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
# ADMIN ORDER SERIALIZER
# --------------------------
class AdminOrderSerializer(OrderSerializer):
    status_logs = serializers.SerializerMethodField()

    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ["admin_note", "status_logs"]

    def get_status_logs(self, obj):
        audits = obj.status_audits.all()
        return OrderStatusAuditLogSerializer(audits, many=True).data


class OrderStatusAuditLogSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusAuditLog
        fields = [
            "id",
            "from_status",
            "to_status",
            "actor",
            "actor_email",
            "reason",
            "meta",
            "created_at",
        ]

    def get_actor(self, obj):
        if obj.actor:
            return {
                "id": obj.actor.id,
                "username": obj.actor.get_username(),
                "email": obj.actor.email,
            }
        return None

    def get_actor_email(self, obj):
        if obj.actor_email_snapshot:
            return obj.actor_email_snapshot
        if obj.actor:
            return obj.actor.email
        return None


class OrderAdminNoteSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()

    class Meta:
        model = OrderAdminNote
        fields = [
            "id",
            "note",
            "is_pinned",
            "author",
            "author_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "author",
            "author_email",
            "created_at",
            "updated_at",
        ]

    def get_author(self, obj):
        if obj.author:
            return {
                "id": obj.author.id,
                "username": obj.author.get_username(),
                "email": obj.author.email,
            }
        return None

    def get_author_email(self, obj):
        if obj.author_email_snapshot:
            return obj.author_email_snapshot
        if obj.author:
            return obj.author.email
        return None

    def create(self, validated_data):
        order = self.context["order"]
        author = self.context.get("author")

        validated_data["order"] = order

        if author and getattr(author, "is_authenticated", False):
            validated_data["author"] = author
            validated_data["author_email_snapshot"] = author.email or ""
        else:
            validated_data["author_email_snapshot"] = ""

        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("order", None)
        validated_data.pop("author", None)
        validated_data.pop("author_email_snapshot", None)
        return super().update(instance, validated_data)
