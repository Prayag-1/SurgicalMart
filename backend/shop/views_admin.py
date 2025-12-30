from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import ValidationError
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Order, Product, OrderAdminNote, Category, Brand
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
)
from .permissions import IsAdminUser
from .services import change_order_status, ALLOWED_ORDER_TRANSITIONS


# -------------------------------
# ADMIN ORDER MANAGEMENT
# -------------------------------
class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = AdminOrderSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        to_status = request.data.get("to_status")
        reason = request.data.get("reason")
        meta = request.data.get("meta")

        if not to_status:
            return Response({"detail": "to_status is required."}, status=status.HTTP_400_BAD_REQUEST)

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
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["stock", "price", "created_at"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        return ProductSerializer

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
        today = timezone.now().date()

        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__date=today).count()

        status_counts = (
            Order.objects.values("status")
            .annotate(count=Count("id"))
            .order_by()
        )
        orders_by_status = {row["status"]: row["count"] for row in status_counts}

        low_stock_products = list(
            Product.objects.filter(stock__lte=5)
            .order_by("stock", "name")
            .values("id", "name", "stock", "is_active")[:10]
        )

        recent_orders = list(
            Order.objects.order_by("-created_at")
            .values("id", "full_name", "total_amount", "status", "created_at")[:10]
        )

        recent_products = list(
            Product.objects.order_by("-created_at")
            .values("id", "name", "stock", "is_active", "created_at")[:10]
        )

        return Response(
            {
                "total_orders": total_orders,
                "orders_today": orders_today,
                "orders_by_status": orders_by_status,
                "low_stock_products": low_stock_products,
                "recent_orders": recent_orders,
                "recent_products": recent_products,
            }
        )


# -------------------------------
# ADMIN CATEGORY MANAGEMENT
# -------------------------------
class CategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().select_related("parent").order_by("name")
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

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
            Category.objects.select_related("parent").order_by("name")
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
                        "seo_title": cat.seo_title,
                        "seo_description": cat.seo_description,
                        "seo_keywords": cat.seo_keywords,
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

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return BrandWriteSerializer
        return BrandSerializer
