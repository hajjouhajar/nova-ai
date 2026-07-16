from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Roadmap
from .serializers import RoadmapSerializer
from .generator import generate_roadmap


class RoadmapView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            roadmap = request.user.learning_profile.roadmap
            # Legacy roadmaps were created with empty modules for most domains.
            # Regenerate them on first read so the Courses page is never empty.
            if not roadmap.modules:
                roadmap_data = generate_roadmap(request.user.learning_profile)
                roadmap.steps = roadmap_data["steps"]
                roadmap.modules = roadmap_data["modules"]
                roadmap.save(update_fields=["steps", "modules"])
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

        roadmap_data = generate_roadmap(profile)

        roadmap, created = Roadmap.objects.update_or_create(
            learning_profile=profile,
            defaults={"steps": roadmap_data["steps"], "modules": roadmap_data["modules"]},
        )
        return Response(RoadmapSerializer(roadmap).data, status=201)
