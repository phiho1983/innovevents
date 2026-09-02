import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";

import "./EventsPage.css";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


const EVENT_TYPES = {
  SEMINAR: "Séminaire",
  CONFERENCE: "Conférence",
  PARTY: "Soirée d'entreprise",
  OTHER: "Autre",
};


const EMPTY_FILTERS = {
  date_from: "",
  date_to: "",
  event_type: "",
  theme: "",
};


export default function EventsPage() {
  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    filters,
    setFilters,
  ] = useState({
    ...EMPTY_FILTERS,
  });


  useEffect(() => {
    loadEvents(EMPTY_FILTERS);
  }, []);


  async function loadEvents(
    activeFilters = filters
  ) {
    setLoading(true);


    const params =
      new URLSearchParams();


    if (
      activeFilters.date_from
    ) {
      params.set(
        "start_after",
        activeFilters.date_from
      );
    }


    if (
      activeFilters.date_to
    ) {
      params.set(
        "start_before",
        activeFilters.date_to
      );
    }


    if (
      activeFilters.event_type
    ) {
      params.set(
        "event_type",
        activeFilters.event_type
      );
    }


    if (
      activeFilters.theme
    ) {
      params.set(
        "theme",
        activeFilters.theme
      );
    }


    params.set(
      "public",
      "true"
    );


    try {
      const response =
        await fetch(
          `${API}/api/events/?${params}`
        );


      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status}`
        );
      }


      const data =
        await response.json();


      setEvents(
        data.results ||
        data
      );
    } catch (error) {
      console.error(
        "Erreur chargement événements :",
        error
      );

      setEvents([]);
    } finally {
      setLoading(false);
    }
  }


  function onFilter(
    event
  ) {
    const {
      name,
      value,
    } = event.target;


    setFilters(
      (
        previousFilters
      ) => ({
        ...previousFilters,
        [name]: value,
      })
    );
  }


  function resetFilters() {
    const clearedFilters = {
      ...EMPTY_FILTERS,
    };


    setFilters(
      clearedFilters
    );

    loadEvents(
      clearedFilters
    );
  }


  function handleSubmit(
    event
  ) {
    event.preventDefault();

    loadEvents(
      filters
    );
  }


  return (
    <>
      <Navbar />


      <main className="eventsPage">
        <div className="container">
          <header className="eventsHero">
            <div>
              <p className="eventsEyebrow">
                Nos réalisations
              </p>

              <h1 className="eventsHeroTitle">
                Des événements
                <br />

                <em>
                  pensés pour marquer.
                </em>
              </h1>
            </div>


            <p className="eventsHeroText">
              Découvrez une sélection
              d&apos;événements professionnels
              imaginés et réalisés par
              Innov&apos;Events.
            </p>
          </header>


          <form
            className="eventsFilters"
            onSubmit={
              handleSubmit
            }
          >
            <div className="eventsFilterField">
              <label htmlFor="event-date-from">
                Du
              </label>

              <input
                id="event-date-from"
                type="date"
                name="date_from"
                value={
                  filters.date_from
                }
                onChange={
                  onFilter
                }
              />
            </div>


            <div className="eventsFilterField">
              <label htmlFor="event-date-to">
                Au
              </label>

              <input
                id="event-date-to"
                type="date"
                name="date_to"
                value={
                  filters.date_to
                }
                onChange={
                  onFilter
                }
              />
            </div>


            <div className="eventsFilterField">
              <label htmlFor="event-type">
                Type
              </label>

              <select
                id="event-type"
                name="event_type"
                value={
                  filters.event_type
                }
                onChange={
                  onFilter
                }
              >
                <option value="">
                  Tous
                </option>

                <option value="SEMINAR">
                  Séminaire
                </option>

                <option value="CONFERENCE">
                  Conférence
                </option>

                <option value="PARTY">
                  Soirée d&apos;entreprise
                </option>

                <option value="OTHER">
                  Autre
                </option>
              </select>
            </div>


            <div className="eventsFilterField eventsThemeField">
              <label htmlFor="event-theme">
                Thème
              </label>

              <input
                id="event-theme"
                name="theme"
                value={
                  filters.theme
                }
                onChange={
                  onFilter
                }
                placeholder="Ex : Innovation"
              />
            </div>


            <div className="eventsFilterActions">
              <button
                type="submit"
                className="btn eventsFilterButton"
              >
                Filtrer
              </button>

              <button
                type="button"
                className="eventsResetButton"
                onClick={
                  resetFilters
                }
              >
                Réinitialiser
              </button>
            </div>
          </form>


          <section
            className="eventsResults"
            aria-labelledby="events-results-title"
          >
            <div className="eventsResultsHeader">
              <p className="eventsResultsEyebrow">
                Sélection
              </p>

              <h2 id="events-results-title">
                Nos événements
              </h2>

              {!loading && (
                <span className="eventsCount">
                  {events.length}{" "}
                  {
                    events.length > 1
                      ? "événements"
                      : "événement"
                  }
                </span>
              )}
            </div>


            {loading && (
              <div className="eventsState">
                Chargement des événements...
              </div>
            )}


            {!loading &&
              events.length === 0 && (
                <div className="eventsState">
                  <p>
                    Aucun événement ne correspond
                    à votre recherche.
                  </p>

                  <button
                    type="button"
                    className="eventsStateButton"
                    onClick={
                      resetFilters
                    }
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}


            {!loading &&
              events.length > 0 && (
                <div className="eventsGrid">
                  {events.map(
                    (
                      event
                    ) => (
                      <article
                        key={
                          event.id
                        }
                        className="eventCard"
                      >
                        <div className="eventCardMedia">
                          {event.image ? (
                            <img
                              src={
                                getEventImageUrl(
                                  event.image
                                )
                              }
                              alt={
                                event.title ||
                                "Événement Innov'Events"
                              }
                            />
                          ) : (
                            <div className="eventCardPlaceholder">
                              <span>
                                Innov&apos;Events
                              </span>

                              <strong>
                                Visuel à venir
                              </strong>
                            </div>
                          )}


                          {event.event_type && (
                            <span className="eventCardType">
                              {
                                EVENT_TYPES[
                                  event.event_type
                                ] ||
                                event.event_type
                              }
                            </span>
                          )}
                        </div>


                        <div className="eventCardContent">
                          <div className="eventCardMeta">
                            {event.city && (
                              <span>
                                {event.city}
                              </span>
                            )}

                            {event.start_at && (
                              <time
                                dateTime={
                                  event.start_at
                                }
                              >
                                {
                                  new Date(
                                    event.start_at
                                  )
                                    .toLocaleDateString(
                                      "fr-FR",
                                      {
                                        day:
                                          "2-digit",

                                        month:
                                          "long",

                                        year:
                                          "numeric",
                                      }
                                    )
                                }
                              </time>
                            )}
                          </div>


                          <h3>
                            {event.title}
                          </h3>


                          {event.theme && (
                            <p className="eventCardTheme">
                              {event.theme}
                            </p>
                          )}


                          {event.description && (
                            <p className="eventCardDescription">
                              {
                                event.description.length > 140
                                  ? `${event.description.substring(
                                      0,
                                      140
                                    )}...`
                                  : event.description
                              }
                            </p>
                          )}


                          <div className="eventCardFooter">
                            <Link
                              to="/demande-de-devis"
                              className="eventCardCta"
                            >
                              Imaginer votre événement

                              <span aria-hidden="true">
                                →
                              </span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
          </section>


          <section className="eventsBottomCta">
            <div>
              <p>
                Votre prochain événement
              </p>

              <h2>
                Une idée en tête ?
                <br />

                <em>
                  Faisons-la vivre.
                </em>
              </h2>
            </div>


            <Link
              to="/demande-de-devis"
              className="btn"
            >
              Parler de votre projet

              <span aria-hidden="true">
                →
              </span>
            </Link>
          </section>
        </div>
      </main>


      <Footer />
    </>
  );
}


function getEventImageUrl(
  image
) {
  if (!image) {
    return "";
  }


  if (
    image.startsWith(
      "http://"
    ) ||
    image.startsWith(
      "https://"
    )
  ) {
    return image;
  }


  if (
    image.startsWith("/")
  ) {
    return `${API}${image}`;
  }


  return `${API}/${image}`;
}