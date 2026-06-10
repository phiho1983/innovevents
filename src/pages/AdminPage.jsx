import{useState,useEffect}from"react"
import{useNavigate}from"react-router-dom"
import Navbar from"../components/Navbar"
import{useAuth}from"../auth/useAuth"
import{getProspects,updateProspectStatus,convertProspect}from"../api/prospects"
import{getQuotes,createQuote}from"../api/quotes"

const API=import.meta.env.VITE_API_URL||"http://localhost:8000"
const ah=()=>({"Content-Type":"application/json","Authorization":`Bearer ${localStorage.getItem("access_token")}`})

const SLABELS={TO_CONTACT:"À contacter",CONTACTED:"Contacté",QUALIFIED:"Qualifié",ARCHIVED:"Archivé"}
const SCOLORS={TO_CONTACT:"#fff3cd",CONTACTED:"#cce5ff",QUALIFIED:"#d4edda",ARCHIVED:"#f8d7da"}
const QLABELS={DRAFT:"Brouillon",SENT:"Envoyé",ACCEPTED:"Accepté",REFUSED:"Refusé",CHANGE_REQUESTED:"Modif demandée"}

export default function AdminPage(){
  const{user,logout}=useAuth(); const nav=useNavigate()
  const[tab,setTab]=useState("prospects")
  return(<><Navbar/>
    <main className="container" style={{padding:"20px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h1 style={{margin:0}}>Dashboard Admin</h1><p style={{color:"#666",margin:0}}>{user?.username}</p></div>
        <button className="btn" onClick={()=>{logout();nav("/")}}>Déconnexion</button>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #eee"}}>
        {[["prospects","Prospects"],["quotes","Devis"],["reviews","Avis"],["notes","Notes"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 16px",border:"none",background:"none",cursor:"pointer",fontWeight:tab===k?"600":"400",borderBottom:tab===k?"2px solid #000":"none",marginBottom:-1}}>{l}</button>
        ))}
      </div>
      {tab==="prospects"&&<ProspectsTab/>}
      {tab==="quotes"&&<QuotesTab/>}
      {tab==="reviews"&&<ReviewsAdminTab/>}
      {tab==="notes"&&<NotesTab/>}
    </main>
  </>)
}

function ProspectsTab(){
  const[prospects,setProspects]=useState([]); const[loading,setLoading]=useState(true); const[upd,setUpd]=useState(null)
  useEffect(()=>{getProspects().then(d=>setProspects(d.results||d)).finally(()=>setLoading(false))},[])
  async function changeStatus(id,status){
    setUpd(id)
    const u=await updateProspectStatus(id,status)
    setProspects(p=>p.map(x=>x.id===id?{...x,status:u.status}:x)); setUpd(null)
  }
  async function doConvert(id){
    if(!window.confirm("Convertir ce prospect en client ?")) return
    try{ await convertProspect(id); alert("Client créé ! Un email avec le mot de passe a été envoyé."); setProspects(p=>p.map(x=>x.id===id?{...x,status:"QUALIFIED"}:x)) }
    catch(e){ alert("Erreur: "+JSON.stringify(e)) }
  }
  if(loading) return <p>Chargement...</p>
  return(<div>
    <h2 style={{marginBottom:12}}>Prospects ({prospects.length})</h2>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{background:"#f5f5f5"}}>
          {["Nom","Email","Société","Type évén.","Statut","Action","Date"].map(h=>(
            <th key={h} style={{padding:"8px 10px",textAlign:"left",borderBottom:"2px solid #ddd"}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>{prospects.map(p=>(
          <tr key={p.id} style={{borderBottom:"1px solid #eee"}}>
            <td style={{padding:"8px 10px"}}><b>{p.first_name} {p.last_name}</b></td>
            <td style={{padding:"8px 10px"}}><a href={`mailto:${p.email}`}>{p.email}</a></td>
            <td style={{padding:"8px 10px"}}>{p.company||"—"}</td>
            <td style={{padding:"8px 10px"}}>{p.event_type||"—"}</td>
            <td style={{padding:"8px 10px"}}>
              <select value={p.status} disabled={upd===p.id}
                onChange={e=>changeStatus(p.id,e.target.value)}
                style={{padding:"3px 6px",borderRadius:4,background:SCOLORS[p.status]||"#fff",border:"1px solid #ddd"}}>
                {Object.entries(SLABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </td>
            <td style={{padding:"8px 10px"}}>
              {p.status!=="ARCHIVED"&&(
                <button onClick={()=>doConvert(p.id)}
                  style={{fontSize:12,padding:"3px 8px",border:"1px solid #ddd",borderRadius:4,cursor:"pointer",background:"#e8f5e9"}}>
                  → Client
                </button>
              )}
            </td>
            <td style={{padding:"8px 10px",color:"#888"}}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>)
}

function QuotesTab(){
  const[quotes,setQuotes]=useState([]); const[loading,setLoading]=useState(true); const[show,setShow]=useState(false)
  useEffect(()=>{getQuotes().then(d=>setQuotes(d.results||d)).finally(()=>setLoading(false))},[])
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <h2>Devis ({quotes.length})</h2>
      <button className="btn" onClick={()=>setShow(s=>!s)}>{show?"Annuler":"+ Nouveau devis"}</button>
    </div>
    {show&&<CreateQuoteForm onSuccess={q=>{setQuotes(p=>[q,...p]);setShow(false)}}/>}
    {loading?<p>Chargement...</p>:quotes.map(q=>(
      <div key={q.id} style={{border:"1px solid #eee",borderRadius:8,padding:14,marginBottom:8,background:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <b>Devis #{q.id}</b>
          <span style={{padding:"2px 10px",borderRadius:20,fontSize:12,background:{DRAFT:"#f5f5f5",SENT:"#cce5ff",ACCEPTED:"#d4edda",REFUSED:"#f8d7da",CHANGE_REQUESTED:"#fff3cd"}[q.status]||"#eee"}}>
            {QLABELS[q.status]||q.status}
          </span>
        </div>
        <div style={{fontSize:13,color:"#555"}}>HT: {q.total_ht}€ | TVA: {q.total_tva}€ | <b>TTC: {q.total_ttc}€</b></div>
        {q.items?.map(i=><div key={i.id} style={{fontSize:12,color:"#888",marginTop:2}}>• {i.label} — {i.amount_ht}€</div>)}
        <div style={{marginTop:8,display:"flex",gap:6}}>
          <a href={`${import.meta.env.VITE_API_URL||"http://localhost:8000"}/api/quotes/${q.id}/pdf/`}
            target="_blank" rel="noreferrer"
            style={{fontSize:12,padding:"3px 10px",border:"1px solid #ddd",borderRadius:4,textDecoration:"none",color:"#333"}}>
            Télécharger PDF
          </a>
        </div>
      </div>
    ))}
  </div>)
}

function CreateQuoteForm({onSuccess}){
  const[form,setForm]=useState({prospect:"",tva_rate:"0.20"})
  const[items,setItems]=useState([{label:"",amount_ht:""}])
  const[loading,setLoading]=useState(false)
  const totalHT=items.reduce((s,i)=>s+(parseFloat(i.amount_ht)||0),0)
  const totalTVA=totalHT*parseFloat(form.tva_rate||0)
  function updItem(idx,k,v){setItems(p=>p.map((x,i)=>i===idx?{...x,[k]:v}:x))}
  async function submit(e){
    e.preventDefault(); setLoading(true)
    try{
      const q=await createQuote({prospect:parseInt(form.prospect),tva_rate:form.tva_rate,items:items.filter(i=>i.label&&i.amount_ht)})
      onSuccess(q)
    }catch(err){alert(JSON.stringify(err))}
    finally{setLoading(false)}
  }
  return(<div style={{background:"#f9f9f9",border:"1px solid #ddd",borderRadius:8,padding:16,marginBottom:16}}>
    <h3 style={{marginTop:0,marginBottom:12}}>Nouveau devis</h3>
    <form onSubmit={submit}>
      <div style={{display:"flex",gap:12,marginBottom:10}}>
        <div style={{flex:1}}><label style={{display:"block",fontSize:13,marginBottom:3}}>ID du prospect *</label>
          <input type="number" value={form.prospect} onChange={e=>setForm(p=>({...p,prospect:e.target.value}))}
            style={{width:"100%",padding:"6px 8px",border:"1px solid #ddd",borderRadius:4}}/>
        </div>
        <div><label style={{display:"block",fontSize:13,marginBottom:3}}>TVA</label>
          <select value={form.tva_rate} onChange={e=>setForm(p=>({...p,tva_rate:e.target.value}))} style={{padding:"6px 8px",border:"1px solid #ddd",borderRadius:4}}>
            <option value="0.20">20%</option><option value="0.10">10%</option><option value="0.055">5,5%</option><option value="0.00">0%</option>
          </select>
        </div>
      </div>
      {items.map((item,idx)=>(
        <div key={idx} style={{display:"flex",gap:8,marginBottom:6}}>
          <input value={item.label} onChange={e=>updItem(idx,"label",e.target.value)} placeholder="Libellé prestation"
            style={{flex:2,padding:"6px 8px",border:"1px solid #ddd",borderRadius:4}}/>
          <input type="number" value={item.amount_ht} onChange={e=>updItem(idx,"amount_ht",e.target.value)} placeholder="Montant HT €"
            style={{flex:1,padding:"6px 8px",border:"1px solid #ddd",borderRadius:4}}/>
          {items.length>1&&<button type="button" onClick={()=>setItems(p=>p.filter((_,i)=>i!==idx))}
            style={{padding:"6px 10px",background:"#f8d7da",border:"none",borderRadius:4,cursor:"pointer"}}>✕</button>}
        </div>
      ))}
      <button type="button" onClick={()=>setItems(p=>[...p,{label:"",amount_ht:""}])}
        style={{fontSize:12,padding:"4px 10px",border:"1px solid #ddd",borderRadius:4,cursor:"pointer",background:"#f5f5f5",marginBottom:12}}>
        + Ajouter prestation
      </button>
      <div style={{background:"#fff",border:"1px solid #ddd",borderRadius:6,padding:12,marginBottom:12,fontSize:13}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>Total HT : <b>{totalHT.toFixed(2)} €</b></div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>TVA : <b>{totalTVA.toFixed(2)} €</b></div>
        <div style={{display:"flex",justifyContent:"space-between",fontWeight:"bold",fontSize:15}}>Total TTC : <b>{(totalHT+totalTVA).toFixed(2)} €</b></div>
      </div>
      <button type="submit" className="btn" disabled={loading}>{loading?"Création...":"Créer le devis"}</button>
    </form>
  </div>)
}

function ReviewsAdminTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/reviews/`, {
      headers: ah(),
    })
      .then((response) => response.json())
      .then((data) => setReviews(data.results || data))
      .finally(() => setLoading(false))
  }, [])

  async function deleteReview(id) {
    if (!window.confirm("Supprimer cet avis ?")) {
      return
    }

    setBusy(id)

    try {
      const response = await fetch(`${API}/api/reviews/${id}/`, {
        method: "DELETE",
        headers: ah(),
      })

      if (!response.ok) {
        throw await response.json().catch(() => ({
          detail: `HTTP ${response.status}`,
        }))
      }

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review.id !== id)
      )
    } catch (error) {
      alert("Erreur : " + JSON.stringify(error))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <p>Chargement...</p>
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>
        Avis clients ({reviews.length})
      </h2>

      {reviews.length === 0 && (
        <p style={{ color: "#888" }}>Aucun avis pour le moment.</p>
      )}

      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 14,
            marginBottom: 8,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div>
              <b>{review.author_name || "Inconnu"}</b>{" "}
              <span
                style={{
                  fontSize: 13,
                  color: "#666",
                }}
              >
                — {"★".repeat(review.rating || 5)}
              </span>
            </div>

            <span
              style={{
                fontSize: 12,
                color: "#888",
              }}
            >
              {new Date(review.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 8px",
            }}
          >
            {review.content}
          </p>

          <button
            onClick={() => deleteReview(review.id)}
            disabled={busy === review.id}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              border: "1px solid #f5c6cb",
              borderRadius: 4,
              background: "#f8d7da",
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  )
}

function NotesTab(){
  const[notes,setNotes]=useState([]); const[loading,setLoading]=useState(true); const[text,setText]=useState(""); const[saving,setSaving]=useState(false)
  useEffect(()=>{fetch(`${API}/api/notes/`,{headers:ah()}).then(r=>r.json()).then(d=>setNotes(d.results||d)).finally(()=>setLoading(false))},[])
  async function add(e){
    e.preventDefault(); if(!text.trim()) return; setSaving(true)
    const r=await fetch(`${API}/api/notes/`,{method:"POST",headers:ah(),body:JSON.stringify({content:text,pinned:false})})
    const n=await r.json(); setNotes(p=>[n,...p]); setText(""); setSaving(false)
  }
  return(<div>
    <h2 style={{marginBottom:12}}>Notes globales</h2>
    <form onSubmit={add} style={{marginBottom:16}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Ajouter une note..."
        style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:6,marginBottom:8,boxSizing:"border-box"}}/>
      <button type="submit" className="btn" disabled={saving||!text.trim()}>{saving?"Enregistrement...":"Ajouter"}</button>
    </form>
    {loading?<p>Chargement...</p>:notes.map(n=>(
      <div key={n.id} style={{background:n.pinned?"#fff3cd":"#f9f9f9",border:"1px solid #ddd",borderRadius:6,padding:12,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
          <b>{n.author_name||"Inconnu"}</b><span style={{color:"#888"}}>{new Date(n.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
        <p style={{margin:0,fontSize:13}}>{n.content}</p>
      </div>
    ))}
  </div>)
}