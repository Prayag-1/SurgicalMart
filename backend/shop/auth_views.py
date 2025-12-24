from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists():
            return Response({"detail": "User already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=email, email=email, password=password)
        return Response({"id": user.id, "email": user.email}, status=status.HTTP_201_CREATED)
