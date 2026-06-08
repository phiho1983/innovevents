const API = "https://innovevents-back.onrender.com";

async function parseResponse(r) {
  const text = await r.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text || "Réponse invalide du serveur" };
  }

  if (!r.ok) {
    throw data;
  }
  return data;
}

export async function login(username, password) {
  const r = await fetch(`${API}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return parseResponse(r);
}

export async function getEvents(token) {
  const r = await fetch(`${API}/api/events/?public=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(r);
}

export async function addNote(eventId, content, token) {
  const r = await fetch(`${API}/api/notes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, event: eventId }),
  });
  return parseResponse(r);
}