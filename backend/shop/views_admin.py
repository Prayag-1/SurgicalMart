from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from .models import Order, Product
from .serializers import (
    OrderSerializer,
    OrderStatusUpdateSerializer,
    ProductSerializer,
    ProductWriteSerializer,
)
from .permissions import IsAdminUser


# -------------------------------
# ADMIN ORDER MANAGEMENT
# -------------------------------
class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    http_method_names = ["get", "patch", "head", "options"]

    @action(detail=True, methods=["patch"], url_path="status")
    @transaction.atomic
    def update_status(self, request, pk=None):
        order = self.get_object()
        old_status = order.status

        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]

        if new_status == old_status:
            return Response(OrderSerializer(order, context={"request": request}).data)

        allowed_transitions = {
            Order.STATUS_PENDING: {Order.STATUS_CONFIRMED, Order.STATUS_CANCELLED},
            Order.STATUS_CONFIRMED: {Order.STATUS_PACKED, Order.STATUS_CANCELLED},
            Order.STATUS_PACKED: {Order.STATUS_SHIPPED, Order.STATUS_CANCELLED},
            Order.STATUS_SHIPPED: {Order.STATUS_DELIVERED},
            Order.STATUS_DELIVERED: set(),
            Order.STATUS_CANCELLED: set(),
        }

        if new_status not in allowed_transitions.get(old_status, set()):
            return Response(
                {"detail": f"Transition from {old_status} to {new_status} is not allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Inventory adjustments
        if new_status == Order.STATUS_CONFIRMED and old_status == Order.STATUS_PENDING:
            # Reduce stock on confirmation
            for item in order.items.select_related("product"):
                if item.product.stock < item.quantity:
                    return Response(
                        {"detail": f"Not enough stock for {item.product.name}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            for item in order.items.select_related("product"):
                product = item.product
                product.stock -= item.quantity
                product.save(update_fields=["stock"])

        if new_status == Order.STATUS_CANCELLED:
            if old_status in {Order.STATUS_SHIPPED, Order.STATUS_DELIVERED}:
                return Response(
                    {"detail": "Cancellation is only allowed before shipment."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Restore stock only if it was previously deducted
            if old_status != Order.STATUS_PENDING:
                for item in order.items.select_related("product"):
                    product = item.product
                    product.stock += item.quantity
                    product.save(update_fields=["stock"])

        serializer.save()
        return Response(OrderSerializer(order, context={"request": request}).data)


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
