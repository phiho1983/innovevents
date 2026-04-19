const API="https://innovevents-back.onrender.com:8000"

export async function login(username,password){
  const r=await fetch(`${API}/api/login/`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username,password})
  })
  if(!r.ok) throw await r.json()
  return r.json()
}

export async function getEvents(token){
  const r=await fetch(`${API}/api/events/?public=true`,{
    headers:{"Authorization":`Bearer ${token}`}
  })
  return r.json()
}

export async function addNote(eventId,content,token){
  const r=await fetch(`${API}/api/notes/`,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
    body:JSON.stringify({content,event:eventId})
  })
  return r.json()
}