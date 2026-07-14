import { apiFetch } from "./client";

interface LearningProfile {
  domain: string;
  niveau: string;
  disponibilite: string;
  langue: string;
  career: string;
}

export async function saveLearningProfile(profile: LearningProfile) {
  return apiFetch("/auth/learning-profile/", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function generateRoadmap() {
  return apiFetch("/roadmap/generate/", { method: "POST" });
}

export async function getRoadmap() {
  return apiFetch("/roadmap/");
}