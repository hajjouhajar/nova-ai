from django.db import models
from django.contrib.auth.models import User
from pgvector.django import VectorField


class Document(models.Model):
    STATUT_CHOICES = [
        ("en_attente", "En attente"),
        ("traite", "Traité"),
        ("erreur", "Erreur"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    nom_fichier = models.CharField(max_length=255)
    type_fichier = models.CharField(max_length=20)
    chemin_stockage = models.FileField(upload_to='documents/')
    date_upload = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default="en_attente")

    def __str__(self):
        return self.nom_fichier


class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    contenu = models.TextField()
    embedding = VectorField(dimensions=768)
    ordre = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordre']

    def __str__(self):
        return f"Chunk {self.ordre} de {self.document.nom_fichier}"