const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function setTokens(access, refresh) {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
