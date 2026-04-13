import{useState,useEffect}from"react"
import{useNavigate}from"react-router-dom"
import Navbar from"../components/Navbar"
import{useAuth}from"../auth/useAuth"
import{getMyQuotes,quoteAction}from"../api/quotes"

const SLABELS={DRAFT:"Brouillon",SENT:"Envoyé",ACCEPTED:"Accepté",REFUSED:"Refusé",CHANGE_REQUESTED:"Modification demandée"}
const SCOLORS={DRAFT:"#f5f5f5",SENT:"#cce5ff",ACCEPTED:"#d4edda",REFUSED:"#f8d7da",CHANGE_REQUESTED:"#fff3cd"}
const API=import.meta.env.VITE_API_URL||"http://localhost:8000"

export default function ClientAccountPage(){
  const{user,logout}=useAuth(); const nav=useNavigate()
  const[quotes,setQuotes]=useState([]); const[loading,setLoading]=useState(true)
  const[activeId,setActiveId]=useState(null); const[reason,setReason]=useState("")
  const[events,setEvents]=useState([])

  useEffect(()=>{
    getMyQuotes().then(d=>setQuotes(d.results||d)).catch(console.error).finally(()=>setLoading(false))
    const tok=localStorage.getItem("access_token")
    fetch(`${API}/api/events/?upcoming=3`,{headers:{"Authorization":`Bearer ${tok}`}})
      .then(r=>r.json()).then(d=>setEvents((d.results||d).slice(0,3))).catch(()=>{})
  },[])

  async function doAction(id,action,r=""){
    try{
      const upd=await quoteAction(id,action,r)
      setQuotes(p=>p.map(q=>q.id===id?{...q,status:upd.status}:q))
      setActiveId(null); setReason("")
    }catch(e){alert("Erreur: "+JSON.stringify(e))}
  }

  return(<><Navbar/>
    <main className="container" style={{padding:"20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h1 style={{margin:0}}>Mon espace</h1><p style={{color:"#666",margin:0}}>{user?.username} — {user?.email}</p></div>
        <button className="btn" onClick={()=>{logout();nav("/")}}>Déconnexion</button>
      </div>

      {events.length>0&&(<div style={{background:"#f0f7ff",border:"1px solid #b8d4f0",borderRadius:8,padding:14,marginBottom:20}}>
        <p style={{fontWeight:"600",marginBottom:10,fontSize:14}}>Prochains événements</p>
        {events.map(e=>(
          <div key={e.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #d0e8f8"}}>
            <span>{e.title}</span><span style={{color:"#555"}}>{new Date(e.start_at).toLocaleDateString("fr-FR")}</span>
          </div>
        ))}
      </div>)}

      <h2 style={{marginBottom:12}}>Mes devis ({quotes.length})</h2>
      {loading&&<p>Chargement...</p>}
      {!loading&&quotes.length===0&&<p style={{color:"#888"}}>Aucun devis pour le moment.</p>}
      {quotes.map(q=>(
        <div key={q.id} style={{border:"1px solid #eee",borderRadius:8,padding:14,marginBottom:10,background:"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <b>Devis #{q.id}</b>
            <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,background:SCOLORS[q.status]||"#eee"}}>{SLABELS[q.status]||q.status}</span>
          </div>
          <p style={{fontSize:13,color:"#555",margin:"4px 0"}}>Total TTC : <b>{q.total_ttc} €</b></p>
          {q.items?.map(i=><div key={i.id} style={{fontSize:12,color:"#888",marginTop:2}}>• {i.label} — {i.amount_ht}€ HT</div>)}
          {q.status==="SENT"&&(
            <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
              <button onClick={()=>doAction(q.id,"accept")} style={{padding:"5px 12px",background:"#d4edda",border:"1px solid #c3e6cb",borderRadius:4,cursor:"pointer",fontSize:13}}>✓ Accepter</button>
              <button onClick={()=>doAction(q.id,"refuse")} style={{padding:"5px 12px",background:"#f8d7da",border:"1px solid #f5c6cb",borderRadius:4,cursor:"pointer",fontSize:13}}>✕ Refuser</button>
              <button onClick={()=>setActiveId(activeId===q.id?null:q.id)} style={{padding:"5px 12px",background:"#fff3cd",border:"1px solid #ffeeba",borderRadius:4,cursor:"pointer",fontSize:13}}>✎ Modification</button>
            </div>
          )}
          {activeId===q.id&&(
            <div style={{marginTop:10}}>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Expliquez le motif de modification..." rows={3}
                style={{width:"100%",padding:8,border:"1px solid #ddd",borderRadius:4,boxSizing:"border-box"}}/>
              <button className="btn" style={{marginTop:6}} onClick={()=>doAction(q.id,"request-change",reason)}>Envoyer la demande</button>
            </div>
          )}
        </div>
      ))}
    </main>
  </>)
}