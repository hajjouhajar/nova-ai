from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Roadmap
from .serializers import RoadmapSerializer
from .templates_data import select_template


class RoadmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            roadmap = request.user.learning_profile.roadmap
            return Response(RoadmapSerializer(roadmap).data)
        except Roadmap.DoesNotExist:
            return Response({"detail": "Aucune roadmap générée"}, status=404)


class GenerateRoadmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.learning_profile
        except AttributeError:
            return Response({"detail": "Complétez d'abord l'onboarding"}, status=400)

        template = select_template(profile.domain)

        roadmap, created = Roadmap.objects.update_or_create(
            learning_profile=profile,
            defaults={"steps": template["steps"], "modules": template["modules"]},
        )
        return Response(RoadmapSerializer(roadmap).data, status=201)
