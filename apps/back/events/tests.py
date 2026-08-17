from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from rest_framework.test import APIClient

from .models import Event


User = get_user_model()


class EventAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_user(
            username="event_admin",
            password="TestPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
        )

        self.employee = User.objects.create_user(
            username="event_employee",
            password="TestPassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
        )

        self.client_user = User.objects.create_user(
            username="event_client",
            password="TestPassword123!",
            role=User.Role.CLIENT,

            # volontaire pour vérifier
            # que is_staff ne donne aucun droit métier
            is_staff=True,
        )

        start_at = (
            timezone.now()
            + timedelta(days=10)
        )

        end_at = (
            start_at
            + timedelta(hours=2)
        )

        self.public_event = Event.objects.create(
            title="PUBLIC EVENT",
            city="Paris",
            start_at=start_at,
            end_at=end_at,
            capacity=10,
            organizer=self.admin,
            status=Event.Status.ACCEPTED,
            visible=True,
            client_agreed=True,
        )

        self.draft_event = Event.objects.create(
            title="DRAFT EVENT",
            city="Paris",
            start_at=start_at,
            end_at=end_at,
            capacity=10,
            organizer=self.admin,
            status=Event.Status.DRAFT,
            visible=True,
            client_agreed=True,
        )

        self.invisible_event = Event.objects.create(
            title="INVISIBLE EVENT",
            city="Paris",
            start_at=start_at,
            end_at=end_at,
            capacity=10,
            organizer=self.admin,
            status=Event.Status.ACCEPTED,
            visible=False,
            client_agreed=True,
        )

        self.no_agreement_event = Event.objects.create(
            title="NO AGREEMENT EVENT",
            city="Paris",
            start_at=start_at,
            end_at=end_at,
            capacity=10,
            organizer=self.admin,
            status=Event.Status.ACCEPTED,
            visible=True,
            client_agreed=False,
        )

    def get_results(self, response):
        if isinstance(response.data, dict):
            return response.data.get(
                "results",
                []
            )

        return response.data

    def test_public_list_only_exposes_public_events(self):
        response = self.client.get(
            "/api/events/"
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        results = self.get_results(
            response
        )

        titles = {
            event["title"]
            for event in results
        }

        self.assertIn(
            "PUBLIC EVENT",
            titles,
        )

        self.assertNotIn(
            "DRAFT EVENT",
            titles,
        )

        self.assertNotIn(
            "INVISIBLE EVENT",
            titles,
        )

        self.assertNotIn(
            "NO AGREEMENT EVENT",
            titles,
        )

    def test_public_serializer_hides_internal_fields(self):
        response = self.client.get(
            "/api/events/"
        )

        results = self.get_results(
            response
        )

        public_event = next(
            item
            for item in results
            if item["title"] == "PUBLIC EVENT"
        )

        forbidden_fields = {
            "organizer",
            "client",
            "status",
            "visible",
            "client_agreed",
            "created_at",
        }

        for field in forbidden_fields:
            self.assertNotIn(
                field,
                public_event,
            )

    def test_public_cannot_retrieve_draft_event(self):
        response = self.client.get(
            f"/api/events/{self.draft_event.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_public_cannot_retrieve_invisible_event(self):
        response = self.client.get(
            f"/api/events/{self.invisible_event.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_public_cannot_retrieve_event_without_agreement(self):
        response = self.client.get(
            f"/api/events/{self.no_agreement_event.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_admin_without_is_staff_can_create_event(self):
        self.client.force_authenticate(
            user=self.admin
        )

        start_at = (
            timezone.now()
            + timedelta(days=20)
        )

        response = self.client.post(
            "/api/events/",
            {
                "title": "ADMIN CREATED EVENT",
                "city": "Lyon",
                "start_at": start_at.isoformat(),
                "end_at": (
                    start_at
                    + timedelta(hours=2)
                ).isoformat(),
                "capacity": 20,
                "event_type": "OTHER",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        event = Event.objects.get(
            title="ADMIN CREATED EVENT"
        )

        self.assertEqual(
            event.organizer,
            self.admin,
        )

    def test_employee_cannot_create_event(self):
        self.client.force_authenticate(
            user=self.employee
        )

        start_at = (
            timezone.now()
            + timedelta(days=20)
        )

        response = self.client.post(
            "/api/events/",
            {
                "title": "EMPLOYEE EVENT",
                "city": "Paris",
                "start_at": start_at.isoformat(),
                "capacity": 10,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_client_with_is_staff_cannot_create_event(self):
        self.client.force_authenticate(
            user=self.client_user
        )

        start_at = (
            timezone.now()
            + timedelta(days=20)
        )

        response = self.client.post(
            "/api/events/",
            {
                "title": "CLIENT EVENT",
                "city": "Paris",
                "start_at": start_at.isoformat(),
                "capacity": 10,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_end_date_must_be_after_start_date(self):
        self.client.force_authenticate(
            user=self.admin
        )

        start_at = (
            timezone.now()
            + timedelta(days=20)
        )

        response = self.client.post(
            "/api/events/",
            {
                "title": "BAD DATE EVENT",
                "city": "Paris",
                "start_at": start_at.isoformat(),
                "end_at": (
                    start_at
                    - timedelta(hours=1)
                ).isoformat(),
                "capacity": 10,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "end_at",
            response.data,
        )

    def test_capacity_must_be_positive(self):
        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            "/api/events/",
            {
                "title": "ZERO CAPACITY EVENT",
                "city": "Paris",
                "start_at": (
                    timezone.now()
                    + timedelta(days=20)
                ).isoformat(),
                "capacity": 0,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "capacity",
            response.data,
        )