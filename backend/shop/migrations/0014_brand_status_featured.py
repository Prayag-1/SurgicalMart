from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0013_category_status_featured"),
    ]

    operations = [
        migrations.AddField(
            model_name="brand",
            name="featured",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="brand",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
