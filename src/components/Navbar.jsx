import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbarInner">
        {/* Recharge la page et revient à Home */}
        <a href="/" className="brandBtn">Innov&apos;Events</a>

        <nav className="navlinks">
          {/* IMPORTANT: depuis /login ou /signup, #events tout seul ne marche pas -> /#events */}
          <a href="/#events" className="underline">Evenements</a>
          <a href="/#avis" className="underline">Avis</a>
          <a href="/#contact" className="underline">Nous contactez</a>

          <Link to="/login" className="underline">Se connecter</Link>

          <Link to="/demande-de-devis" className="btn">
            demander votre devis
          </Link>
        </nav>
      </div>
    </header>
  );
}
