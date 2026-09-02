import {
  Link,
} from "react-router-dom";

import "./Footer.css";


export default function Footer() {
  return (
    <footer className="footer">
      {/* =================================================== */}
      {/* CTA final                                           */}
      {/* =================================================== */}

      <div className="footerCta">
        <div className="footerCtaContent">
          <p className="footerEyebrow">
            Votre prochain événement
          </p>

          <h2 className="footerCtaTitle">
            Un projet en tête ?
            <br />
            <em>Parlons-en.</em>
          </h2>

          <p className="footerCtaText">
            Innov&apos;Events vous accompagne de la conception
            à la réalisation pour créer un événement
            professionnel à votre image.
          </p>
        </div>

        <Link
          to="/demande-de-devis"
          className="footerCtaButton"
        >
          Démarrer un projet

          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>


      {/* =================================================== */}
      {/* Navigation                                          */}
      {/* =================================================== */}

      <div className="footerMain">
        <div className="footerBrand">
          <Link
            to="/"
            className="footerLogo"
            aria-label="Innov'Events - Accueil"
          >
            <span>
              Innov
            </span>

            <span
              className="footerLogoAccent"
              aria-hidden="true"
            >
              ’
            </span>

            <span>
              Events
            </span>
          </Link>

          <p className="footerBrandText">
            Créateur d&apos;expériences
            événementielles professionnelles.
          </p>
        </div>


        <div className="footerCol">
          <h3>
            Navigation
          </h3>

          <Link to="/">
            Accueil
          </Link>

          <Link to="/evenements">
            Événements
          </Link>

          <Link to="/avis">
            Avis
          </Link>

          <Link to="/contact">
            Contact
          </Link>
        </div>


        <div className="footerCol">
          <h3>
            Votre projet
          </h3>

          <Link to="/demande-de-devis">
            Demande de devis
          </Link>

          <Link to="/evenements">
            Nos réalisations
          </Link>

          <Link to="/contact">
            Nous contacter
          </Link>
        </div>


        <div className="footerCol footerContact">
          <h3>
            Contact
          </h3>

          <a
            href="mailto:contact@innov-events.com"
            className="footerEmail"
          >
            contact@innov-events.com
          </a>

          <p>
            France
          </p>
        </div>
      </div>


      {/* =================================================== */}
      {/* Bas de page                                         */}
      {/* =================================================== */}

      <div className="footerBottom">
        <div className="footerCopy">
          © 2026 Innov&apos;Events
        </div>

        <div className="footerLegal">
          <Link to="/mentions-legales">
            Mentions légales
          </Link>

          <span aria-hidden="true">
            ·
          </span>

          <span>
            Tous droits réservés
          </span>
        </div>
      </div>
    </footer>
  );
}