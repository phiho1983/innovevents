import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="brand">Innov&apos;Events</div>

      <nav className="navlinks">
        <a href="#events" className="underline">Evenements</a>
        <a href="#avis" className="underline">Avis</a>
        <a href="#contact" className="underline">Nous contactez</a>
        <Link to="/login" className="underline">Se connecter</Link>

        <Link to="/demande-de-devis" className="btn">
          demander votre devis
        </Link>
      </nav>
    </header>
  );
}
