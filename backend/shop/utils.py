import os
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def generate_invoice_pdf(order):
    """
    Generate a simple minimal invoice PDF for the given order.
    Returns relative path: invoices/filename.pdf
    """
    invoices_dir = settings.MEDIA_ROOT / "invoices"
    invoices_dir.mkdir(parents=True, exist_ok=True)

    file_name = f"invoice_order_{order.id}.pdf"
    file_path = invoices_dir / file_name

    c = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4
    y = height - 50

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Surgical Mart Nepal")
    y -= 25

    c.setFont("Helvetica", 11)
    c.drawString(50, y, f"Invoice for Order #{order.id}")
    y -= 15
    c.drawString(50, y, f"Customer: {order.full_name}")
    y -= 15
    c.drawString(50, y, f"Phone: {order.phone}")
    y -= 15
    c.drawString(50, y, f"Email: {order.email}")
    y -= 15
    c.drawString(50, y, "Address:")
    y -= 15
    c.drawString(50, y, order.address[:90])
    y -= 30

    # Table header
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Item")
    c.drawString(300, y, "Qty")
    c.drawString(360, y, "Price")
    c.drawString(440, y, "Subtotal")
    y -= 10
    c.line(50, y, 550, y)
    y -= 20

    # Line items
    c.setFont("Helvetica", 10)
    for item in order.items.all():
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y, "Item")
            c.drawString(300, y, "Qty")
            c.drawString(360, y, "Price")
            c.drawString(440, y, "Subtotal")
            y -= 10
            c.line(50, y, 550, y)
            y -= 20
            c.setFont("Helvetica", 10)

        name = item.product.name[:40]
        c.drawString(50, y, name)
        c.drawRightString(320, y, str(item.quantity))
        c.drawRightString(400, y, f"Rs {item.price}")
        c.drawRightString(520, y, f"Rs {item.subtotal}")
        y -= 18

    # Total
    y -= 10
    c.line(350, y, 550, y)
    y -= 20
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(440, y, "Total:")
    c.drawRightString(520, y, f"Rs {order.total_amount}")

    c.showPage()
    c.save()

    return f"invoices/{file_name}"
