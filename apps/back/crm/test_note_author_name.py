from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

from .models import Note


User = get_user_model()


class NoteAuthorNameTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="author_name_admin",
            email="author.name.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="author_name_client",
            email="author.name.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.note = Note.objects.create(
            author=self.admin,
            client=self.client_user,
            content="Note avec auteur lisible.",
            pinned=False,
        )

        self.api_client.force_authenticate(
            user=self.admin
        )

    def test_note_api_exposes_author_name(self):
        response = self.api_client.get(
            f"/api/notes/{self.note.id}/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["author"],
            self.admin.id,
        )

        self.assertEqual(
            response.data["author_name"],
            self.admin.username,
        )