import{useState,useEffect}from"react"
import Navbar from"../components/Navbar"
const API=import.meta.env.VITE_API_URL||"http://localhost:8000"
export default function ReviewsPage(){
  const[reviews,setReviews]=useState([])
  useEffect(()=>{
    fetch(`${API}/api/reviews/?validated=true`).then(r=>r.json()).then(d=>setReviews(d.results||d)).catch(()=>{})
  },[])
  return(<><Navbar/><main className="container" style={{padding:"24px 0"}}>
    <h1 style={{marginBottom:20}}>Avis clients</h1>
    {reviews.length===0&&<p style={{color:"#888"}}>Aucun avis pour le moment.</p>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
      {reviews.map(r=>(
        <div key={r.id} style={{border:"1px solid #eee",borderRadius:8,padding:16,background:"#fff"}}>
          <div style={{fontSize:20,marginBottom:6}}>{"★".repeat(r.rating||5)}</div>
          <p style={{fontSize:14,lineHeight:1.6,margin:"0 0 10px"}}>{r.content}</p>
          <p style={{fontSize:12,color:"#888",margin:0}}>{r.author_name} — {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
      ))}
    </div>
  </main></>)
}