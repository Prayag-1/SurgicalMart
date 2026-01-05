from decimal import Decimal

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from shop.models import Order, Product, Category, Brand


User = get_user_model()


class AdminDashboardTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", is_staff=True
        )
        self.non_staff = User.objects.create_user(
            username="user", email="user@example.com", password="pass123", is_staff=False
        )
        self.client = APIClient()

        category = Category.objects.create(name="Surgical", slug="surgical")
        brand = Brand.objects.create(name="Acme", slug="acme")
        self.product = Product.objects.create(
            name="Scalpel",
            slug="scalpel",
            category=category,
            brand=brand,
            short_description="",
            description="Sharp scalpel",
            price=Decimal("50.00"),
            sku="SKU-1",
            stock=2,
        )

        now = timezone.now()
        Order.objects.create(
            full_name="Dr. Admin",
            email="doc@example.com",
            phone="123456789",
            address="Test",
            total_amount=Decimal("150.00"),
            status=Order.STATUS_PENDING,
            payment_method=Order.PAYMENT_METHOD_COD,
            payment_status=Order.PAYMENT_STATUS_PENDING,
            created_at=now,
        )
        Order.objects.create(
            full_name="Customer",
            email="c@example.com",
            phone="987654321",
            address="Test",
            total_amount=Decimal("200.00"),
            status=Order.STATUS_CONFIRMED,
            payment_method=Order.PAYMENT_METHOD_COD,
            payment_status=Order.PAYMENT_STATUS_CONFIRMED,
            created_at=now,
        )

    def test_dashboard_requires_staff(self):
        url = "/api/admin/dashboard/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.non_staff)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_returns_metrics(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.get("/api/admin/dashboard/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        for key in [
            "total_orders",
            "orders_today",
            "pending_orders",
            "confirmed_orders",
            "shipped_orders",
            "delivered_orders",
            "cancelled_orders",
            "total_products",
            "low_stock_products_count",
            "recent_orders",
            "low_stock_products",
            "revenue_this_month",
            "revenue_is_estimated",
            "cod_pending_count",
        ]:
            self.assertIn(key, data)

        self.assertGreaterEqual(data["total_orders"], 2)
        self.assertGreaterEqual(len(data["recent_orders"]), 1)
        self.assertLessEqual(len(data["recent_orders"]), 5)
        self.assertGreaterEqual(len(data["low_stock_products"]), 0)
        self.assertLessEqual(len(data["low_stock_products"]), 5)
