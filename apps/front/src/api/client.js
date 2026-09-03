const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


export function getAccessToken() {
  return localStorage.getItem(
    "access_token"
  );
}


export function setTokens(
  access,
  refresh
) {
  localStorage.setItem(
    "access_token",
    access
  );

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


export async function apiFetch(
  path,
  options = {}
) {
  const token =
    getAccessToken();

  const headers =
    new Headers(
      options.headers || {}
    );

  const isFormData =
    options.body instanceof FormData;

  if (
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const res = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  const text =
    await res.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
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

    throw new Error(msg);
  }

  return data;
}