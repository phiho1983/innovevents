import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../auth/useAuth"

export default function Navbar() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <header className="navbar">
      <div className="container navbarInner">
        <a href="/" className="brandBtn">Innov'Events</a>
        <nav className="navlinks">
          <Link to="/evenements" className="underline">Événements</Link>
          <Link to="/avis"       className="underline">Avis</Link>
          <Link to="/contact"    className="underline">Contact</Link>
          {user ? (
            <>
              <Link to={user.is_staff ? "/admin" : "/client"} className="underline">
                {user.username}
              </Link>
              <button className="btn" onClick={() => { logout(); nav("/") }}>
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="underline">Se connecter</Link>
          )}
          <Link to="/demande-de-devis" className="btn">Demander un devis</Link>
        </nav>
      </div>
    </header>
  )
}