const API =
  import.meta.env.VITE_API_URL
  || "http://localhost:8000";


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
      data
      || {
        detail:
          `HTTP ${response.status}`,
      }
    );
  }


  return data;
}


export async function getQuotes() {
  const response =
    await fetch(
      `${API}/api/quotes/`,
      {
        headers:
          authHeaders(),
      }
    );


  return readResponse(
    response
  );
}


export async function createQuote(
  data
) {
  const response =
    await fetch(
      `${API}/api/quotes/`,
      {
        method:
          "POST",

        headers:
          authHeaders(),

        body:
          JSON.stringify(
            data
          ),
      }
    );


  return readResponse(
    response
  );
}


export async function sendQuote(
  id
) {
  const response =
    await fetch(
      `${API}/api/quotes/${id}/send/`,
      {
        method:
          "POST",

        headers:
          authHeaders(),

        body:
          JSON.stringify({}),
      }
    );


  return readResponse(
    response
  );
}


export async function getMyQuotes() {
  const response =
    await fetch(
      `${API}/api/quotes/?mine=true`,
      {
        headers:
          authHeaders(),
      }
    );


  return readResponse(
    response
  );
}


export async function quoteAction(
  id,
  action,
  reason = ""
) {
  const response =
    await fetch(
      `${API}/api/quotes/${id}/${action}/`,
      {
        method:
          "POST",

        headers:
          authHeaders(),

        body:
          JSON.stringify({
            reason,
          }),
      }
    );


  return readResponse(
    response
  );
}