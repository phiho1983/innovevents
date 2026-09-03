const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


function authHeaders() {
  const token =
    localStorage.getItem(
      "access_token"
    );

  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


async function readResponse(
  response
) {
  const data =
    await response
      .json()
      .catch(
        () => null
      );

  if (!response.ok) {
    throw (
      data || {
        detail:
          `Erreur HTTP ${response.status}`,
      }
    );
  }

  return data;
}


export async function createContactMessage(
  payload
) {
  const response =
    await fetch(
      `${API}/api/contact-messages/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  return readResponse(
    response
  );
}


export async function getContactMessages() {
  const response =
    await fetch(
      `${API}/api/contact-messages/`,
      {
        headers:
          authHeaders(),
      }
    );

  return readResponse(
    response
  );
}


export async function updateContactMessage(
  id,
  payload
) {
  const response =
    await fetch(
      `${API}/api/contact-messages/${id}/`,
      {
        method: "PATCH",

        headers:
          authHeaders(),

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  return readResponse(
    response
  );
}


export async function deleteContactMessage(
  id
) {
  const response =
    await fetch(
      `${API}/api/contact-messages/${id}/`,
      {
        method: "DELETE",

        headers:
          authHeaders(),
      }
    );

  return readResponse(
    response
  );
}
