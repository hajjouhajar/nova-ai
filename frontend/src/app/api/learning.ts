import { apiFetch } from "./client";

interface LearningProfile {
  domain: string;
  niveau: string;
  disponibilite: string;
  langue: string;
  career: string;
}

// Traduit les noms de champs frontend vers les noms attendus par le backend
function toBackendPayload(p: LearningProfile) {
  return {
    objective: p.domain,
    level: p.niveau,
    weekly_hours: p.disponibilite,
    language: p.langue,
    career_goal: p.career,
  };
}

export async function saveLearningProfile(profile: LearningProfile) {
  return apiFetch("/auth/learning-profile/", {
    method: "POST",
    body: JSON.stringify(toBackendPayload(profile)),
  });
}

export async function generateRoadmap() {
  return apiFetch("/roadmap/generate/", { method: "POST" });
}

export async function getRoadmap() {
  return apiFetch("/roadmap/");
}