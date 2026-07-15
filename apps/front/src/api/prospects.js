const API = import.meta.env.VITE_API_URL || "http://localhost:8000"

function authHeaders() {
  const token = localStorage.getItem("access_token")
  return { "Content-Type":"application/json",
           "Authorization":`Bearer ${token}` }
}

export async function createProspect(data) {
  const r = await fetch(`${API}/api/prospects/`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(data),
  })
  if (!r.ok) throw await r.json()
  return r.json()
}

export async function getProspects() {
  const r = await fetch(`${API}/api/prospects/`, { headers:authHeaders() })
  if (!r.ok) throw await r.json()
  return r.json()
}

export async function updateProspectStatus(id, status) {
  const r = await fetch(`${API}/api/prospects/${id}/status/`, {
    method:"PATCH", headers:authHeaders(),
    body:JSON.stringify({ status }),
  })
  if (!r.ok) throw await r.json()
  return r.json()
}

export async function convertProspect(id) {
  const r = await fetch(`${API}/api/prospects/${id}/convert/`, {
    method:"POST", headers:authHeaders(),
  })
  if (!r.ok) throw await r.json()
  return r.json()
}