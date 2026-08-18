import { apiFetch, setTokens } from "./client";

export async function login(username, password) {
  return apiFetch("/api/login/", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export async function verifyLogin2FA(username, code) {
  const data = await apiFetch("/api/login-2fa/", {
    method: "POST",
    body: JSON.stringify({
      username,
      code,
    }),
  });

  if (!data?.access || !data?.refresh) {
    throw new Error(
      "Les jetons de connexion n'ont pas été reçus."
    );
  }

  setTokens(
    data.access,
    data.refresh
  );

  return data;
}

export async function me() {
  return apiFetch("/api/me/");
}

export async function signup(
  username,
  email,
  password
) {
  return apiFetch("/api/signup/", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
}