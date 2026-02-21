from django.contrib.auth import authenticate, get_user_model, login as django_login, logout as django_logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserProfile
from accounts.serializers import (
    AdminUserSerializer,
    MeSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)
from recommendations.scoring import merge_session_recommendations_into_user

User = get_user_model()


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        pre_auth_session_key = request.session.session_key
        if not pre_auth_session_key:
            request.session.save()
            pre_auth_session_key = request.session.session_key

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        merge_session_recommendations_into_user(pre_auth_session_key, user.id)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        pre_auth_session_key = request.session.session_key
        if not pre_auth_session_key:
            request.session.save()
            pre_auth_session_key = request.session.session_key

        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
        django_login(request, user)
        merge_session_recommendations_into_user(pre_auth_session_key, user.id)
        return Response(UserSerializer(user).data)


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    def post(self, request):
        django_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Password reset email queued"})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = MeSerializer({"user": request.user, "profile": profile})
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = MeSerializer(
            {"user": request.user, "profile": profile}, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SessionBootstrapView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        if not request.session.session_key:
            request.session.save()
        return Response(
            {"detail": "Session initialized", "session_key": request.session.session_key}
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        token = get_token(request)
        return Response({"detail": "CSRF cookie set", "csrfToken": token})
