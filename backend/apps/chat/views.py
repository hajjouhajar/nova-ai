from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.ai.ollama import OllamaError, generate
from .models import ChatHistory
from .serializers import ChatHistorySerializer


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = request.user.chat_history.all()[:50]
        return Response(ChatHistorySerializer(history, many=True).data)

    def post(self, request):
        message = request.data.get("message", "").strip()
        if not message:
            return Response({"detail": "Message vide"}, status=400)

        try:
            answer = generate(message, system="Tu es Nova, un assistant pédagogique utile. Réponds dans la langue de l'utilisateur.")
        except OllamaError as exc:
            return Response({"detail": str(exc)}, status=503)

        chat = ChatHistory.objects.create(user=request.user, message=message, reponse=answer)
        return Response(ChatHistorySerializer(chat).data, status=201)
