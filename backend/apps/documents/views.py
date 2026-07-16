from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from pgvector.django import L2Distance

from apps.ai.ollama import OllamaError, generate
from .models import Document, DocumentChunk
from .utils import extraire_texte, decouper_en_chunks, generer_embedding


class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        fichier = request.FILES.get("fichier")
        if not fichier:
            return Response({"detail": "Aucun fichier envoyé"}, status=400)

        extension = fichier.name.rsplit(".", 1)[-1].lower() if "." in fichier.name else ""
        if extension not in {"pdf", "docx", "txt", "md"}:
            return Response({"detail": "Format non pris en charge : PDF, DOCX, TXT ou MD."}, status=400)
        doc = Document.objects.create(user=request.user, nom_fichier=fichier.name, type_fichier=extension, chemin_stockage=fichier)
        try:
            fichier.seek(0)
            chunks = decouper_en_chunks(extraire_texte(fichier, extension))
            if not chunks:
                raise ValueError("Aucun texte lisible n'a été trouvé dans le document.")
            for index, chunk in enumerate(chunks):
                DocumentChunk.objects.create(document=doc, contenu=chunk, embedding=generer_embedding(chunk), ordre=index)
            doc.statut = "traite"
            doc.save(update_fields=["statut"])
        except Exception as exc:
            doc.statut = "erreur"
            doc.save(update_fields=["statut"])
            return Response({"id": doc.id, "nom_fichier": doc.nom_fichier, "statut": doc.statut, "detail": str(exc)}, status=422)
        return Response({"id": doc.id, "nom_fichier": doc.nom_fichier, "statut": doc.statut}, status=201)


class DocumentAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, document_id):
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "Question vide"}, status=400)
        try:
            vector = generer_embedding(question)
        except OllamaError as exc:
            return Response({"detail": str(exc)}, status=503)
        chunks = DocumentChunk.objects.filter(document_id=document_id, document__user=request.user).order_by(L2Distance("embedding", vector))[:3]
        context = "\n\n".join(chunk.contenu for chunk in chunks)
        if not context:
            return Response({"detail": "Aucun contenu exploitable n'a été trouvé dans ce document."}, status=422)
        prompt = f"Voici des extraits d'un document :\n\n{context}\n\nRéponds uniquement à partir de ces extraits. Question : {question}"
        try:
            answer = generate(prompt, system="Réponds uniquement à partir du contexte fourni.")
        except OllamaError as exc:
            return Response({"detail": str(exc)}, status=503)
        return Response({"reponse": answer, "extraits_utilises": len(chunks)})
