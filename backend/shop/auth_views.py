from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()


class AdminOnlyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Restrict JWT issuance to staff/superusers only.
    """

    def _authenticate(self, identifier: str, password: str):
        """
        Allow login via username or email by attempting both.
        """
        user = authenticate(username=identifier, password=password)

        if user:
            return user

        # Try resolving by email
        try:
            user_obj = User.objects.get(email__iexact=identifier)
        except User.DoesNotExist:
            return None

        return authenticate(username=user_obj.get_username(), password=password)

    def validate(self, attrs):
        identifier = attrs.get(self.username_field) or attrs.get("email")
        password = attrs.get("password")

        if not identifier or not password:
            raise AuthenticationFailed("Invalid credentials", code="invalid_credentials")

        user = self._authenticate(identifier, password)
        if not user:
            raise AuthenticationFailed("Invalid credentials", code="invalid_credentials")

        if not user.is_active:
            raise AuthenticationFailed("Admin account inactive.", code="inactive_admin")

        # Only allow admin users to obtain tokens
        if not user.is_staff:
            raise AuthenticationFailed("Admin access required.", code="admin_only")

        refresh = self.get_token(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminOnlyTokenObtainPairSerializer
