import csv

import logging

from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse

from .models import Order, Product, OrderAdminNote, Category, Brand, AdminSetting, HomepageSection, HeroSlide
from .serializers import (
    AdminOrderSerializer,
    ProductSerializer,
    ProductWriteSerializer,
    OrderAdminNoteSerializer,
    OrderStatusAuditLogSerializer,
    CategorySerializer,
    CategoryWriteSerializer,
    BrandSerializer,
    BrandWriteSerializer,
    AdminSettingSerializer,
    ShipmentSerializer,
    HomepageSettingsSerializer,
    HeroSlideSerializer,
)
from .permissions import IsAdminUser
from .services import (
    change_order_status,
    ALLOWED_ORDER_TRANSITIONS,
    mark_cod_received,
    generate_invoice,
    add_shipment_details,
)


# -------------------------------
# ADMIN ORDER MANAGEMENT
# -------------------------------
class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.all()
        .select_related()
        .prefetch_related("items__product", "status_audits", "admin_notes", "invoice")
        .order_by("-created_at")
    )
    serializer_class = AdminOrderSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "payment_status", "payment_method"]
    search_fields = ["order_number", "customer_name", "customer_email", "phone"]
    ordering_fields = ["created_at", "total_amount", "status"]
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="orders.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "Order Number",
                "Customer Name",
                "Customer Email",
                "Phone",
                "Status",
                "Payment Status",
                "Payment Method",
                "Total Amount",
                "Created At",
                "Shipped At",
            ]
        )
        for order in queryset:
            writer.writerow(
                [
                    order.order_number,
                    order.customer_name,
                    order.customer_email,
                    order.phone,
                    order.status,
                    order.payment_status,
                    order.payment_method,
                    order.total_amount,
                    order.created_at.isoformat(),
                    order.shipped_at.isoformat() if order.shipped_at else "",
                ]
            )
        return response

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        to_status = request.data.get("status") or request.data.get("to_status")
        reason = request.data.get("reason")
        meta = request.data.get("meta")

        if not to_status:
            return Response({"detail": "status is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = change_order_status(
                order_id=pk,
                to_status=to_status,
                actor=request.user,
                reason=reason,
                meta=meta,
            )
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = AdminOrderSerializer(order, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="payment-received")
    def payment_received(self, request, pk=None):
        try:
            order = mark_cod_received(order_id=pk, actor=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        serializer = AdminOrderSerializer(order, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="shipment")
    def shipment(self, request, pk=None):
        serializer = ShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        courier_name = serializer.validated_data["courier_name"]
        tracking_number = serializer.validated_data["tracking_number"]

        try:
            order = self.get_object()
            order = add_shipment_details(order, courier_name, tracking_number, request.user)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(AdminOrderSerializer(order, context={"request": request}).data)

    @action(detail=True, methods=["get", "post"], url_path="notes")
    def notes(self, request, pk=None):
        order = self.get_object()

        if request.method.lower() == "get":
            pinned_first = request.query_params.get("pinned_first", "true").lower() != "false"
            notes_qs = order.admin_notes.all()
            if pinned_first:
                notes_qs = notes_qs.order_by("-is_pinned", "-created_at")
            else:
                notes_qs = notes_qs.order_by("-created_at")

            serializer = OrderAdminNoteSerializer(notes_qs, many=True)
            return Response(serializer.data)

        serializer = OrderAdminNoteSerializer(
            data=request.data,
            context={"order": order, "author": request.user},
        )
        serializer.is_valid(raise_exception=True)
        note = serializer.save()
        return Response(OrderAdminNoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch", "delete"], url_path=r"notes/(?P<note_id>[^/.]+)")
    def note_detail(self, request, pk=None, note_id=None):
        order = self.get_object()
        note = get_object_or_404(OrderAdminNote, pk=note_id, order=order)

        if request.method.lower() == "delete":
            note.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = OrderAdminNoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderAdminNoteSerializer(note).data)

    @action(detail=True, methods=["get"], url_path="status-audits")
    def status_audits(self, request, pk=None):
        order = self.get_object()
        audits = order.status_audits.all().order_by("-created_at")
        serializer = OrderStatusAuditLogSerializer(audits, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="timeline")
    def timeline(self, request, pk=None):
        order = self.get_object()
        limit_param = request.query_params.get("limit")
        try:
            limit = int(limit_param) if limit_param else 100
        except (TypeError, ValueError):
            return Response({"detail": "limit must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        limit = max(1, min(limit, 200))

        audits = list(
            order.status_audits.select_related("actor")
            .order_by("-created_at")[:limit]
        )
        notes = list(
            order.admin_notes.select_related("author")
            .order_by("-created_at")[:limit]
        )

        events = []

        for audit in audits:
            events.append(
                {
                    "id": f"audit-{audit.id}",
                    "event_type": "status_change",
                    "created_at": audit.created_at,
                    "actor_email": audit.actor_email_snapshot or (audit.actor.email if audit.actor else None),
                    "from_status": audit.from_status,
                    "to_status": audit.to_status,
                    "reason": audit.reason,
                }
            )

        for note in notes:
            events.append(
                {
                    "id": f"note-{note.id}",
                    "event_type": "note",
                    "created_at": note.created_at,
                    "actor_email": note.author_email_snapshot or (note.author.email if note.author else None),
                    "note": note.note,
                    "is_pinned": note.is_pinned,
                }
            )

        events.sort(key=lambda item: item["created_at"], reverse=True)
        events = events[:limit]

        return Response(events)

    @action(detail=True, methods=["post", "get"], url_path="invoice")
    def invoice(self, request, pk=None):
        order = self.get_object()

        if request.method.lower() == "post":
            try:
                invoice = generate_invoice(order, request.user)
            except ValidationError as exc:
                return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
        else:
            invoice = getattr(order, "invoice", None)
            if not invoice:
                try:
                    invoice = generate_invoice(order, request.user)
                except ValidationError as exc:
                    return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        data = {
            "number": invoice.number,
            "created_at": invoice.created_at,
            "pdf_url": request.build_absolute_uri(invoice.pdf.url) if invoice.pdf else None,
        }

        if request.query_params.get("download") == "1" and invoice.pdf:
            from django.http import FileResponse

            return FileResponse(invoice.pdf.open("rb"), as_attachment=True, filename=invoice.pdf.name.split("/")[-1])

        return Response(data)

    @action(detail=True, methods=["get"], url_path="allowed-statuses")
    def allowed_statuses(self, request, pk=None):
        order = self.get_object()
        allowed = ALLOWED_ORDER_TRANSITIONS.get(order.status, set())
        return Response(
            {
                "current_status": order.status,
                "allowed_statuses": sorted(list(allowed)),
            }
        )


# -------------------------------
# ADMIN PRODUCT MANAGEMENT
# -------------------------------
class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["stock", "price", "created_at"]
    search_fields = ["name", "description", "sku"]
    filterset_fields = ["is_active", "category", "brand"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        return ProductSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logging.getLogger(__name__).warning("Product create validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["patch"], url_path="stock")
    def update_stock(self, request, pk=None):
        product = self.get_object()
        try:
            stock = int(request.data.get("stock"))
        except (TypeError, ValueError):
            return Response({"detail": "Stock must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        if stock < 0:
            return Response({"detail": "Stock must be greater than or equal to 0."}, status=status.HTTP_400_BAD_REQUEST)

        product.stock = stock
        product.save(update_fields=["stock"])
        serializer = ProductSerializer(product, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["patch"], url_path="toggle")
    def toggle_active(self, request, pk=None):
        product = self.get_object()
        product.is_active = not product.is_active
        product.save(update_fields=["is_active"])
        serializer = ProductSerializer(product, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        threshold = int(request.query_params.get("threshold", 5))
        items = Product.objects.filter(stock__lte=threshold, is_active=True)
        serializer = ProductSerializer(items, many=True)
        return Response(serializer.data)


# -------------------------------
# ADMIN DASHBOARD SUMMARY
# -------------------------------
class AdminDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        start_month = today.replace(day=1)

        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()

        pending_orders = Order.objects.filter(status=Order.STATUS_PENDING).count()
        confirmed_orders = Order.objects.filter(status=Order.STATUS_CONFIRMED).count()
        shipped_orders = Order.objects.filter(status=Order.STATUS_SHIPPED).count()
        delivered_orders = Order.objects.filter(status=Order.STATUS_DELIVERED).count()
        cancelled_orders = Order.objects.filter(status=Order.STATUS_CANCELLED).count()

        total_products = Product.objects.count()

        low_stock_threshold = 5
        low_stock_qs = Product.objects.filter(stock__lte=low_stock_threshold, is_active=True)
        low_stock_products_count = low_stock_qs.count()
        low_stock_products = list(
            low_stock_qs.select_related("category", "brand")
            .order_by("stock", "name")[:5]
            .values(
                "id",
                "name",
                "sku",
                "stock",
                "price",
                category_name=F("category__name"),
                brand_name=F("brand__name"),
            )
        )

        recent_orders = list(
            Order.objects.order_by("-created_at")
            .values(
                "id",
                "order_number",
                "customer_name",
                "customer_email",
                "phone",
                "total_amount",
                "status",
                "created_at",
            )[:5]
        )

        revenue_qs = Order.objects.filter(
            payment_status=Order.PAYMENT_STATUS_PAID,
            created_at__date__gte=start_month,
        )
        revenue_this_month = revenue_qs.aggregate(total=Sum("total_amount"))["total"] or 0

        cod_pending_count = Order.objects.filter(
            payment_method=Order.PAYMENT_METHOD_COD,
            payment_status=Order.PAYMENT_STATUS_PENDING,
        ).count()

        return Response(
            {
                "total_orders": total_orders,
                "orders_today": orders_today,
                "pending_orders": pending_orders,
                "confirmed_orders": confirmed_orders,
                "shipped_orders": shipped_orders,
                "delivered_orders": delivered_orders,
                "cancelled_orders": cancelled_orders,
                "total_products": total_products,
                "low_stock_products_count": low_stock_products_count,
                "recent_orders": recent_orders,
                "low_stock_products": low_stock_products,
                "revenue_this_month": revenue_this_month,
                "revenue_is_estimated": False,
                "cod_pending_count": cod_pending_count,
            }
        )


# -------------------------------
# ADMIN SETTINGS (singleton)
# -------------------------------
class AdminSettingView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_object(self):
        obj, _ = AdminSetting.objects.get_or_create(id=1, defaults={"site_name": "Surgical Mart Nepal"})
        return obj

    def get(self, request):
        settings_obj = self.get_object()
        serializer = AdminSettingSerializer(settings_obj, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        settings_obj = self.get_object()
        serializer = AdminSettingSerializer(settings_obj, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# -------------------------------
# ADMIN CATEGORY MANAGEMENT
# -------------------------------
class CategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().select_related("parent").order_by("name")
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "parent", "featured"]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["name", "created_at"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return CategoryWriteSerializer
        return CategorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        parent = self.request.query_params.get("parent")
        if parent is not None:
            if parent == "":
                qs = qs.filter(parent__isnull=True)
            else:
                qs = qs.filter(parent_id=parent)
        return qs

    @action(detail=False, methods=["get"], url_path="tree")
    def tree(self, request):
        categories = list(
            Category.objects.select_related("parent")
            .annotate(product_count=Count("products"))
            .order_by("name")
        )
        by_parent = {}
        for cat in categories:
            by_parent.setdefault(cat.parent_id, []).append(cat)

        def build_nodes(parent_id):
            nodes = []
            for cat in by_parent.get(parent_id, []):
                nodes.append(
                    {
                        "id": cat.id,
                        "name": cat.name,
                        "slug": cat.slug,
                        "is_active": cat.is_active,
                        "featured": cat.featured,
                        "seo_title": cat.seo_title,
                        "seo_description": cat.seo_description,
                        "seo_keywords": cat.seo_keywords,
                        "product_count": cat.product_count,
                        "children": build_nodes(cat.id),
                    }
                )
            return nodes

        return Response(build_nodes(None))


# -------------------------------
# ADMIN BRAND MANAGEMENT
# -------------------------------
class BrandAdminViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all().order_by("name")
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "featured"]
    search_fields = ["name", "slug", "description", "seo_keywords"]
    ordering_fields = ["name", "created_at"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BrandWriteSerializer
        return BrandSerializer


# -------------------------------
# HOMEPAGE SETTINGS
# -------------------------------
class HomepageSettingsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_object(self):
        obj, _ = HomepageSection.objects.get_or_create(id=1)
        return obj

    def get(self, request):
        obj = self.get_object()
        serializer = HomepageSettingsSerializer(obj, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        obj = self.get_object()
        serializer = HomepageSettingsSerializer(
            obj,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class HeroSlideViewSet(viewsets.ModelViewSet):
    queryset = HeroSlide.objects.all().order_by("order", "id")
    serializer_class = HeroSlideSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
