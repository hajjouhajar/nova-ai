import requests
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ChatHistory
from .serializers import ChatHistorySerializer

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:7b-instruct-q4_0"


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
            r = requests.post(OLLAMA_URL, json={
                "model": OLLAMA_MODEL,
                "prompt": message,
                "stream": False,
            }, timeout=60)
            r.raise_for_status()
            reponse_texte = r.json().get("response", "").strip()
        except requests.RequestException:
            return Response(
                {"detail": "Ollama indisponible. Vérifiez qu'il tourne (ollama serve)."},
                status=503
            )

        chat = ChatHistory.objects.create(
            user=request.user, message=message, reponse=reponse_texte
        )
        return Response(ChatHistorySerializer(chat).data, status=201)