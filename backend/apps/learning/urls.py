from django.urls import path
from .views import RoadmapView, GenerateRoadmapView

urlpatterns = [
    path('roadmap/', RoadmapView.as_view()),
    path('roadmap/generate/', GenerateRoadmapView.as_view()),
]