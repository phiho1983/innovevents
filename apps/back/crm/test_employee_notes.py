from django.contrib.auth import get_user_model
from django.test import TestCase

from rest_framework.test import APIClient

from .models import Note


User = get_user_model()


class EmployeeNotesTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.employee = User.objects.create_user(
            username="notes_employee",
            email="notes.employee@test.local",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.admin = User.objects.create_user(
            username="notes_admin",
            email="notes.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="notes_client",
            email="notes.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.note = Note.objects.create(
            author=self.admin,
            client=self.client_user,
            content="Note interne de suivi client.",
            pinned=False,
        )

        self.api_client.force_authenticate(
            user=self.employee
        )

    def test_employee_can_list_notes(self):
        response = self.api_client.get(
            "/api/notes/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        results = response.data.get(
            "results",
            response.data,
        )

        note_ids = [
            note["id"]
            for note in results
        ]

        self.assertIn(
            self.note.id,
            note_ids,
        )

    def test_employee_can_retrieve_note(self):
        response = self.api_client.get(
            (
                f"/api/notes/"
                f"{self.note.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            response.data["id"],
            self.note.id,
        )

        self.assertEqual(
            response.data["content"],
            self.note.content,
        )

        self.assertEqual(
            response.data["author"],
            self.admin.id,
        )

        self.assertEqual(
            response.data["client"],
            self.client_user.id,
        )

    def test_employee_can_create_note(self):
        response = self.api_client.post(
            "/api/notes/",
            {
                "author": self.admin.id,
                "client": self.client_user.id,
                "content": (
                    "Nouvelle note créée "
                    "par un employé."
                ),
                "pinned": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        note = Note.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            note.author,
            self.employee,
        )

        self.assertEqual(
            note.client,
            self.client_user,
        )

        self.assertEqual(
            note.content,
            (
                "Nouvelle note créée "
                "par un employé."
            ),
        )

        self.assertTrue(
            note.pinned
        )

    def test_employee_can_update_note(self):
        response = self.api_client.patch(
            (
                f"/api/notes/"
                f"{self.note.id}/"
            ),
            {
                "author": self.employee.id,
                "content": (
                    "Note interne mise à jour "
                    "par un employé."
                ),
                "pinned": True,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.note.refresh_from_db()

        self.assertEqual(
            self.note.content,
            (
                "Note interne mise à jour "
                "par un employé."
            ),
        )

        self.assertTrue(
            self.note.pinned
        )

        self.assertEqual(
            self.note.author,
            self.admin,
        )

    def test_employee_cannot_delete_note(self):
        response = self.api_client.delete(
            (
                f"/api/notes/"
                f"{self.note.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Note.objects.filter(
                pk=self.note.id
            ).exists()
        )

    def test_client_cannot_list_notes(self):
        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.get(
            "/api/notes/"
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_client_cannot_retrieve_note(self):
        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.get(
            (
                f"/api/notes/"
                f"{self.note.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_client_cannot_create_note(self):
        self.api_client.force_authenticate(
            user=self.client_user
        )

        initial_count = Note.objects.count()

        response = self.api_client.post(
            "/api/notes/",
            {
                "client": self.client_user.id,
                "content": (
                    "Tentative de création "
                    "par un client."
                ),
                "pinned": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertEqual(
            Note.objects.count(),
            initial_count,
        )