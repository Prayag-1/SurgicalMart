from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0012_order_shipment_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="featured",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="category",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
