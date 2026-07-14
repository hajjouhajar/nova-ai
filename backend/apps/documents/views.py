from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from pgvector.django import L2Distance
from .models import Document, DocumentChunk
from .utils import extraire_texte, decouper_en_chunks, generer_embedding


class DocumentUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        fichier = request.FILES.get("fichier")
        if not fichier:
            return Response({"detail": "Aucun fichier envoyé"}, status=400)

        extension = fichier.name.split(".")[-1].lower()
        doc = Document.objects.create(
            user=request.user,
            nom_fichier=fichier.name,
            type_fichier=extension,
            chemin_stockage=fichier,
        )

        try:
            texte = extraire_texte(fichier, extension)
            chunks = decouper_en_chunks(texte)
            if not chunks:
                doc.statut = "erreur"
            else:
                for i, chunk_texte in enumerate(chunks):
                    vecteur = generer_embedding(chunk_texte)
                    DocumentChunk.objects.create(
                        document=doc, contenu=chunk_texte, embedding=vecteur, ordre=i
                    )
                doc.statut = "traite"
        except Exception:
            doc.statut = "erreur"
        doc.save()

        return Response({"id": doc.id, "nom_fichier": doc.nom_fichier, "statut": doc.statut}, status=201)

class DocumentAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, document_id):
        question = request.data.get("question", "").strip()
        if not question:
            return Response({"detail": "Question vide"}, status=400)

        vecteur_question = generer_embedding(question)

        chunks_pertinents = (
            DocumentChunk.objects
            .filter(document_id=document_id, document__user=request.user)
            .order_by(L2Distance("embedding", vecteur_question))[:3]
        )

        contexte = "\n\n".join(c.contenu for c in chunks_pertinents)

        prompt = f"""Voici des extraits pertinents d'un document :

{contexte}

En te basant UNIQUEMENT sur ces extraits, réponds à cette question : {question}"""

        import requests
        r = requests.post("http://localhost:11434/api/generate", json={
            "model": "mistral:7b-instruct-q4_0",
            "prompt": prompt,
            "stream": False,
        }, timeout=60)
        reponse = r.json().get("response", "").strip()

        return Response({"reponse": reponse, "extraits_utilises": len(chunks_pertinents)})