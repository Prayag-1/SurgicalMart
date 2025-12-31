from typing import Any, Optional

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import Order, OrderStatusAuditLog, Product, OrderAdminNote
from .notifications import send_order_shipped, send_cod_confirmed


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

        return order
