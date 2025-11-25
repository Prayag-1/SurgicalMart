from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid


def brand_image_upload_path(instance, filename):
    """Generate unique file path for brand images."""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"brands/{instance.slug}/{filename}"


class Brand(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
        db_index=True
    )

    slug = models.SlugField(
        max_length=180,
        unique=True,
        blank=True,
        db_index=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    image = models.ImageField(
        upload_to=brand_image_upload_path,
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Deactivate to hide brand from frontend"
    )

    created_at = models.DateTimeField(
        default=timezone.now,
        editable=False
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["name"]),
        ]
        verbose_name = "Brand"
        verbose_name_plural = "Brands"

    def clean(self):
        """Extra model-level validation."""
        if len(self.name) < 2:
            raise ValidationError("Brand name must be at least 2 characters long.")

    def save(self, *args, **kwargs):
        """Override save to auto-generate and enforce unique slug."""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1

            # Make slug unique (production-safe)
            while Brand.objects.filter(slug=slug).exclude(id=self.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
