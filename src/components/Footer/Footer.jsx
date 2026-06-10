import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerInner">
        <div className="footerBrand">
          <div className="footerLogo">INNOV’EVENTS</div>
        </div>

        <div className="footerCol">
          <h4>INFORMATIONS</h4>
          <Link to="/presentations">Présentations</Link>
          <Link to="/realisations">Nos réalisations</Link>
          <Link to="/contact">Besoin d’aide ?</Link>
          <Link to="/demande-de-devis">Demande de devis</Link>
        </div>

        <div className="footerCol">
          <h4>SERVICES</h4>
          <Link to="/contact">Organisation d’évènements</Link>
          <Link to="/services/animations">Animations</Link>
          <Link to="/services/team-building">Team Building</Link>
          <Link to="/services/demande-de-devis">Devis gratuit</Link>
        </div>

        <div className="footerCol">
          <h4>NOS AGENCES</h4>
          <Link to="/agences/paris">Paris</Link>
          <Link to="/agences/lyon">Lyon</Link>
          <Link to="/agences/lille">Lille</Link>
          <Link to="/agences/bordeaux">Bordeaux</Link>
          <Link to="/agences/nice">Nice</Link>
        </div>

        <div className="footerCol">
          <h4>CONTACT</h4>

          <div className="footerContactRow">
            <span className="icon">✉️</span>
            <a href="mailto:contact@innov-events.com">contact@innov-events.com</a>
          </div>

          <div className="footerContactRow">
            <span className="icon">f</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Innov’events</a>
          </div>
          <div className="footerContactRow">
            <span className="icon">in</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Innov’events</a>
          </div>
          <div className="footerContactRow">
            <span className="icon">ig</span>
            <a href="#" onClick={(e) => e.preventDefault()}>Innov’events</a>
          </div>
        </div>
      </div>

      <div className="footerBottom">
        <div className="footerLinks">
          <Link to="/mentions-legales">Mentions légales</Link>
          <span className="dot">•</span>
          <Link to="/confidentialite">Confidentialité</Link>
          <span className="dot">•</span>
          <Link to="/cookies">Cookies</Link>
        </div>

        <div className="footerCopy">© 2026 INNOV’EVENTS — Tous droits réservés</div>
      </div>
    </footer>
  );
}
