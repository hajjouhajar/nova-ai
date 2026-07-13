import { apiFetch } from "./client";

export const sendChatMessage = (message: string) =>
  apiFetch("/chat/", { method: "POST", body: JSON.stringify({ message }) });

export const getChatHistory = () => apiFetch("/chat/");