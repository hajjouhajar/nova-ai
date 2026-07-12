from django.db import models
from apps.users.models import LearningProfile


class Roadmap(models.Model):
    learning_profile = models.OneToOneField(
        LearningProfile, on_delete=models.CASCADE, related_name='roadmap'
    )
    steps = models.JSONField(default=list)      # liste de RoadmapStep
    modules = models.JSONField(default=list)    # liste de CourseModule
    date_generation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Roadmap de {self.learning_profile.user.username}"