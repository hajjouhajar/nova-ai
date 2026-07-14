import logging
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from pgvector.django import L2Distance
from .models import Document, DocumentChunk
from .utils import extraire_texte, decouper_en_chunks, generer_embedding

logger = logging.getLogger(__name__)


class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        fichier = request.FILES.get("fichier")
        if not fichier:
            return Response({"detail": "Aucun fichier envoyé"}, status=400)

        extension = fichier.name.split(".")[-1].lower()

        # ✅ FIX: Extraire le texte AVANT de sauvegarder en DB
        # car après create(), le curseur du fichier est à la fin
        erreur_detail = None
        try:
            # Remettre le curseur au début au cas où
            fichier.seek(0)
            texte = extraire_texte(fichier, extension)
            chunks = decouper_en_chunks(texte)
            logger.info(f"Texte extrait: {len(texte)} chars, {len(chunks)} chunks pour {fichier.name}")
        except Exception as e:
            logger.error(f"Erreur extraction texte: {e}")
            texte = ""
            chunks = []
            erreur_detail = str(e)

        # Remettre le curseur à 0 pour que Django puisse sauvegarder le fichier
        fichier.seek(0)
        doc = Document.objects.create(
            user=request.user,
            nom_fichier=fichier.name,
            type_fichier=extension,
            chemin_stockage=fichier,
        )

        try:
            for i, chunk_texte in enumerate(chunks):
                vecteur = generer_embedding(chunk_texte)
                DocumentChunk.objects.create(
                    document=doc, contenu=chunk_texte, embedding=vecteur, ordre=i
                )
            doc.statut = "traite" if chunks else "erreur"
        except Exception as e:
            logger.error(f"Erreur création chunks/embeddings: {e}")
            doc.statut = "erreur"
            erreur_detail = str(e)
        doc.save()

        reponse = {"id": doc.id, "nom_fichier": doc.nom_fichier, "statut": doc.statut, "chunks_crees": doc.chunks.count()}
        if erreur_detail:
            reponse["erreur_detail"] = erreur_detail
        return Response(reponse, status=201)


class DocumentAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, document_id):
        import requests as http_requests

        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "Question vide"}, status=400)

        # Vérifier que le document a des chunks
        total_chunks = DocumentChunk.objects.filter(
            document_id=document_id, document__user=request.user
        ).count()

        if total_chunks == 0:
            return Response({
                "detail": "Ce document n'a pas de chunks. Réessayez de l'uploader.",
                "extraits_utilises": 0
            }, status=400)

        try:
            vecteur_question = generer_embedding(question)
        except Exception as e:
            logger.error(f"Erreur embedding question: {e}")
            return Response({"detail": f"Erreur Ollama embeddings: {e}"}, status=500)

        chunks_pertinents = list(
            DocumentChunk.objects
            .filter(document_id=document_id, document__user=request.user)
            .order_by(L2Distance("embedding", vecteur_question))[:3]
        )

        contexte = "\n\n".join(c.contenu for c in chunks_pertinents)

        prompt = f"""Voici des extraits pertinents d'un document :

{contexte}

En te basant UNIQUEMENT sur ces extraits, réponds à cette question : {question}"""

        try:
            r = http_requests.post("http://localhost:11434/api/generate", json={
                "model": "mistral:7b-instruct-q4_0",
                "prompt": prompt,
                "stream": False,
            }, timeout=120)
            r.raise_for_status()
            reponse = r.json().get("response", "").strip()
        except Exception as e:
            logger.error(f"Erreur Ollama generate: {e}")
            return Response({"detail": f"Erreur Ollama: {e}"}, status=500)

        return Response({"reponse": reponse, "extraits_utilises": len(chunks_pertinents)})