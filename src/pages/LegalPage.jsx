import Navbar from"../components/Navbar"
import{Link}from"react-router-dom"
export default function LegalPage(){
  return(<><Navbar/><main className="container" style={{padding:"24px 0",maxWidth:700,lineHeight:1.8}}>
    <h1>Mentions légales</h1>
    <h2 style={{marginTop:24}}>Éditeur</h2>
    <p>Innov'Events SAS — Capital social : 10 000 €<br/>Siège social : 12 rue de la Créativité, 75001 Paris<br/>Forme juridique : Société par Actions Simplifiée</p>
    <h2 style={{marginTop:20}}>Contact</h2>
    <p>Email : <a href="mailto:contact@innovevents.com">contact@innovevents.com</a><br/>Téléphone : +33 1 23 45 67 89</p>
    <h2 style={{marginTop:20}}>Responsable de la publication</h2>
    <p>Chloé Dupont, Directrice de la publication</p>
    <h2 style={{marginTop:20}}>Hébergeur</h2>
    <p>Render Services Inc.<br/>525 Brannan Street, San Francisco, CA 94107, USA<br/><a href="https://render.com" target="_blank" rel="noreferrer">render.com</a></p>
    <div style={{marginTop:24,display:"flex",gap:16}}>
      <Link to="/cgu" style={{color:"#333"}}>CGU</Link>
      <Link to="/cgv" style={{color:"#333"}}>CGV</Link>
    </div>
  </main></>)
}