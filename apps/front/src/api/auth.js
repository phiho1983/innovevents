import { apiFetch, setTokens } from "./client";

export async function login(username, password) {
  const data = await apiFetch("/api/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function me() {
  return apiFetch("/api/me/");
}

export async function signup(username, email, password) {
  return apiFetch("/api/signup/", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}
