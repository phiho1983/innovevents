import{useState,useEffect}from"react"
import{Link}from"react-router-dom"
import Navbar from"../components/Navbar"

const API=import.meta.env.VITE_API_URL||"http://localhost:8000"

export default function EventsPage(){
  const[events,setEvents]=useState([])
  const[loading,setLoading]=useState(true)
  const[filters,setFilters]=useState({date_from:"",date_to:"",event_type:"",theme:""})

  useEffect(()=>{loadEvents()},[])

  async function loadEvents(){
    setLoading(true)
    const params=new URLSearchParams()
    if(filters.date_from) params.set("start_after",filters.date_from)
    if(filters.date_to)   params.set("start_before",filters.date_to)
    if(filters.event_type) params.set("event_type",filters.event_type)
    if(filters.theme)     params.set("theme",filters.theme)
    params.set("public","true")
    try{
      const r=await fetch(`${API}/api/events/?${params}`)
      const d=await r.json()
      setEvents(d.results||d)
    }catch(e){console.error(e)}
    finally{setLoading(false)}
  }

  function onFilter(e){
    const{name,value}=e.target
    setFilters(p=>({...p,[name]:value}))
  }

  return(<><Navbar/>
    <main className="container" style={{padding:"24px 0"}}>
      <h1 style={{marginBottom:20}}>Nos événements</h1>

      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24,padding:16,background:"#f9f9f9",borderRadius:8,border:"1px solid #eee"}}>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:3}}>Du</label>
          <input type="date" name="date_from" value={filters.date_from} onChange={onFilter}
            style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:3}}>Au</label>
          <input type="date" name="date_to" value={filters.date_to} onChange={onFilter}
            style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:3}}>Type</label>
          <select name="event_type" value={filters.event_type} onChange={onFilter}
            style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4}}>
            <option value="">Tous</option>
            <option value="SEMINAR">Séminaire</option>
            <option value="CONFERENCE">Conférence</option>
            <option value="PARTY">Soirée d'entreprise</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,color:"#666",marginBottom:3}}>Thème</label>
          <input name="theme" value={filters.theme} onChange={onFilter} placeholder="Ex: Innovation"
            style={{padding:"5px 8px",border:"1px solid #ddd",borderRadius:4}}/>
        </div>
        <div style={{display:"flex",alignItems:"flex-end"}}>
          <button className="btn" onClick={loadEvents}>Filtrer</button>
        </div>
      </div>

      {loading&&<p>Chargement...</p>}
      {!loading&&events.length===0&&<p style={{color:"#888"}}>Aucun événement correspondant.</p>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {events.map(ev=>(
          <div key={ev.id} style={{border:"1px solid #eee",borderRadius:10,overflow:"hidden",background:"#fff"}}>
            {ev.image
              ?<img src={`${API}${ev.image}`} alt={ev.title} style={{width:"100%",height:160,objectFit:"cover"}}/>
              :<div style={{height:160,background:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",color:"#aaa",fontSize:13}}>Pas d'image</div>
            }
            <div style={{padding:14}}>
              <h3 style={{margin:"0 0 6px",fontSize:15}}>{ev.title}</h3>
              <p style={{color:"#666",fontSize:13,margin:"0 0 4px"}}>{ev.city} — {new Date(ev.start_at).toLocaleDateString("fr-FR")}</p>
              {ev.theme&&<p style={{fontSize:12,color:"#888",margin:"0 0 8px"}}>Thème : {ev.theme}</p>}
              <p style={{fontSize:13,color:"#555",margin:"0 0 12px",lineHeight:1.5}}>{ev.description?.substring(0,100)}{ev.description?.length>100?"...":""}</p>
              <div style={{display:"flex",gap:8"}}>
                <Link to={`/evenements/${ev.id}`} style={{fontSize:13,color:"#333",textDecoration:"underline"}}>Voir détails</Link>
                <Link to="/demande-de-devis" style={{fontSize:13,color:"#333",fontWeight:"600"}}>Prestations et Devis →</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  </>)
}