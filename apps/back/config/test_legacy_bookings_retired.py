from django.apps import apps
from django.test import SimpleTestCase


class LegacyBookingsRetirementTests(
    SimpleTestCase
):
    def test_booking_api_is_not_exposed(
        self,
    ):
        response = self.client.get(
            "/api/bookings/"
        )

        self.assertEqual(
            response.status_code,
            404,
        )

    def test_booking_model_is_not_registered(
        self,
    ):
        with self.assertRaises(
            LookupError
        ):
            apps.get_model(
                "bookings",
                "Booking",
            )
