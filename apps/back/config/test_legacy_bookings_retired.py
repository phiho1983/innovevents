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
