from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

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
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=["patch"], url_path="update-status")
    @transaction.atomic
    def update_status(self, request, pk=None):
        order = self.get_object()
        old_status = order.status

        serializer = OrderStatusUpdateSerializer(order, data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]

        # reduce stock
        if old_status == Order.STATUS_PENDING and new_status != Order.STATUS_PENDING:
            for item in order.items.all():
                if item.product.stock < item.quantity:
                    return Response({"detail": f"Not enough stock for {item.product.name}"}, status=400)

            for item in order.items.all():
                product = item.product
                product.stock -= item.quantity
                product.save()

        # restock on cancel
        if new_status == Order.STATUS_CANCELLED:
            for item in order.items.all():
                product = item.product
                product.stock += item.quantity
                product.save()

        serializer.save()
        return Response(OrderSerializer(order).data)


# -------------------------------
# ADMIN PRODUCT MANAGEMENT
# -------------------------------
class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        return ProductSerializer

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        threshold = int(request.query_params.get("threshold", 5))
        items = Product.objects.filter(stock__lte=threshold, is_active=True)
        serializer = ProductSerializer(items, many=True)
        return Response(serializer.data)
