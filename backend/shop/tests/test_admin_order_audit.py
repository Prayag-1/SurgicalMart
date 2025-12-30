from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from shop.models import Order, OrderAdminNote, OrderStatusAuditLog


User = get_user_model()


class AdminOrderAuditTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username="staff", email="staff@example.com", password="pass123", is_staff=True
        )
        self.non_staff_user = User.objects.create_user(
            username="customer", email="customer@example.com", password="pass123", is_staff=False
        )
        self.order = Order.objects.create(
            full_name="John Doe",
            email="john@example.com",
            phone="1234567890",
            address="123 Street",
            total_amount=100,
        )

    def test_staff_can_create_note(self):
        self.client.force_authenticate(user=self.staff_user)
        url = f"/api/admin/orders/{self.order.id}/notes/"

        response = self.client.post(
            url,
            {"note": "Verify address", "is_pinned": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        note = OrderAdminNote.objects.get(order=self.order)
        self.assertEqual(note.author, self.staff_user)
        self.assertEqual(note.author_email_snapshot, self.staff_user.email)
        self.assertTrue(note.is_pinned)

    def test_non_staff_cannot_create_note(self):
        self.client.force_authenticate(user=self.non_staff_user)
        url = f"/api/admin/orders/{self.order.id}/notes/"

        response = self.client.post(url, {"note": "Should be blocked"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(OrderAdminNote.objects.count(), 0)

    def test_status_change_creates_audit_log(self):
        self.client.force_authenticate(user=self.staff_user)
        url = f"/api/admin/orders/{self.order.id}/status/"

        response = self.client.post(
            url,
            {"to_status": Order.STATUS_CONFIRMED, "reason": "Payment confirmed"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audits = OrderStatusAuditLog.objects.filter(order=self.order)
        self.assertEqual(audits.count(), 1)
        audit = audits.first()
        self.assertEqual(audit.from_status, Order.STATUS_PENDING)
        self.assertEqual(audit.to_status, Order.STATUS_CONFIRMED)
        self.assertEqual(audit.actor, self.staff_user)
        self.assertEqual(audit.actor_email_snapshot, self.staff_user.email)

    def test_invalid_or_noop_transition_creates_no_audit_log(self):
        self.client.force_authenticate(user=self.staff_user)
        url = f"/api/admin/orders/{self.order.id}/status/"

        # No-op transition
        noop_response = self.client.post(
            url,
            {"to_status": Order.STATUS_PENDING},
            format="json",
        )
        self.assertEqual(noop_response.status_code, status.HTTP_200_OK)
        self.assertEqual(OrderStatusAuditLog.objects.count(), 0)

        # Invalid transition
        invalid_response = self.client.post(
            url,
            {"to_status": Order.STATUS_DELIVERED},
            format="json",
        )
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(OrderStatusAuditLog.objects.count(), 0)

    def test_audit_logs_are_read_only_via_api(self):
        self.client.force_authenticate(user=self.staff_user)
        status_url = f"/api/admin/orders/{self.order.id}/status/"
        self.client.post(
            status_url,
            {"to_status": Order.STATUS_CONFIRMED},
            format="json",
        )

        audits_url = f"/api/admin/orders/{self.order.id}/status-audits/"
        patch_response = self.client.patch(audits_url, {"reason": "edit"}, format="json")
        delete_response = self.client.delete(audits_url)

        self.assertEqual(patch_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(OrderStatusAuditLog.objects.filter(order=self.order).count(), 1)


class AdminOrderTimelineTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff_user = User.objects.create_user(
            username="staff", email="staff@example.com", password="pass123", is_staff=True
        )
        self.non_staff_user = User.objects.create_user(
            username="customer", email="customer@example.com", password="pass123", is_staff=False
        )
        self.order = Order.objects.create(
            full_name="Jane Doe",
            email="jane@example.com",
            phone="0987654321",
            address="456 Street",
            total_amount=150,
        )

    def test_timeline_merges_and_orders_events(self):
        now = timezone.now()
        audit1 = OrderStatusAuditLog.objects.create(
            order=self.order,
            actor=self.staff_user,
            actor_email_snapshot=self.staff_user.email,
            from_status=Order.STATUS_PENDING,
            to_status=Order.STATUS_CONFIRMED,
            reason="Paid",
        )
        OrderStatusAuditLog.objects.filter(id=audit1.id).update(created_at=now - timedelta(minutes=5))

        note1 = OrderAdminNote.objects.create(
            order=self.order,
            author=self.staff_user,
            author_email_snapshot=self.staff_user.email,
            note="Pack carefully",
            is_pinned=True,
        )
        OrderAdminNote.objects.filter(id=note1.id).update(created_at=now - timedelta(minutes=3))

        audit2 = OrderStatusAuditLog.objects.create(
            order=self.order,
            actor=self.staff_user,
            actor_email_snapshot=self.staff_user.email,
            from_status=Order.STATUS_CONFIRMED,
            to_status=Order.STATUS_PACKED,
            reason="Packed",
        )
        OrderStatusAuditLog.objects.filter(id=audit2.id).update(created_at=now - timedelta(minutes=1))

        self.client.force_authenticate(user=self.staff_user)
        url = f"/api/admin/orders/{self.order.id}/timeline/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        events = response.json()
        self.assertEqual(len(events), 3)
        self.assertEqual(events[0]["event_type"], "status_change")
        self.assertEqual(events[0]["to_status"], Order.STATUS_PACKED)
        self.assertEqual(events[1]["event_type"], "note")
        self.assertTrue(events[1]["is_pinned"])
        self.assertEqual(events[2]["from_status"], Order.STATUS_PENDING)

    def test_timeline_staff_only(self):
        url = f"/api/admin/orders/{self.order.id}/timeline/"
        self.client.force_authenticate(user=self.non_staff_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_allowed_statuses_endpoint(self):
        self.client.force_authenticate(user=self.staff_user)
        url = f"/api/admin/orders/{self.order.id}/allowed-statuses/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body["current_status"], Order.STATUS_PENDING)
        self.assertIn(Order.STATUS_CONFIRMED, body["allowed_statuses"])
