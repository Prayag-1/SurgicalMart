from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from shop.models import Category, Brand, AdminSetting


User = get_user_model()


class AdminCategoryTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", is_staff=True
        )
        self.non_staff = User.objects.create_user(
            username="user", email="user@example.com", password="pass123", is_staff=False
        )
        self.client = APIClient()

    def test_staff_only_access(self):
        url = "/api/admin/categories/"
        self.client.force_authenticate(user=self.non_staff)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_slug_unique_case_insensitive(self):
        self.client.force_authenticate(user=self.staff)
        url = "/api/admin/categories/"
        payload = {"name": "Surgical", "slug": "surgical"}
        res1 = self.client.post(url, payload, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        res2 = self.client.post(url, {"name": "Another", "slug": "Surgical"}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Slug must be unique.", str(res2.data))

    def test_tree_endpoint_returns_hierarchy(self):
        self.client.force_authenticate(user=self.staff)
        root = Category.objects.create(name="Root", slug="root")
        child = Category.objects.create(name="Child", slug="child", parent=root)
        Category.objects.create(name="Leaf", slug="leaf", parent=child)

        res = self.client.get("/api/admin/categories/tree/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], root.id)
        self.assertEqual(len(data[0]["children"]), 1)
        self.assertEqual(data[0]["children"][0]["id"], child.id)


class AdminBrandTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", is_staff=True
        )
        self.non_staff = User.objects.create_user(
            username="user", email="user@example.com", password="pass123", is_staff=False
        )
        self.client = APIClient()

    def test_staff_only_access(self):
        url = "/api/admin/brands/"
        self.client.force_authenticate(user=self.non_staff)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_brand_crud_and_logo_validation(self):
        self.client.force_authenticate(user=self.staff)
        url = "/api/admin/brands/"
        res = self.client.post(
            url, {"name": "Acme", "slug": "acme", "description": "Brand"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        brand_id = res.data["id"]

        detail_url = f"{url}{brand_id}/"
        res_patch = self.client.patch(detail_url, {"description": "Updated"}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["description"], "Updated")

        bad_logo = SimpleUploadedFile("logo.txt", b"not-an-image", content_type="text/plain")
        res_logo = self.client.patch(detail_url, {"logo": bad_logo}, format="multipart")
        self.assertEqual(res_logo.status_code, status.HTTP_400_BAD_REQUEST)

        res_delete = self.client.delete(detail_url)
        self.assertEqual(res_delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Brand.objects.filter(id=brand_id).exists())


class AdminSettingsTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin", email="admin@example.com", password="pass123", is_staff=True
        )
        self.non_staff = User.objects.create_user(
            username="user", email="user@example.com", password="pass123", is_staff=False
        )
        self.client = APIClient()

    def test_staff_only_access(self):
        url = "/api/admin/settings/"
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(user=self.non_staff)
        res2 = self.client.get(url)
        self.assertEqual(res2.status_code, status.HTTP_403_FORBIDDEN)

    def test_settings_get_and_patch(self):
        url = "/api/admin/settings/"
        self.client.force_authenticate(user=self.staff)

        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(AdminSetting.objects.exists())

        res_patch = self.client.patch(url, {"site_name": "New Name"}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["site_name"], "New Name")
