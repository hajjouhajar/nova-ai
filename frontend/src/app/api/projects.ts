import { apiFetch } from "./client";
import type { Task, Project } from "../App"; // si tu exportes les types, sinon retire ce import et laisse `any`

export const getProjects = (): Promise<Project[]> => apiFetch("/projects/");
export const getTasks = (): Promise<Task[]> => apiFetch("/tasks/");

export const createProject = (name: string, desc: string) =>
  apiFetch("/projects/", { method: "POST", body: JSON.stringify({ name, desc }) });

export const createTask = (task: {
  title: string; projectId?: number; priority?: string; status?: string; category?: string; due?: string;
}) => apiFetch("/tasks/", { method: "POST", body: JSON.stringify(task) });

export const updateTaskStatus = (taskId: number, status: Task["status"]) =>
  apiFetch(`/tasks/${taskId}/`, { method: "PATCH", body: JSON.stringify({ status }) });