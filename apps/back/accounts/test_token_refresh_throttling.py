from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings

from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()

REFRESH_LIMIT = 30
CLIENT_IP = "192.0.2.10"
OTHER_IP = "192.0.2.20"


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "test-token-refresh-throttling",
        }
    }
)
class TokenRefreshThrottlingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.addCleanup(cache.clear)

        timer_patch = patch(
            "rest_framework.throttling.SimpleRateThrottle.timer",
            return_value=1_000_000.0,
        )
        self.throttle_clock = timer_patch.start()
        self.addCleanup(timer_patch.stop)

        self.user = User.objects.create_user(
            username="refresh_throttle_user",
            email="refresh-throttle@example.com",
            password="RefreshTestPassword123!",
            email_verified=True,
            is_active=True,
        )
        self.refresh_token = str(RefreshToken.for_user(self.user))

    def post_refresh(self, *, token=None, ip=CLIENT_IP):
        return self.client.post(
            "/api/token/refresh/",
            {
                "refresh": self.refresh_token if token is None else token,
            },
            format="json",
            REMOTE_ADDR=ip,
        )

    def fill_quota(
        self,
        *,
        token=None,
        ip=CLIENT_IP,
        expected_status=status.HTTP_200_OK,
    ):
        for attempt in range(REFRESH_LIMIT):
            response = self.post_refresh(token=token, ip=ip)
            self.assertEqual(
                response.status_code,
                expected_status,
                f"Request {attempt + 1}: {response.data}",
            )

    def assert_throttled(self, response):
        self.assertEqual(
            response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            response.data,
        )
        self.assertIn("Retry-After", response.headers)

        retry_after = int(response.headers["Retry-After"])

        self.assertGreater(retry_after, 0)
        self.assertLessEqual(retry_after, 60)

    def test_valid_refresh_returns_working_access_token(self):
        response = self.post_refresh()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

        me_response = self.client.get(
            "/api/me/",
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}",
            REMOTE_ADDR=CLIENT_IP,
        )

        self.assertEqual(me_response.status_code, status.HTTP_200_OK)

    def test_valid_refresh_requests_are_throttled(self):
        self.fill_quota()

        self.assert_throttled(self.post_refresh())

    def test_invalid_refresh_requests_are_also_throttled(self):
        self.fill_quota(
            token="not-a-valid-refresh-token",
            expected_status=status.HTTP_401_UNAUTHORIZED,
        )

        self.assert_throttled(
            self.post_refresh(token="not-a-valid-refresh-token")
        )

    def test_another_ip_can_refresh_when_first_ip_is_throttled(self):
        self.fill_quota(ip=CLIENT_IP)
        self.assert_throttled(self.post_refresh(ip=CLIENT_IP))

        response = self.post_refresh(ip=OTHER_IP)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_refresh_is_allowed_again_after_one_minute(self):
        self.fill_quota()
        self.assert_throttled(self.post_refresh())

        self.throttle_clock.return_value += 61

        response = self.post_refresh()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
