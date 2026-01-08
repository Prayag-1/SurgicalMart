from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from shop.models import Order, OrderAdminNote


User = get_user_model()


class ShipmentTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", is_staff=True
        )
        self.non_staff = User.objects.create_user(
            username="user", email="user@example.com", password="pass123", is_staff=False
        )
        self.client = APIClient()
        self.order = Order.objects.create(
            customer_name="Test User",
            customer_email="test@example.com",
            phone="123456",
            address="Somewhere",
            total_amount=50,
            payment_status=Order.PAYMENT_STATUS_PAID,
        )

    def test_requires_payment_confirmation(self):
        order = Order.objects.create(
            customer_name="Pending User",
            customer_email="p@example.com",
            phone="5555",
            address="Nowhere",
            total_amount=10,
            payment_status=Order.PAYMENT_STATUS_PENDING,
        )
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{order.id}/shipment/"
        res = self.client.post(url, {"courier_name": "DHL", "tracking_number": "ABC"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_only(self):
        url = f"/api/admin/orders/{self.order.id}/shipment/"
        res = self.client.post(url, {"courier_name": "DHL", "tracking_number": "ABC"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.non_staff)
        res = self.client.post(url, {"courier_name": "DHL", "tracking_number": "ABC"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @patch("shop.services.send_order_shipped")
    def test_add_shipment_and_notification(self, mock_notify):
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{self.order.id}/shipment/"
        res = self.client.post(url, {"courier_name": "DHL", "tracking_number": "ABC123"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.courier_name, "DHL")
        self.assertEqual(self.order.tracking_number, "ABC123")
        self.assertIsNotNone(self.order.shipped_at)
        self.assertEqual(
            OrderAdminNote.objects.filter(order=self.order, note__icontains="Order shipped via").count(), 1
        )
        mock_notify.assert_called_once()

    @patch("shop.services.send_order_shipped")
    def test_idempotent_same_details(self, mock_notify):
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{self.order.id}/shipment/"
        payload = {"courier_name": "DHL", "tracking_number": "ABC123"}
        res1 = self.client.post(url, payload, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        res2 = self.client.post(url, payload, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        notes = OrderAdminNote.objects.filter(order=self.order, note__icontains="Order shipped via")
        self.assertEqual(notes.count(), 1)  # no duplicate note on identical payload
        mock_notify.assert_called()  # at least one call

    def test_cannot_add_when_cancelled_or_delivered(self):
        self.client.force_authenticate(user=self.staff)
        url = f"/api/admin/orders/{self.order.id}/shipment/"
        self.order.status = Order.STATUS_CANCELLED
        self.order.save(update_fields=["status"])
        res = self.client.post(url, {"courier_name": "DHL", "tracking_number": "ABC123"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
