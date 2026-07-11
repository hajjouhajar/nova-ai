import random
from django.db import models
from django.contrib.auth.models import User

COLOR_PALETTE = ["#1E3A8A", "#0F766E", "#6D28D9", "#B45309", "#0369A1", "#BE123C", "#4D7C0F"]


class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, blank=True)
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.color:
            self.color = random.choice(COLOR_PALETTE)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Task(models.Model):
    STATUS_CHOICES = [
        ('à faire', 'À faire'),
        ('en cours', 'En cours'),
        ('terminé', 'Terminé'),
    ]
    PRIORITY_CHOICES = [
        ('haute', 'Haute'),
        ('moyenne', 'Moyenne'),
        ('basse', 'Basse'),
    ]
    CATEGORY_CHOICES = [
        ('Learning', 'Learning'), ('Project', 'Project'), ('Reading', 'Reading'),
        ('Code', 'Code'), ('Exercises', 'Exercises'), ('Other', 'Other'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Other')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='à faire')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='moyenne')
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title