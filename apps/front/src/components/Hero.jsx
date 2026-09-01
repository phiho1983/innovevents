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


  useEffect(
    () => {
      let active = true;

      async function loadHero() {
        try {
          const data =
            await getHomeHero();

          if (!active) {
            return;
          }

          setHero(
            data
          );
        } catch {
          if (!active) {
            return;
          }

          setHero(
            null
          );
        }
      }

      loadHero();

      return () => {
        active = false;
      };
    },
    []
  );


  const hasHeroImage =
    Boolean(
      hero?.image_url
    );


  return (
    <section className="hero">
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
          <Link
            className="btn"
            to="/demande-de-devis"
          >
            demandez votre devis
          </Link>

          <Link
            className="btn-soft"
            to="/evenements"
          >
            voir nos événements
          </Link>
        </div>
      </div>

      <div className="hero-right">
        {hasHeroImage ? (
          <div className="hero-image">
            <img
              src={
                hero.image_url
              }
              alt={
                hero.alt_text ||
                "Événement professionnel"
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