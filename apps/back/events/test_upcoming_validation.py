from django.test import TestCase


class UpcomingQueryParameterTests(
    TestCase
):
    def assert_invalid_upcoming(
        self,
        value,
    ):
        response = self.client.get(
            "/api/events/",
            {
                "upcoming": value,
            },
        )

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_upcoming_rejects_non_integer(
        self,
    ):
        self.assert_invalid_upcoming(
            "abc"
        )

    def test_upcoming_rejects_zero(
        self,
    ):
        self.assert_invalid_upcoming(
            "0"
        )

    def test_upcoming_rejects_negative_value(
        self,
    ):
        self.assert_invalid_upcoming(
            "-1"
        )

    def test_upcoming_rejects_value_above_50(
        self,
    ):
        self.assert_invalid_upcoming(
            "51"
        )

    def test_upcoming_accepts_valid_value(
        self,
    ):
        response = self.client.get(
            "/api/events/",
            {
                "upcoming": "5",
            },
        )

        self.assertEqual(
            response.status_code,
            200,
        )
