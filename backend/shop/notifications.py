import logging
from django.conf import settings
from django.core.mail import send_mail

from .models import AdminSetting, Order

logger = logging.getLogger(__name__)


def _get_settings():
    obj, _ = AdminSetting.objects.get_or_create(id=1, defaults={"site_name": "Surgical Mart Nepal"})
    return obj


def _send_email(subject: str, body: str, recipients):
    if not recipients:
        return
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=recipients,
            fail_silently=True,
        )
    except Exception as exc:  # pragma: no cover - best-effort notification
        logger.warning("Email notification failed: %s", exc)


def _send_whatsapp(message: str, phone: str, admin_settings: AdminSetting):
    # Placeholder for future WhatsApp integration; avoid external dependency.
    if not phone or not admin_settings.whatsapp_api_url or not admin_settings.whatsapp_api_token:
        return
    logger.info("WhatsApp notification queued to %s: %s", phone, message)


def send_order_placed(order: Order):
    admin_settings = _get_settings()

    subject = f"New order #{order.id}"
    body = f"Order #{order.id} placed by {order.full_name} ({order.email}, {order.phone})"

    if admin_settings.notify_admin_email and admin_settings.admin_notification_email:
        _send_email(subject, body, [admin_settings.admin_notification_email])

    if admin_settings.notify_admin_whatsapp and admin_settings.admin_notification_phone:
        _send_whatsapp(body, admin_settings.admin_notification_phone, admin_settings)

    if admin_settings.notify_customer_email and order.email:
        _send_email(
            subject=f"Your order #{order.id} is placed",
            body="Thank you for your order. We will confirm soon.",
            recipients=[order.email],
        )

    if admin_settings.notify_customer_whatsapp and order.phone:
        _send_whatsapp(f"Your order #{order.id} is placed", order.phone, admin_settings)


def send_cod_confirmed(order: Order):
    admin_settings = _get_settings()
    body_admin = f"COD payment received for order #{order.id}"
    if admin_settings.notify_admin_email and admin_settings.admin_notification_email:
        _send_email(f"COD received #{order.id}", body_admin, [admin_settings.admin_notification_email])
    if admin_settings.notify_admin_whatsapp and admin_settings.admin_notification_phone:
        _send_whatsapp(body_admin, admin_settings.admin_notification_phone, admin_settings)

    if admin_settings.notify_customer_email and order.email:
        _send_email(
            subject=f"Order #{order.id} payment confirmed",
            body="We have received your COD payment.",
            recipients=[order.email],
        )
    if admin_settings.notify_customer_whatsapp and order.phone:
        _send_whatsapp(f"Payment received for order #{order.id}", order.phone, admin_settings)


def send_order_shipped(order: Order):
    admin_settings = _get_settings()
    body_admin = f"Order #{order.id} shipped."
    if admin_settings.notify_admin_email and admin_settings.admin_notification_email:
        _send_email(f"Order #{order.id} shipped", body_admin, [admin_settings.admin_notification_email])
    if admin_settings.notify_admin_whatsapp and admin_settings.admin_notification_phone:
        _send_whatsapp(body_admin, admin_settings.admin_notification_phone, admin_settings)

    if admin_settings.notify_customer_email and order.email:
        _send_email(
            subject=f"Your order #{order.id} is shipped",
            body="Your order is on the way.",
            recipients=[order.email],
        )
    if admin_settings.notify_customer_whatsapp and order.phone:
        _send_whatsapp(f"Order #{order.id} shipped", order.phone, admin_settings)


def send_invoice_email(order: Order):
    admin_settings = _get_settings()
    if not getattr(order, "invoice", None):
        return

    if admin_settings.notify_customer_email and order.email:
        _send_email(
            subject=f"Invoice #{order.invoice.number} for order #{order.id}",
            body="Your invoice is ready.",
            recipients=[order.email],
        )

    if admin_settings.notify_admin_email and admin_settings.admin_notification_email:
        _send_email(
            subject=f"Invoice generated for order #{order.id}",
            body=f"Invoice #{order.invoice.number} has been generated.",
            recipients=[admin_settings.admin_notification_email],
        )
