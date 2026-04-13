import{useState}from"react"
import{Link}from"react-router-dom"
import Navbar from"../components/Navbar"
const API=import.meta.env.VITE_API_URL||"http://localhost:8000"
export default function ForgotPasswordPage(){
  const[email,setEmail]=useState(""); const[done,setDone]=useState(false); const[loading,setLoading]=useState(false)
  async function submit(e){
    e.preventDefault(); setLoading(true)
    await fetch(`${API}/api/forgot-password/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})})
    setDone(true); setLoading(false)
  }
  return(<><Navbar/><main className="container" style={{padding:"60px 0",maxWidth:400}}>
    <h2>Mot de passe oublié</h2>
    {done?(<p style={{marginTop:16,color:"green"}}>Si cet email existe, un message vous a été envoyé. Vérifiez votre boîte mail.</p>):(
      <form onSubmit={submit} style={{marginTop:16}}>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Votre adresse email"
          required style={{width:"100%",padding:"8px 10px",border:"1px solid #ddd",borderRadius:4,marginBottom:12}}/>
        <button type="submit" className="btn" disabled={loading} style={{width:"100%"}}>{loading?"Envoi...":"Réinitialiser"}</button>
        <p style={{marginTop:12,textAlign:"center",fontSize:13}}><Link to="/login">Retour à la connexion</Link></p>
      </form>
    )}
  </main></>)
}