from typing import Any, Optional

from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.utils import timezone

from .models import Order, OrderStatusAuditLog, Product, OrderAdminNote, Invoice
from .notifications import send_order_shipped, send_cod_confirmed, send_invoice_email
from .utils import generate_invoice_pdf


ALLOWED_ORDER_TRANSITIONS = {
    Order.STATUS_PENDING: {Order.STATUS_CONFIRMED, Order.STATUS_CANCELLED},
    Order.STATUS_CONFIRMED: {Order.STATUS_PACKED, Order.STATUS_CANCELLED},
    Order.STATUS_PACKED: {Order.STATUS_SHIPPED, Order.STATUS_CANCELLED},
    Order.STATUS_SHIPPED: {Order.STATUS_DELIVERED},
    Order.STATUS_DELIVERED: set(),
    Order.STATUS_CANCELLED: set(),
}


def _validate_transition(from_status: str, to_status: str) -> None:
    if to_status not in ALLOWED_ORDER_TRANSITIONS.get(from_status, set()):
        raise ValidationError(
            {"to_status": f"Transition from {from_status} to {to_status} is not allowed."}
        )


def change_order_status(
    order_id: int,
    to_status: str,
    actor=None,
    reason: Optional[str] = None,
    meta: Optional[Any] = None,
) -> Order:
    """
    Change order status with transition validation, inventory updates, and audit logging.
    """
    actor_user = actor if actor and getattr(actor, "is_authenticated", False) else None

    with transaction.atomic():
        order = (
            Order.objects.select_for_update()
            .select_related()
            .prefetch_related("items__product")
            .get(pk=order_id)
        )

        from_status = order.status

        if to_status == from_status:
            return order

        _validate_transition(from_status, to_status)

        if to_status == Order.STATUS_CONFIRMED and from_status == Order.STATUS_PENDING:
            if not order.stock_adjusted:
                product_ids = [item.product_id for item in order.items.all()]
                products = {
                    product.id: product
                    for product in Product.objects.select_for_update().filter(id__in=product_ids)
                }

                for item in order.items.all():
                    product = products.get(item.product_id)
                    if product.stock < item.quantity:
                        raise ValidationError({"detail": f"Not enough stock for {product.name}"})

                for item in order.items.all():
                    product = products.get(item.product_id)
                    product.stock -= item.quantity
                    product.save(update_fields=["stock"])

                order.stock_adjusted = True

        if to_status == Order.STATUS_CANCELLED:
            if from_status in {Order.STATUS_SHIPPED, Order.STATUS_DELIVERED}:
                raise ValidationError({"detail": "Cancellation is only allowed before shipment."})

            if order.stock_adjusted:
                product_ids = [item.product_id for item in order.items.all()]
                products = {
                    product.id: product
                    for product in Product.objects.select_for_update().filter(id__in=product_ids)
                }

                for item in order.items.all():
                    product = products.get(item.product_id)
                    product.stock += item.quantity
                    product.save(update_fields=["stock"])

                order.stock_adjusted = False

        order.status = to_status
        order.save(update_fields=["status", "stock_adjusted", "updated_at"])

        OrderStatusAuditLog.objects.create(
            order=order,
            actor=actor_user,
            actor_email_snapshot=getattr(actor_user, "email", "") if actor_user else "",
            from_status=from_status,
            to_status=to_status,
            reason=reason or "",
            meta=meta if meta is not None else None,
        )

        if to_status == Order.STATUS_SHIPPED:
            send_order_shipped(order)

        return order


def mark_cod_received(order_id: int, actor=None) -> Order:
    actor_user = actor if actor and getattr(actor, "is_authenticated", False) else None

    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)

        if order.payment_method != Order.PAYMENT_METHOD_COD:
            raise ValidationError({"detail": "Only COD payments can be marked as received."})

        if order.payment_status == Order.PAYMENT_STATUS_CONFIRMED:
            return order

        order.payment_status = Order.PAYMENT_STATUS_CONFIRMED
        order.save(update_fields=["payment_status", "updated_at"])

        # Record as admin note to surface in timeline
        OrderAdminNote.objects.create(
            order=order,
            author=actor_user,
            author_email_snapshot=getattr(actor_user, "email", "") if actor_user else "",
            note="COD payment received",
            is_pinned=False,
        )

        send_cod_confirmed(order)

        generate_invoice(order, actor_user)

        return order


def _next_invoice_number():
    last = Invoice.objects.select_for_update().order_by("-number").first()
    return (last.number + 1) if last else 1


def generate_invoice(order: Order, actor=None) -> Invoice:
    if getattr(order, "invoice", None):
        return order.invoice

    if order.payment_status != Order.PAYMENT_STATUS_CONFIRMED:
        raise ValidationError({"detail": "Invoice can only be generated after payment confirmation."})

    with transaction.atomic():
        if getattr(order, "invoice", None):
            return order.invoice

        number = _next_invoice_number()
        pdf_rel_path = generate_invoice_pdf(order, invoice_number=number)

        invoice = Invoice.objects.create(
            order=order,
            number=number,
            pdf=pdf_rel_path,
        )

        order.invoice_pdf = pdf_rel_path
        order.save(update_fields=["invoice_pdf", "updated_at"])

        OrderAdminNote.objects.create(
            order=order,
            author=actor if actor and getattr(actor, "is_authenticated", False) else None,
            author_email_snapshot=getattr(actor, "email", "") if actor and getattr(actor, "is_authenticated", False) else "",
            note=f"Invoice #{number} generated",
            is_pinned=False,
        )

        send_invoice_email(order)

        return invoice


def add_shipment_details(order: Order, courier_name: str, tracking_number: str, actor=None) -> Order:
    if order.payment_status != Order.PAYMENT_STATUS_CONFIRMED:
        raise ValidationError({"detail": "Shipment can only be added after payment confirmation."})

    if order.status in {Order.STATUS_CANCELLED, Order.STATUS_DELIVERED}:
        raise ValidationError({"detail": "Shipment cannot be added for delivered or cancelled orders."})

    with transaction.atomic():
        order_locked = Order.objects.select_for_update().get(pk=order.pk)

        # Refresh to ensure latest state
        if order_locked.payment_status != Order.PAYMENT_STATUS_CONFIRMED:
            raise ValidationError({"detail": "Shipment can only be added after payment confirmation."})
        if order_locked.status in {Order.STATUS_CANCELLED, Order.STATUS_DELIVERED}:
            raise ValidationError({"detail": "Shipment cannot be added for delivered or cancelled orders."})

        same_details = (
            order_locked.courier_name == courier_name
            and order_locked.tracking_number == tracking_number
        )
        if same_details and order_locked.shipped_at:
            return order_locked

        order_locked.courier_name = courier_name
        order_locked.tracking_number = tracking_number
        if not order_locked.shipped_at:
            order_locked.shipped_at = timezone.now()
        order_locked.save(update_fields=["courier_name", "tracking_number", "shipped_at", "updated_at"])

        OrderAdminNote.objects.create(
            order=order_locked,
            author=actor if actor and getattr(actor, "is_authenticated", False) else None,
            author_email_snapshot=getattr(actor, "email", "") if actor and getattr(actor, "is_authenticated", False) else "",
            note=f"Order shipped via {courier_name}, tracking #{tracking_number}",
            is_pinned=False,
        )

        send_order_shipped(order_locked)

        return order_locked
