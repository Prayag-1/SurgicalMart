from django.utils.text import slugify
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
    HeroSlide,
    HomepageSection,
)


# --------------------------
# CATEGORY SERIALIZER
# --------------------------
class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.PrimaryKeyRelatedField(read_only=True)
    product_count = serializers.IntegerField(read_only=True, default=0)

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
            "is_active",
            "featured",
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
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "logo_url",
            "is_active",
            "featured",
            "seo_title",
            "seo_description",
            "seo_keywords",
            "created_at",
            "updated_at",
        ]

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request")
        url = obj.logo.url
        if request:
            return request.build_absolute_uri(url)
        return url


class BrandWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "is_active",
            "featured",
            "seo_title",
            "seo_description",
            "seo_keywords",
        ]

    def validate_slug(self, value):
        slug_value = slugify(value or "")
        if not slug_value:
            raise serializers.ValidationError("Slug is required.")

        qs = Brand.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(slug__iexact=slug_value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return slug_value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get("slug") and attrs.get("name"):
            attrs["slug"] = slugify(attrs["name"])
        return attrs


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
    image_url = serializers.SerializerMethodField()

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
            "image_url",
            "is_featured",
            "is_active",
            "seo_title",
            "seo_description",
            "seo_keywords",
            "created_at",
        ]

    def get_brand(self, obj):
        if obj.brand:
            return {"id": obj.brand.id, "name": obj.brand.name, "slug": obj.brand.slug}
        return None

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


# --------------------------
# PRODUCT WRITE SERIALIZER (ADMIN)
# --------------------------
class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        required=True,
        allow_null=False,
    )
    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        source="brand",
        required=False,
        allow_null=True,
        default=None,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "price",
            "stock",
            "short_description",
            "description",
            "category_id",
            "brand_id",
            "image",
            "is_featured",
            "is_active",
            "seo_title",
            "seo_description",
            "seo_keywords",
        ]
        extra_kwargs = {
            "name": {"required": True},
            "price": {"required": True},
            "description": {"required": True},
        }

    def validate_slug(self, value):
        slug_value = slugify(value or "")
        if not slug_value and not (self.initial_data.get("name") or getattr(self.instance, "name", None)):
            raise serializers.ValidationError("Slug is required.")
        if not slug_value and self.initial_data.get("name"):
            slug_value = slugify(self.initial_data.get("name") or "")

        qs = Product.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if slug_value and qs.filter(slug__iexact=slug_value).exists():
            raise serializers.ValidationError("Slug must be unique.")
        return slug_value

    def validate_sku(self, value):
        qs = Product.objects.all()
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.filter(sku__iexact=value).exists():
            raise serializers.ValidationError("SKU must be unique.")
        return value

    def validate_price(self, value):
        if value is None:
            raise serializers.ValidationError("Price is required.")
        if value < 0:
            raise serializers.ValidationError("Price must be greater than or equal to 0.")
        return value

    def validate_stock(self, value):
        if value is None:
            return 0
        if value < 0:
            raise serializers.ValidationError("Stock must be greater than or equal to 0.")
        return value

    def validate(self, attrs):
        errors = {}

        name = attrs.get("name") or getattr(self.instance, "name", None)
        if not name and not self.partial:
            errors["name"] = ["Name is required."]

        category = attrs.get("category") or getattr(self.instance, "category", None)
        if not category and not self.partial:
            errors["category_id"] = ["Category is required."]

        if errors:
            raise serializers.ValidationError(errors)

        # Auto-generate slug if missing
        if not attrs.get("slug") and name:
            attrs["slug"] = slugify(name)

        return super().validate(attrs)

    def create(self, validated_data):
        if not validated_data.get("slug") and validated_data.get("name"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)


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
    invoice = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer_name",
            "customer_email",
            "phone",
            "address",
            "total_amount",
            "status",
            "payment_method",
            "payment_status",
            "courier_name",
            "tracking_number",
            "shipped_at",
            "created_at",
            "updated_at",
            "items",
            "invoice_pdf",
            "invoice",
        ]

    def get_invoice_pdf(self, obj):
        if not obj.invoice_pdf:
            return None

        request = self.context.get("request")
        url = obj.invoice_pdf.url

        if request:
            return request.build_absolute_uri(url)

        return url

    def get_invoice(self, obj):
        inv = getattr(obj, "invoice", None)
        if not inv:
            return None
        request = self.context.get("request")
        url = inv.pdf.url if inv.pdf else None
        if url and request:
            url = request.build_absolute_uri(url)
        return {
            "number": inv.number,
            "pdf_url": url,
            "created_at": inv.created_at,
        }


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


class ShipmentSerializer(serializers.Serializer):
    courier_name = serializers.CharField(max_length=100)
    tracking_number = serializers.CharField(max_length=100)


# --------------------------
# HOMEPAGE SETTINGS SERIALIZERS
# --------------------------
class MiniCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class MiniBrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo_url"]

    def get_logo_url(self, obj):
        if not obj.logo:
            return None
        request = self.context.get("request")
        url = obj.logo.url
        if request:
            return request.build_absolute_uri(url)
        return url


class MiniProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "price", "image_url"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class HeroSlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroSlide
        fields = [
            "id",
            "image",
            "image_url",
            "link_url",
            "order",
            "is_active",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "image": {"required": False, "allow_null": True},
        }

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not self.instance and not attrs.get("image"):
            raise serializers.ValidationError({"image": "Image is required."})
        return attrs


class HomepageSettingsSerializer(serializers.ModelSerializer):
    new_arrivals = MiniProductSerializer(many=True, read_only=True)
    featured_categories = MiniCategorySerializer(many=True, read_only=True)
    featured_brands = MiniBrandSerializer(many=True, read_only=True)

    new_arrival_ids = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), many=True, write_only=True, required=False, source="new_arrivals"
    )
    featured_category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, write_only=True, required=False, source="featured_categories"
    )
    featured_brand_ids = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(), many=True, write_only=True, required=False, source="featured_brands"
    )

    class Meta:
        model = HomepageSection
        fields = [
            "id",
            "new_arrivals",
            "featured_categories",
            "featured_brands",
            "new_arrival_ids",
            "featured_category_ids",
            "featured_brand_ids",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def update(self, instance, validated_data):
        m2m_updates = {}
        for key in ["new_arrivals", "featured_categories", "featured_brands"]:
            if key in validated_data:
                m2m_updates[key] = validated_data.pop(key)

        instance = super().update(instance, validated_data)

        for field, values in m2m_updates.items():
            getattr(instance, field).set(values)

        return instance

    def create(self, validated_data):
        m2m_updates = {}
        for key in ["new_arrivals", "featured_categories", "featured_brands"]:
            if key in validated_data:
                m2m_updates[key] = validated_data.pop(key)

        instance = super().create(validated_data)
        for field, values in m2m_updates.items():
            getattr(instance, field).set(values)
        return instance
