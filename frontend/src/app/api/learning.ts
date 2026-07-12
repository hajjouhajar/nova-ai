import { apiFetch } from "./client";

export const saveLearningProfile = (profile: {
  domain: string; niveau: string; disponibilite: string; langue: string; career: string;
}) =>
  apiFetch("/auth/learning-profile/", {
    method: "POST",
    body: JSON.stringify(profile),
  });