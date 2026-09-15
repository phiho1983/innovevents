from django.test import SimpleTestCase

from rest_framework.settings import api_settings
from rest_framework.test import APIRequestFactory

from .throttles import TokenRefreshRateThrottle


class ThrottleProxySecurityTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_num_proxies_defaults_to_zero_without_trusted_proxy(self):
        self.assertEqual(
            api_settings.NUM_PROXIES,
            0,
        )

    def test_forwarded_for_is_ignored_without_trusted_proxy(self):
        request = self.factory.get(
            "/",
            HTTP_X_FORWARDED_FOR="198.51.100.10",
            REMOTE_ADDR="127.0.0.1",
        )

        ident = (
            TokenRefreshRateThrottle()
            .get_ident(request)
        )

        self.assertEqual(
            ident,
            "127.0.0.1",
        )
