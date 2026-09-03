import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./authStorage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://innovevents-back.onrender.com";


async function parseResponse(response) {
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.detail ||
        data?.message ||
        `Erreur HTTP ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


async function refreshAccessToken() {
  const refreshToken =
    await getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Session expirée."
    );
  }

  const response = await fetch(
    `${API_URL}/api/token/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }
  );

  const data =
    await parseResponse(response);

  if (!data?.access) {
    throw new Error(
      "Impossible de renouveler la session."
    );
  }

  await setTokens(
    data.access,
    data.refresh || refreshToken
  );

  return data.access;
}


export async function apiFetch(
  path,
  options = {},
  retry = true
) {
  const accessToken =
    await getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (
    !isFormData &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  if (accessToken) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  let response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  if (
    response.status === 401 &&
    retry &&
    accessToken
  ) {
    try {
      const newAccessToken =
        await refreshAccessToken();

      response = await fetch(
        `${API_URL}${path}`,
        {
          ...options,
          headers: {
            ...headers,
            Authorization:
              `Bearer ${newAccessToken}`,
          },
        }
      );
    } catch {
      await clearTokens();

      throw new Error(
        "Votre session a expiré. Veuillez vous reconnecter."
      );
    }
  }

  return parseResponse(response);
}


export async function login(
  username,
  password
) {
  return apiFetch(
    "/api/login/",
    {
      method: "POST",
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    },
    false
  );
}


export async function verifyLogin2FA(
  username,
  code
) {
  const data = await apiFetch(
    "/api/login-2fa/",
    {
      method: "POST",
      body: JSON.stringify({
        username: username.trim(),
        code: code.trim(),
      }),
    },
    false
  );

  if (
    !data?.access ||
    !data?.refresh
  ) {
    throw new Error(
      "Les jetons de connexion n'ont pas été reçus."
    );
  }

  await setTokens(
    data.access,
    data.refresh
  );

  return data;
}


export async function getCurrentUser() {
  return apiFetch(
    "/api/me/"
  );
}


export async function getEvents() {
  const data =
    await apiFetch(
      "/api/events/"
    );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


export async function getEvent(
  eventId
) {
  return apiFetch(
    `/api/events/${eventId}/`
  );
}


export async function startEvent(
  eventId
) {
  return apiFetch(
    `/api/events/${eventId}/start/`,
    {
      method: "POST",
    }
  );
}


export async function completeEvent(
  eventId
) {
  return apiFetch(
    `/api/events/${eventId}/complete/`,
    {
      method: "POST",
    }
  );
}


export async function getNotes() {
  const data =
    await apiFetch(
      "/api/notes/"
    );

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


export async function createNote({
  clientId,
  content,
}) {
  return apiFetch(
    "/api/notes/",
    {
      method: "POST",
      body: JSON.stringify({
        client: clientId,
        content:
          content.trim(),
      }),
    }
  );
}


export async function updateNote(
  noteId,
  content
) {
  return apiFetch(
    `/api/notes/${noteId}/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        content:
          content.trim(),
      }),
    }
  );
}


export async function logout() {
  await clearTokens();
}