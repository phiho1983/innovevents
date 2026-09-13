const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


export function getAccessToken() {
  return localStorage.getItem(
    "access_token"
  );
}


export function getRefreshToken() {
  return localStorage.getItem(
    "refresh_token"
  );
}


export function setTokens(
  access,
  refresh
) {
  if (access) {
    localStorage.setItem(
      "access_token",
      access
    );
  }

  if (refresh) {
    localStorage.setItem(
      "refresh_token",
      refresh
    );
  }
}


export function clearTokens() {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );
}


async function parseResponse(
  res
) {
  const text =
    await res.text();

  let data = null;

  if (text) {
    try {
      data =
        JSON.parse(text);
    } catch {
      data =
        text;
    }
  }

  return data;
}


function buildError(
  res,
  data
) {
  let msg =
    data?.detail ||
    data?.message;

  if (
    !msg &&
    data &&
    typeof data === "object"
  ) {
    msg =
      Object.entries(data)
        .map(
          ([field, value]) => {
            const fieldMessage =
              Array.isArray(value)
                ? value.join(" ")
                : String(value);

            return (
              `${field} : ` +
              fieldMessage
            );
          }
        )
        .join(" | ");
  }

  if (!msg) {
    msg =
      `HTTP ${res.status}`;
  }

  const error =
    new Error(msg);

  error.status =
    res.status;

  error.data =
    data;

  return error;
}


async function refreshAccessToken() {
  const refreshToken =
    getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Session expirée."
    );
  }

  const res =
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
      res
    );

  if (
    !res.ok ||
    !data?.access
  ) {
    throw buildError(
      res,
      data
    );
  }

  setTokens(
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
    getAccessToken();

  const headers =
    new Headers(
      options.headers || {}
    );

  const isFormData =
    typeof FormData !==
      "undefined" &&
    options.body
      instanceof FormData;

  if (
    !isFormData &&
    !headers.has(
      "Content-Type"
    )
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  let res =
    await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      }
    );

  if (
    res.status === 401 &&
    retry &&
    accessToken
  ) {
    try {
      const newAccessToken =
        await refreshAccessToken();

      const retryHeaders =
        new Headers(
          headers
        );

      retryHeaders.set(
        "Authorization",
        `Bearer ${newAccessToken}`
      );

      res =
        await fetch(
          `${API_URL}${path}`,
          {
            ...options,
            headers:
              retryHeaders,
          }
        );
    } catch (error) {
      clearTokens();

      throw error;
    }
  }

  const data =
    await parseResponse(
      res
    );

  if (!res.ok) {
    throw buildError(
      res,
      data
    );
  }

  return data;
}