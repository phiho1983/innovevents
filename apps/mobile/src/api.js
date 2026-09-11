import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./authStorage";

import * as FileSystem from "expo-file-system/legacy";


const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://innovevents-back.onrender.com";


async function parseResponse(
  response
) {
  const text =
    await response.text();

  let data = null;

  if (text) {
    try {
      data =
        JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error =
      new Error(
        data?.detail ||
          data?.message ||
          `Erreur HTTP ${response.status}`
      );

    error.status =
      response.status;

    error.data =
      data;

    throw error;
  }

  return data;
}


function normalizeCollection(
  data
) {
  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data?.results
    )
  ) {
    return data.results;
  }

  return [];
}


async function refreshAccessToken() {
  const refreshToken =
    await getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Session expirée."
    );
  }

  const response =
    await fetch(
      `${API_URL}/api/token/refresh/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            refresh:
              refreshToken,
          }),
      }
    );

  const data =
    await parseResponse(
      response
    );

  if (!data?.access) {
    throw new Error(
      "Impossible de renouveler la session."
    );
  }

  await setTokens(
    data.access,
    data.refresh ||
      refreshToken
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
    typeof FormData !==
      "undefined" &&
    options.body
      instanceof FormData;

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

  let response =
    await fetch(
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

      response =
        await fetch(
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

  return parseResponse(
    response
  );
}


export async function login(
  username,
  password
) {
  return apiFetch(
    "/api/login/",
    {
      method: "POST",

      body:
        JSON.stringify({
          username:
            username.trim(),

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
  const data =
    await apiFetch(
      "/api/login-2fa/",
      {
        method: "POST",

        body:
          JSON.stringify({
            username:
              username.trim(),

            code:
              code.trim(),
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


/*
 * DEMANDES / PROSPECTS
 */

export async function getProspects() {
  const data =
    await apiFetch(
      "/api/prospects/"
    );

  return normalizeCollection(
    data
  );
}


export async function getProspect(
  prospectId
) {
  return apiFetch(
    `/api/prospects/${prospectId}/`
  );
}


export async function updateProspectStatus(
  prospectId,
  status
) {
  return apiFetch(
    `/api/prospects/${prospectId}/status/`,
    {
      method: "PATCH",

      body:
        JSON.stringify({
          status,
        }),
    }
  );
}


/*
 * DEVIS
 */

export async function getQuotes() {
  const data =
    await apiFetch(
      "/api/quotes/"
    );

  return normalizeCollection(
    data
  );
}


export async function getQuote(
  quoteId
) {
  return apiFetch(
    `/api/quotes/${quoteId}/`
  );
}


export async function sendQuote(
  quoteId
) {
  return apiFetch(
    `/api/quotes/${quoteId}/send/`,
    {
      method: "POST",

      body:
        JSON.stringify({}),
    }
  );
}


export async function downloadQuotePdf(
  quoteId,
  reference
) {
  const safeReference =
    String(
      reference ||
        quoteId
    ).replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

  const directory =
    FileSystem.cacheDirectory ||
    FileSystem.documentDirectory;

  if (!directory) {
    throw new Error(
      "Stockage local indisponible."
    );
  }

  const fileUri =
    `${directory}devis_${safeReference}.pdf`;

  const url =
    `${API_URL}/api/quotes/${quoteId}/pdf/`;

  async function download(
    accessToken
  ) {
    return FileSystem.downloadAsync(
      url,
      fileUri,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );
  }

  let accessToken =
    await getAccessToken();

  if (!accessToken) {
    accessToken =
      await refreshAccessToken();
  }

  let result =
    await download(
      accessToken
    );

  if (
    result.status === 401
  ) {
    accessToken =
      await refreshAccessToken();

    result =
      await download(
        accessToken
      );
  }

  if (
    result.status < 200 ||
    result.status >= 300
  ) {
    throw new Error(
      `Téléchargement du PDF impossible (${result.status}).`
    );
  }

  return result.uri;
}


/*
 * EVENEMENTS
 */

export async function getEvents() {
  const data =
    await apiFetch(
      "/api/events/"
    );

  return normalizeCollection(
    data
  );
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


/*
 * NOTES INTERNES
 */

export async function getNotes() {
  const data =
    await apiFetch(
      "/api/notes/"
    );

  return normalizeCollection(
    data
  );
}


export async function createNote({
  clientId = null,
  content,
}) {
  const payload = {
    content:
      content.trim(),
  };

  if (
    clientId !== null &&
    clientId !== undefined
  ) {
    payload.client =
      clientId;
  }

  return apiFetch(
    "/api/notes/",
    {
      method: "POST",

      body:
        JSON.stringify(
          payload
        ),
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

      body:
        JSON.stringify({
          content:
            content.trim(),
        }),
    }
  );
}


export async function logout() {
  await clearTokens();
}