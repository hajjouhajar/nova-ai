from django.urls import path
from .views import DocumentUploadView, DocumentAnalyzeView

urlpatterns = [
    path('documents/upload/', DocumentUploadView.as_view()),
    path('documents/<int:document_id>/analyze/', DocumentAnalyzeView.as_view()),
]