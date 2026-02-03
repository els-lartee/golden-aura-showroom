from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import UserProfile


class UserProfileApiTests(APITestCase):
    def test_create_profile(self) -> None:
        user = get_user_model().objects.create_user(
            username="tester", email="tester@example.com", password="pass1234"
        )

        response = self.client.post(
            "/api/profiles/",
            {"user": user.id, "role": "customer", "phone": "+1234567890"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(UserProfile.objects.count(), 1)


class AuthApiTests(APITestCase):
    def test_register_login_logout(self) -> None:
        register_response = self.client.post(
            "/api/auth/register",
            {
                "username": "authuser",
                "email": "auth@example.com",
                "password": "pass12345",
            },
            format="json",
        )
        self.assertEqual(register_response.status_code, 201)

        login_response = self.client.post(
            "/api/auth/login",
            {"username": "authuser", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(login_response.status_code, 200)

        logout_response = self.client.post("/api/auth/logout", format="json")
        self.assertEqual(logout_response.status_code, 204)

    def test_password_reset(self) -> None:
        response = self.client.post(
            "/api/auth/password-reset",
            {"email": "reset@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_me_get_put(self) -> None:
        user = get_user_model().objects.create_user(
            username="meuser", email="me@example.com", password="pass1234"
        )
        self.client.force_authenticate(user=user)

        get_response = self.client.get("/api/me")
        self.assertEqual(get_response.status_code, 200)

        put_response = self.client.put(
            "/api/me",
            {
                "user": {"first_name": "Jane", "last_name": "Doe"},
                "profile": {"phone": "+123456789"},
            },
            format="json",
        )
        self.assertEqual(put_response.status_code, 200)
