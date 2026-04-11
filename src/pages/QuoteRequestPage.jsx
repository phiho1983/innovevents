const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

function authHeaders() {
  const token = localStorage.getItem("access_token")
  return { "Content-Type":"application/json",
           "Authorization":`Bearer ${token}` }
}

export async function getQuotes() {
  const r = await fetch(`${API}/api/quotes/`, { headers:authHeaders() })
  if (!r.ok) throw await r.json()
  return r.json()
}

export async function createQuote(data) {
  const r = await fetch(`${API}/api/quotes/`, {
    method:"POST", headers:authHeaders(),
    body:JSON.stringify(data),
  })
  if (!r.ok) throw await r.json()
  return r.json()
}

export async function getMyQuotes() {
  const r = await fetch(`${API}/api/quotes/?mine=true`, { headers:authHeaders() })
  if (!r.ok) throw await r.json()
  return r.json()
}

export async function quoteAction(id, action, reason="") {
  const r = await fetch(`${API}/api/quotes/${id}/${action}/`, {
    method:"POST", headers:authHeaders(),
    body:JSON.stringify({ reason }),
  })
  if (!r.ok) throw await r.json()
  return r.json()
}