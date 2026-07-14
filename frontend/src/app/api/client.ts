const API_BASE_URL = "http://127.0.0.1:8000/api";

const PUBLIC_ENDPOINTS = ["/auth/register/", "/auth/login/", "/auth/refresh/"];

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const isPublic = PUBLIC_ENDPOINTS.some(e => endpoint.startsWith(e));
  const token = isPublic ? null : localStorage.getItem("access_token");
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Erreur ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}