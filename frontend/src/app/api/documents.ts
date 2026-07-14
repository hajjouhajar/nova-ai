import { apiFetch } from "./client";

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("fichier", file);
  return apiFetch("/documents/upload/", {
    method: "POST",
    body: formData,
  });
}

export async function analyzeDocument(documentId: number, question: string) {
  return apiFetch(`/documents/${documentId}/analyze/`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}