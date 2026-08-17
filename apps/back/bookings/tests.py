from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import connections
from django.test import TestCase, TransactionTestCase
from django.utils import timezone

from rest_framework.test import APIClient

from events.models import Event

from .models import Booking


User = get_user_model()


class BookingAPITest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="booking_admin",
            password="TestPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
        )

        self.employee = User.objects.create_user(
            username="booking_employee",
            password="TestPassword123!",
            role=User.Role.EMPLOYEE,
            is_staff=False,
        )

        self.client1 = User.objects.create_user(
            username="booking_client1",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
        )

        self.client2 = User.objects.create_user(
            username="booking_client2",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
        )

        start_at = (
            timezone.now()
            + timedelta(days=10)
        )

        self.event = Event.objects.create(
            title="BOOKING PUBLIC EVENT",
            city="Paris",
            start_at=start_at,
            end_at=start_at + timedelta(hours=2),
            capacity=5,
            organizer=self.admin,
            status=Event.Status.ACCEPTED,
            visible=True,
            client_agreed=True,
        )

        self.draft_event = Event.objects.create(
            title="BOOKING DRAFT EVENT",
            city="Paris",
            start_at=start_at,
            end_at=start_at + timedelta(hours=2),
            capacity=5,
            organizer=self.admin,
            status=Event.Status.DRAFT,
            visible=False,
            client_agreed=False,
        )

    def api_for(self, user):
        client = APIClient()

        client.force_authenticate(
            user=user
        )

        return client

    def test_client_cannot_book_more_than_capacity(self):
        client = self.api_for(
            self.client1
        )

        response = client.post(
            "/api/bookings/",
            {
                "event": self.event.id,
                "quantity": 6,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_client_can_create_valid_booking(self):
        client = self.api_for(
            self.client1
        )

        response = client.post(
            "/api/bookings/",
            {
                "event": self.event.id,
                "quantity": 3,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        self.assertEqual(
            self.event.remaining_capacity(),
            2,
        )

    def test_client_cannot_book_private_draft_event(self):
        client = self.api_for(
            self.client1
        )

        response = client.post(
            "/api/bookings/",
            {
                "event": self.draft_event.id,
                "quantity": 1,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            400,
        )

        self.assertIn(
            "event",
            response.data,
        )

    def test_booking_payload_cannot_inject_user_or_status(self):
        client = self.api_for(
            self.client1
        )

        response = client.post(
            "/api/bookings/",
            {
                "event": self.event.id,
                "quantity": 1,
                "user": self.client2.id,
                "status": Booking.Status.CONFIRMED,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            201,
        )

        booking = Booking.objects.get(
            pk=response.data["id"]
        )

        self.assertEqual(
            booking.user,
            self.client1,
        )

        self.assertEqual(
            booking.status,
            Booking.Status.PENDING,
        )

    def test_client_cannot_access_other_clients_booking(self):
        booking = Booking.objects.create(
            user=self.client2,
            event=self.event,
            quantity=1,
        )

        client = self.api_for(
            self.client1
        )

        response = client.get(
            f"/api/bookings/{booking.id}/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_cancel_releases_capacity(self):
        booking = Booking.objects.create(
            user=self.client1,
            event=self.event,
            quantity=3,
        )

        self.assertEqual(
            self.event.remaining_capacity(),
            2,
        )

        client = self.api_for(
            self.client1
        )

        response = client.post(
            f"/api/bookings/{booking.id}/cancel/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        self.assertEqual(
            self.event.remaining_capacity(),
            5,
        )

    def test_employee_cannot_confirm_booking(self):
        booking = Booking.objects.create(
            user=self.client1,
            event=self.event,
            quantity=1,
        )

        client = self.api_for(
            self.employee
        )

        response = client.post(
            f"/api/bookings/{booking.id}/confirm/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            403,
        )

    def test_admin_can_confirm_booking(self):
        booking = Booking.objects.create(
            user=self.client1,
            event=self.event,
            quantity=1,
        )

        client = self.api_for(
            self.admin
        )

        response = client.post(
            f"/api/bookings/{booking.id}/confirm/",
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            200,
        )

        booking.refresh_from_db()

        self.assertEqual(
            booking.status,
            Booking.Status.CONFIRMED,
        )


class BookingConcurrencyTest(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        self.admin = User.objects.create_user(
            username="concurrency_admin",
            password="TestPassword123!",
            role=User.Role.ADMIN,
            is_staff=False,
        )

        self.client1 = User.objects.create_user(
            username="concurrency_client1",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
        )

        self.client2 = User.objects.create_user(
            username="concurrency_client2",
            password="TestPassword123!",
            role=User.Role.CLIENT,
            is_staff=False,
        )

        start_at = (
            timezone.now()
            + timedelta(days=10)
        )

        self.event = Event.objects.create(
            title="CONCURRENCY EVENT",
            city="Paris",
            start_at=start_at,
            end_at=start_at + timedelta(hours=2),
            capacity=1,
            organizer=self.admin,
            status=Event.Status.ACCEPTED,
            visible=True,
            client_agreed=True,
        )

    def create_booking(self, user_id):
        """
        Chaque worker possède sa propre connexion
        PostgreSQL.

        On ferme explicitement toutes les connexions
        du thread dans finally afin qu'aucune session
        ne reste attachée à test_innovevents lorsque
        Django détruit la base de test.
        """

        connections.close_all()

        try:
            user = User.objects.get(
                pk=user_id
            )

            client = APIClient()

            client.force_authenticate(
                user=user
            )

            response = client.post(
                "/api/bookings/",
                {
                    "event": self.event.id,
                    "quantity": 1,
                },
                format="json",
            )

            return response.status_code

        finally:
            connections.close_all()

    def test_concurrent_bookings_do_not_overbook_event(self):
        client_ids = [
            self.client1.id,
            self.client2.id,
        ]

        with ThreadPoolExecutor(
            max_workers=2
        ) as executor:
            results = list(
                executor.map(
                    self.create_booking,
                    client_ids,
                )
            )

        self.assertEqual(
            sorted(results),
            [201, 400],
        )

        total_reserved = sum(
            Booking.objects.filter(
                event=self.event,
                status__in=[
                    Booking.Status.PENDING,
                    Booking.Status.CONFIRMED,
                ],
            ).values_list(
                "quantity",
                flat=True,
            )
        )

        self.assertEqual(
            total_reserved,
            1,
        )