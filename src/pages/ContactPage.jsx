import{useState}from"react"
import Navbar from"../components/Navbar"
import{useAuth}from"../auth/useAuth"
const API=import.meta.env.VITE_API_URL||"http://localhost:8000"
export default function ContactPage(){
  const{user}=useAuth()
  const[form,setForm]=useState({username:user?.username||"",email:user?.email||"",subject:"",message:""})
  const[sent,setSent]=useState(false)
  const oc=e=>setForm(p=>({...p,[e.target.name]:e.target.value}))
  async function submit(e){
    e.preventDefault()
    await fetch(`${API}/api/contact/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}).catch(()=>{})
    setSent(true)
  }
  return(<><Navbar/><main className="container" style={{padding:"24px 0",maxWidth:600}}>
    <h1>Contact</h1>
    {sent?<p style={{color:"green",marginTop:20}}>Message envoyé, nous reviendrons vers vous rapidement.</p>:(
      <form onSubmit={submit} style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
        <div><label style={{fontSize:13,display:"block",marginBottom:3}}>Nom d'utilisateur</label>
          <input name="username" value={form.username} onChange={oc} style={{width:"100%",padding:"7px 10px",border:"1px solid #ddd",borderRadius:4}}/></div>
        <div><label style={{fontSize:13,display:"block",marginBottom:3}}>Email *</label>
          <input name="email" type="email" value={form.email} onChange={oc} required style={{width:"100%",padding:"7px 10px",border:"1px solid #ddd",borderRadius:4}}/></div>
        <div><label style={{fontSize:13,display:"block",marginBottom:3}}>Objet *</label>
          <input name="subject" value={form.subject} onChange={oc} required style={{width:"100%",padding:"7px 10px",border:"1px solid #ddd",borderRadius:4}}/></div>
        <div><label style={{fontSize:13,display:"block",marginBottom:3}}>Message *</label>
          <textarea name="message" value={form.message} onChange={oc} required rows={5} style={{width:"100%",padding:"7px 10px",border:"1px solid #ddd",borderRadius:4}}/></div>
        <button type="submit" className="btn">Envoyer</button>
      </form>
    )}
  </main></>)
}