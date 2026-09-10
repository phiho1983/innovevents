import {
  useEffect,
  useState,
} from "react";

import Navbar
  from "../components/Navbar";

import {
  useAuth,
} from "../auth/useAuth";

import {
  getMyQuotes,
  quoteAction,
} from "../api/quotes";

import {
  selectUpcomingClientEvents,
} from "../utils/selectUpcomingClientEvents";

import "./ClientAccountPage.css";


const STATUS_LABELS = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CHANGE_REQUESTED:
    "Modification demandée",
};


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


export default function ClientAccountPage() {
  const {
    user,
  } = useAuth();

  const [
    quotes,
    setQuotes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    activeId,
    setActiveId,
  ] = useState(null);

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    events,
    setEvents,
  ] = useState([]);


  useEffect(() => {
    getMyQuotes()
      .then(
        (data) =>
          setQuotes(
            data.results ||
            data
          )
      )
      .catch(console.error)
      .finally(
        () =>
          setLoading(false)
      );

    const token =
      localStorage.getItem(
        "access_token"
      );

    fetch(
      `${API}/api/events/mine/`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    )
      .then(
        (response) =>
          response.json()
      )
      .then(
        (data) =>
          setEvents(
            selectUpcomingClientEvents(
              data.results ||
              data
            )
          )
      )
      .catch(() => {});
  }, []);


  async function doAction(
    id,
    action,
    actionReason = ""
  ) {
    try {
      const updated =
        await quoteAction(
          id,
          action,
          actionReason
        );

      setQuotes(
        (previous) =>
          previous.map(
            (quote) =>
              quote.id === id
                ? {
                    ...quote,
                    status:
                      updated.status,
                  }
                : quote
          )
      );

      setActiveId(null);
      setReason("");
    } catch (error) {
      alert(
        `Erreur: ${JSON.stringify(
          error
        )}`
      );
    }
  }

return (
    <>
      <Navbar />

      <main className="clientPage">
        <div className="container">
          <header className="clientHeader">
            <div>
              <p className="clientEyebrow">
                Espace client
              </p>

              <h1 className="clientTitle">
                Bonjour{" "}
                {user?.username ||
                  ""}
              </h1>

              <p className="clientIdentity">
                {user?.email}
              </p>
            </div>
</header>


          {events.length > 0 && (
            <section
              className="clientEvents"
              aria-labelledby="client-events-title"
            >
              <div className="clientSectionHeader">
                <div>
                  <p className="clientSectionEyebrow">
                    Agenda
                  </p>

                  <h2
                    id="client-events-title"
                    className="clientSectionTitle"
                  >
                    Prochains événements
                  </h2>
                </div>

                <span className="clientCount">
                  {events.length}
                </span>
              </div>

              <div className="clientEventList">
                {events.map(
                  (event) => (
                    <article
                      key={event.id}
                      className="clientEventRow"
                    >
                      <strong>
                        {event.title}
                      </strong>

                      <time
                        dateTime={
                          event.start_at
                        }
                      >
                        {new Date(
                          event.start_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )}
                      </time>
                    </article>
                  )
                )}
              </div>
            </section>
          )}


          <section
            className="clientQuotes"
            aria-labelledby="client-quotes-title"
          >
            <div className="clientSectionHeader">
              <div>
                <p className="clientSectionEyebrow">
                  Suivi commercial
                </p>

                <h2
                  id="client-quotes-title"
                  className="clientSectionTitle"
                >
                  Mes devis
                </h2>
              </div>

              <span className="clientCount">
                {quotes.length}
              </span>
            </div>


            {loading && (
              <div className="clientEmpty">
                Chargement des devis...
              </div>
            )}


            {!loading &&
              quotes.length === 0 && (
                <div className="clientEmpty">
                  Aucun devis pour le moment.
                </div>
              )}


            <div className="clientQuoteList">
              {quotes.map(
                (quote) => (
                  <article
                    key={quote.id}
                    className="clientQuoteCard"
                  >
                    <div className="clientQuoteHeader">
                      <div>
                        <p className="clientQuoteLabel">
                          Devis
                        </p>

                        <h3>
                          Devis{" "}
                          {quote.reference ||
                            `#${quote.id}`}
                        </h3>
                      </div>

                      <span
                        className={`clientStatus clientStatus--${quote.status?.toLowerCase()}`}
                      >
                        {STATUS_LABELS[
                          quote.status
                        ] ||
                          quote.status}
                      </span>
                    </div>


                    <div className="clientQuoteTotal">
                      <span>
                        Total TTC
                      </span>

                      <strong>
                        {quote.total_ttc} €
                      </strong>
                    </div>


                    {quote.items?.length >
                      0 && (
                      <div className="clientQuoteItems">
                        {quote.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="clientQuoteItem"
                            >
                              <span>
                                {
                                  item.label
                                }
                              </span>

                              <span>
                                {
                                  item.amount_ht
                                }{" "}
                                € HT
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}


                    {quote.status ===
                      "SENT" && (
                      <div className="clientQuoteActions">
                        <button
                          type="button"
                          className="clientAction clientAction--accept"
                          onClick={() =>
                            doAction(
                              quote.id,
                              "accept"
                            )
                          }
                        >
                          ✓ Accepter
                        </button>

                        <button
                          type="button"
                          className="clientAction clientAction--refuse"
                          onClick={() =>
                            doAction(
                              quote.id,
                              "refuse"
                            )
                          }
                        >
                          ✕ Refuser
                        </button>

                        <button
                          type="button"
                          className="clientAction clientAction--change"
                          onClick={() =>
                            setActiveId(
                              activeId ===
                                quote.id
                                ? null
                                : quote.id
                            )
                          }
                        >
                          ✎ Modification
                        </button>
                      </div>
                    )}


                    {activeId ===
                      quote.id && (
                      <div className="clientChangeRequest">
                        <label
                          htmlFor={`quote-reason-${quote.id}`}
                        >
                          Motif de modification
                        </label>

                        <textarea
                          id={`quote-reason-${quote.id}`}
                          value={reason}
                          onChange={(
                            event
                          ) =>
                            setReason(
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Expliquez le motif de modification..."
                          rows={4}
                        />

                        <button
                          type="button"
                          className="btn"
                          onClick={() =>
                            doAction(
                              quote.id,
                              "request-change",
                              reason
                            )
                          }
                        >
                          Envoyer la demande
                        </button>
                      </div>
                    )}
                  </article>
                )
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}