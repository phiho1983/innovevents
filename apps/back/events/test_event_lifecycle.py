from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from .models import Event


User = get_user_model()


class EventLifecycleTest(TestCase):
    def setUp(self):
        self.api_client = APIClient()

        self.admin = User.objects.create_user(
            username="lifecycle_admin",
            email="lifecycle.admin@test.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.employee = User.objects.create_user(
            username="lifecycle_employee",
            email="lifecycle.employee@test.local",
            password="EmployeePassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        self.client_user = User.objects.create_user(
            username="lifecycle_client",
            email="lifecycle.client@test.local",
            password="ClientPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
            is_superuser=False,
            email_verified=True,
        )

        start_at = (
            timezone.now()
            + timedelta(days=30)
        )

        end_at = (
            start_at
            + timedelta(hours=4)
        )

        self.accepted_event = Event.objects.create(
            title="ACCEPTED PRIVATE EVENT",
            city="Paris",
            start_at=start_at,
            end_at=end_at,
            capacity=50,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.ACCEPTED,
            visible=False,
            client_agreed=False,
        )

        self.in_progress_event = Event.objects.create(
            title="IN PROGRESS PRIVATE EVENT",
            city="Lyon",
            start_at=start_at,
            end_at=end_at,
            capacity=40,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.IN_PROGRESS,
            visible=False,
            client_agreed=False,
        )

        self.draft_event = Event.objects.create(
            title="DRAFT PRIVATE EVENT",
            city="Lille",
            start_at=start_at,
            end_at=end_at,
            capacity=30,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.DRAFT,
            visible=False,
            client_agreed=False,
        )

        self.done_event = Event.objects.create(
            title="DONE PRIVATE EVENT",
            city="Bordeaux",
            start_at=start_at,
            end_at=end_at,
            capacity=20,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.DONE,
            visible=False,
            client_agreed=False,
        )

        self.showcase_event = Event.objects.create(
            title="SHOWCASE EVENT",
            city="Nice",
            start_at=start_at,
            end_at=end_at,
            capacity=100,
            organizer=self.admin,
            status=Event.Status.ACCEPTED,
            visible=True,
            client_agreed=True,
        )

    def test_admin_can_start_accepted_private_event(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.accepted_event.id}/start/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.accepted_event.refresh_from_db()

        self.assertEqual(
            self.accepted_event.status,
            Event.Status.IN_PROGRESS,
        )

    def test_admin_can_complete_in_progress_private_event(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.in_progress_event.id}/complete/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.in_progress_event.refresh_from_db()

        self.assertEqual(
            self.in_progress_event.status,
            Event.Status.DONE,
        )

    def test_employee_can_start_accepted_private_event(self):
        self.api_client.force_authenticate(
            user=self.employee
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.accepted_event.id}/start/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.accepted_event.refresh_from_db()

        self.assertEqual(
            self.accepted_event.status,
            Event.Status.IN_PROGRESS,
        )

    def test_employee_can_complete_in_progress_private_event(self):
        self.api_client.force_authenticate(
            user=self.employee
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.in_progress_event.id}/complete/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.in_progress_event.refresh_from_db()

        self.assertEqual(
            self.in_progress_event.status,
            Event.Status.DONE,
        )

    def test_draft_event_cannot_be_started(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.draft_event.id}/start/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.draft_event.refresh_from_db()

        self.assertEqual(
            self.draft_event.status,
            Event.Status.DRAFT,
        )

    def test_accepted_event_cannot_be_completed_directly(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.accepted_event.id}/complete/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.accepted_event.refresh_from_db()

        self.assertEqual(
            self.accepted_event.status,
            Event.Status.ACCEPTED,
        )

    def test_done_event_cannot_be_started_again(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.done_event.id}/start/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.done_event.refresh_from_db()

        self.assertEqual(
            self.done_event.status,
            Event.Status.DONE,
        )

    def test_client_cannot_start_event(self):
        self.api_client.force_authenticate(
            user=self.client_user
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.accepted_event.id}/start/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_showcase_event_cannot_enter_client_lifecycle(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.post(
            (
                f"/api/events/"
                f"{self.showcase_event.id}/start/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.showcase_event.refresh_from_db()

        self.assertEqual(
            self.showcase_event.status,
            Event.Status.ACCEPTED,
        )

    def test_admin_cannot_bypass_lifecycle_with_status_patch(self):
        self.api_client.force_authenticate(
            user=self.admin
        )

        response = self.api_client.patch(
            (
                f"/api/events/"
                f"{self.accepted_event.id}/"
            ),
            {
                "status": Event.Status.DONE,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.accepted_event.refresh_from_db()

        self.assertEqual(
            self.accepted_event.status,
            Event.Status.ACCEPTED,
        )