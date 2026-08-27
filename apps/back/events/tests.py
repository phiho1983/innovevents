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

        self.other_client_user = User.objects.create_user(
            username="event_other_client",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
        )

        start_at = (
            timezone.now()
            + timedelta(days=10)
        )

        end_at = (
            start_at
            + timedelta(hours=2)
        )

        # -------------------------------------------------
        # ÉVÉNEMENTS VITRINE / PUBLICS
        # -------------------------------------------------

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

        # -------------------------------------------------
        # VRAIS ÉVÉNEMENTS MÉTIER PRIVÉS DES CLIENTS
        # -------------------------------------------------

        self.client_private_event = Event.objects.create(
            title="CLIENT PRIVATE EVENT",
            city="Lyon",
            start_at=start_at,
            end_at=end_at,
            capacity=40,
            organizer=self.admin,
            client=self.client_user,
            status=Event.Status.DRAFT,
            visible=False,
            client_agreed=False,
        )

        self.other_client_private_event = Event.objects.create(
            title="OTHER CLIENT PRIVATE EVENT",
            city="Marseille",
            start_at=start_at,
            end_at=end_at,
            capacity=30,
            organizer=self.admin,
            client=self.other_client_user,
            status=Event.Status.DRAFT,
            visible=False,
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

        self.assertNotIn(
            "CLIENT PRIVATE EVENT",
            titles,
        )

        self.assertNotIn(
            "OTHER CLIENT PRIVATE EVENT",
            titles,
        )

    def test_authenticated_client_public_list_stays_showcase_only(self):
        self.client.force_authenticate(
            user=self.client_user
        )

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
            "CLIENT PRIVATE EVENT",
            titles,
        )

        self.assertNotIn(
            "OTHER CLIENT PRIVATE EVENT",
            titles,
        )

    def test_client_can_list_only_own_private_events(self):
        self.client.force_authenticate(
            user=self.client_user
        )

        response = self.client.get(
            "/api/events/mine/"
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
            "CLIENT PRIVATE EVENT",
            titles,
        )

        self.assertNotIn(
            "OTHER CLIENT PRIVATE EVENT",
            titles,
        )

        self.assertNotIn(
            "PUBLIC EVENT",
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

    def test_employee_can_create_event(self):
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
                "title": "EMPLOYEE CREATED EVENT",
                "city": "Paris",
                "start_at": start_at.isoformat(),
                "end_at": (
                    start_at
                    + timedelta(hours=3)
                ).isoformat(),
                "capacity": 60,
                "event_type": "CONFERENCE",
                "client": self.client_user.id,
                "visible": False,
                "client_agreed": False,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        event = Event.objects.get(
            title="EMPLOYEE CREATED EVENT"
        )

        self.assertEqual(
            event.organizer,
            self.employee,
        )

        self.assertEqual(
            event.client,
            self.client_user,
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

    def test_employee_can_partially_update_event(self):
        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.patch(
            (
                f"/api/events/"
                f"{self.client_private_event.id}/"
            ),
            {
                "title": "EMPLOYEE UPDATED EVENT",
                "city": "Nantes",
                "capacity": 55,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.client_private_event.refresh_from_db()

        self.assertEqual(
            self.client_private_event.title,
            "EMPLOYEE UPDATED EVENT",
        )

        self.assertEqual(
            self.client_private_event.city,
            "Nantes",
        )

        self.assertEqual(
            self.client_private_event.capacity,
            55,
        )

    def test_employee_can_fully_update_event(self):
        self.client.force_authenticate(
            user=self.employee
        )

        start_at = (
            timezone.now()
            + timedelta(days=25)
        )

        response = self.client.put(
            (
                f"/api/events/"
                f"{self.client_private_event.id}/"
            ),
            {
                "title": "EMPLOYEE FULL UPDATE",
                "description": "Événement modifié par un employé.",
                "city": "Bordeaux",
                "start_at": start_at.isoformat(),
                "end_at": (
                    start_at
                    + timedelta(hours=5)
                ).isoformat(),
                "capacity": 75,
                "event_type": "CONFERENCE",
                "theme": "Innovation",
                "visible": False,
                "client_agreed": False,
                "client": self.client_user.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.client_private_event.refresh_from_db()

        self.assertEqual(
            self.client_private_event.title,
            "EMPLOYEE FULL UPDATE",
        )

        self.assertEqual(
            self.client_private_event.city,
            "Bordeaux",
        )

        self.assertEqual(
            self.client_private_event.capacity,
            75,
        )

        self.assertEqual(
            self.client_private_event.client,
            self.client_user,
        )

    def test_employee_cannot_delete_event(self):
        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.delete(
            (
                f"/api/events/"
                f"{self.client_private_event.id}/"
            )
        )

        self.assertEqual(
            response.status_code,
            403,
        )

        self.assertTrue(
            Event.objects.filter(
                id=self.client_private_event.id
            ).exists()
        )

    def test_client_with_is_staff_cannot_update_event(self):
        self.client.force_authenticate(
            user=self.client_user
        )

        response = self.client.patch(
            (
                f"/api/events/"
                f"{self.client_private_event.id}/"
            ),
            {
                "title": "FORBIDDEN CLIENT UPDATE",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_employee_cannot_bypass_lifecycle_with_status_patch(self):
        self.client.force_authenticate(
            user=self.employee
        )

        response = self.client.patch(
            (
                f"/api/events/"
                f"{self.client_private_event.id}/"
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

        self.client_private_event.refresh_from_db()

        self.assertEqual(
            self.client_private_event.status,
            Event.Status.DRAFT,
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