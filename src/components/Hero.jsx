import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="hero">
      {/* Gauche */}
      <div className="hero-left">
        <h1 className="hero-title">
          Organisation <br />
          d&apos;événements <br />
          professionnels <br />
          sur mesure
        </h1>

        <p className="hero-sub">
          Seminaires, soirées d&apos;entreprises,
          <br />
          lancements, teams buildings
        </p>

        <div className="hero-actions">
          <Link className="btn" to="/demande-de-devis">
            demandez votre devis
          </Link>
          <Link className="btn-soft" to="/evenements">
            voir nos événements
          </Link>
        </div>
      </div>

      {/* Droite (placeholder pastel) */}
      <div className="hero-right">
        <div className="hero-placeholder" aria-label="Visuel à venir" />
      </div>
    </section>
  );
}
