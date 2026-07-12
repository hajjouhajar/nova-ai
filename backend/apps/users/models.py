from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    preferred_tone = models.CharField(max_length=20, default='formel')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profil de {self.user.username}"


class LearningProfile(models.Model):
    LEVEL_CHOICES = [
        ('beginner', 'Complete Beginner'),
        ('some_experience', 'Some Experience'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learning_profile')
    domain = models.CharField(max_length=255)
    niveau = models.CharField(max_length=30)
    disponibilite = models.CharField(max_length=20)
    langue = models.CharField(max_length=20, default='French')
    career = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)