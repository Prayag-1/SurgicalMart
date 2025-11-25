from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Category, Product, BulkInquiry, Order, OrderItem
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    BulkInquirySerializer,
    OrderSerializer,
)
from .cart import Cart


# --------------------------------------------------
# CATEGORY LIST VIEW
# --------------------------------------------------
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# --------------------------------------------------
# PRODUCT LIST VIEW
# --------------------------------------------------
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ["category__slug", "is_featured"]
    search_fields = ["name", "description", "sku"]
    ordering_fields = ["price", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()

        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset


# --------------------------------------------------
# PRODUCT DETAIL VIEW
# --------------------------------------------------
class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = "slug"


# --------------------------------------------------
# BULK INQUIRY
# --------------------------------------------------
class BulkInquiryCreateView(generics.CreateAPIView):
    serializer_class = BulkInquirySerializer


# --------------------------------------------------
# CART
# --------------------------------------------------
class CartDetailView(APIView):
    def get(self, request):
        cart = Cart(request)
        items = list(cart)
        total = str(cart.get_total())
        return Response({"items": items, "total": total})


class CartAddView(APIView):
    def post(self, request):
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        product = get_object_or_404(Product, id=product_id, is_active=True)

        cart = Cart(request)
        cart.add(product, quantity=quantity)

        return Response({"detail": "Product added to cart."})


class CartUpdateView(APIView):
    def post(self, request):
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        product = get_object_or_404(Product, id=product_id, is_active=True)

        cart = Cart(request)
        cart.add(product, quantity=quantity, override_quantity=True)

        return Response({"detail": "Cart updated."})


class CartRemoveView(APIView):
    def post(self, request):
        product_id = request.data.get("product_id")
        product = get_object_or_404(Product, id=product_id, is_active=True)

        cart = Cart(request)
        cart.remove(product)

        return Response({"detail": "Item removed from cart."})


class CartClearView(APIView):
    def post(self, request):
        cart = Cart(request)
        cart.clear()
        return Response({"detail": "Cart cleared."})


# --------------------------------------------------
# CHECKOUT WITH EMAIL CONFIRMATION
# --------------------------------------------------
class CheckoutView(APIView):
    def post(self, request):
        full_name = request.data.get("full_name")
        email = request.data.get("email")
        phone = request.data.get("phone")
        address = request.data.get("address")

        if not all([full_name, email, phone, address]):
            return Response({"error": "All fields are required."}, status=400)

        cart = Cart(request)
        cart_items = list(cart)

        if not cart_items:
            return Response({"error": "Cart is empty."}, status=400)

        # Create order
        order = Order.objects.create(
            full_name=full_name,
            email=email,
            phone=phone,
            address=address,
            total_amount=cart.get_total(),
        )

        # Create order items
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product_id=item["product_id"],
                price=item["price"],
                quantity=item["quantity"],
                subtotal=item["subtotal"],
            )

        # Clear cart
        cart.clear()

        # ----------------------
        # SEND ORDER CONFIRMATION EMAIL
        # ----------------------
        subject = f"Order Confirmation #{order.id} - Surgical Mart Nepal"
        message = (
            f"Dear {full_name},\n\n"
            f"Thank you for your order!\n"
            f"Your Order ID is: {order.id}\n\n"
            f"Total Amount: Rs. {order.total_amount}\n\n"
            f"Shipping Address:\n{address}\n\n"
            f"We will contact you soon.\n\n"
            "Regards,\n"
            "Surgical Mart Nepal"
        )

        send_mail(
            subject,
            message,
            None,               # DEFAULT_FROM_EMAIL
            [email],
            fail_silently=False,
        )

        return Response(
            {"message": "Order created successfully.", "order_id": order.id},
            status=201,
        )


# --------------------------------------------------
# ORDER DETAIL
# --------------------------------------------------
class OrderDetailView(APIView):
    def get(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)
        serializer = OrderSerializer(order)
        return Response(serializer.data)


# --------------------------------------------------
# ORDER LIST (ADMIN)
# --------------------------------------------------
class OrderListView(generics.ListAPIView):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer

    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["full_name", "email", "phone"]
    filterset_fields = ["status"]


# --------------------------------------------------
# ORDER TRACKING (PUBLIC)
# --------------------------------------------------
class OrderTrackingView(APIView):
    def get(self, request):
        order_id = request.query_params.get("order_id")
        phone = request.query_params.get("phone")
        email = request.query_params.get("email")

        if not order_id:
            return Response({"error": "Order ID required."}, status=400)

        order = Order.objects.filter(id=order_id)

        if phone:
            order = order.filter(phone=phone)
        if email:
            order = order.filter(email=email)

        order = order.first()

        if not order:
            return Response({"error": "Order not found."}, status=404)

        serializer = OrderSerializer(order)
        return Response(serializer.data)
