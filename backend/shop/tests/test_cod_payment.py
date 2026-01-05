from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from shop.models import Order, OrderAdminNote, Invoice
from shop.notifications import send_order_shipped, send_cod_confirmed, send_order_placed


User = get_user_model()


class CODPaymentTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", is_staff=True
        )
        self.non_staff = User.objects.create_user(
            username="user", email="user@example.com", password="pass123", is_staff=False
        )
        self.client = APIClient()
        self.order = Order.objects.create(
            full_name="Test User",
            email="test@example.com",
            phone="123456",
            address="Somewhere",
            total_amount=50,
        )

    def test_staff_can_mark_cod_received(self):
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{self.order.id}/payment-received/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, Order.PAYMENT_STATUS_CONFIRMED)
        self.assertTrue(Invoice.objects.filter(order=self.order).exists())
        self.assertGreaterEqual(OrderAdminNote.objects.filter(order=self.order).count(), 1)

    def test_non_staff_forbidden(self):
        self.client.force_authenticate(user=self.non_staff)
        url = f"/api/admin/orders/{self.order.id}/payment-received/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_mark_non_cod(self):
        self.order.payment_method = "OTHER"
        self.order.save(update_fields=["payment_method"])
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{self.order.id}/payment-received/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_idempotent_on_confirmed(self):
        self.order.payment_status = Order.PAYMENT_STATUS_CONFIRMED
        self.order.save(update_fields=["payment_status"])
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{self.order.id}/payment-received/"
        res = self.client.post(url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            OrderAdminNote.objects.filter(order=self.order, note__icontains="COD payment received").count(), 0
        )

    def test_notification_helpers_do_not_crash(self):
        # Ensure notification helpers are callable even if settings incomplete
        send_order_placed(self.order)
        send_cod_confirmed(self.order)
        send_order_shipped(self.order)


    def test_invoice_generation_endpoint(self):
        self.client.force_authenticate(user=self.staff)
        # Mark payment confirmed
        self.order.payment_status = Order.PAYMENT_STATUS_CONFIRMED
        self.order.save(update_fields=["payment_status"])

        url = f"/api/admin/orders/{self.order.id}/invoice/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertIn("number", data)
        self.assertTrue(Invoice.objects.filter(order=self.order).exists())
        