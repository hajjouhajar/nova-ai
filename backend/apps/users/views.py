from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import LearningProfile
from .serializers import RegisterSerializer, LearningProfileSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LearningProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LearningProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)

    def get(self, request):
        try:
            profile = request.user.learning_profile
            return Response(LearningProfileSerializer(profile).data)
        except LearningProfile.DoesNotExist:
            return Response({"detail": "Aucun profil trouvé"}, status=404)