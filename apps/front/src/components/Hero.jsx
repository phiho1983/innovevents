import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  getHomeHero,
} from "../api/homeHero";


export default function Hero() {
  const [
    hero,
    setHero,
  ] = useState(null);


  useEffect(() => {
    let active = true;

    async function loadHero() {
      try {
        const data =
          await getHomeHero();

        if (!active) {
          return;
        }

        setHero(data);
      } catch {
        if (!active) {
          return;
        }

        setHero(null);
      }
    }

    loadHero();

    return () => {
      active = false;
    };
  }, []);


  const hasHeroImage =
    Boolean(hero?.image_url);


  return (
    <section className="hero">
      <div className="hero-left">
        <p className="hero-eyebrow">
          Agence événementielle
        </p>

        <h1 className="hero-title">
          Nous créons
          <br />
          des expériences
          <br />

          <em className="hero-title-accent">
            qui rassemblent.
          </em>
        </h1>

        <p className="hero-sub">
          De la conception à la production,
          Innov&apos;Events imagine des événements
          professionnels sur mesure qui marquent
          les esprits.
        </p>

        <div className="hero-actions">
          <Link
            className="btn"
            to="/demande-de-devis"
          >
            Parler de votre projet
            <span aria-hidden="true">
              →
            </span>
          </Link>

          <Link
            className="hero-link"
            to="/evenements"
          >
            Découvrir nos réalisations
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="hero-scroll-hint">
          <span
            className="hero-scroll-icon"
            aria-hidden="true"
          >
            ↓
          </span>

          <span>
            Découvrez notre univers
          </span>
        </div>
      </div>


      <div className="hero-right">
        {hasHeroImage ? (
          <div className="hero-image">
            <img
              src={hero.image_url}
              alt={
                hero.alt_text ||
                "Événement professionnel organisé par Innov'Events"
              }
            />
          </div>
        ) : (
          <div
            className="hero-placeholder"
            aria-label="Visuel à venir"
          />
        )}
      </div>
    </section>
  );
}