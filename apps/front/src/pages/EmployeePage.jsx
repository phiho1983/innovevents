import {
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";

import {
  useAuth,
} from "../auth/useAuth";

import {
  apiFetch,
} from "../api/client";

import {
  getProspects,
  updateProspectStatus,
} from "../api/prospects";

import {
  createQuote,
  getQuotes,
  sendQuote,
} from "../api/quotes";

import {
  getContactMessages,
  updateContactMessage,
} from "../api/contactMessages";


const STATUS_LABELS = {
  TO_CONTACT: "À contacter",
  CONTACTED: "Contacté",
  QUALIFIED: "Qualifié",
  ARCHIVED: "Archivé",
};


const STATUS_COLORS = {
  TO_CONTACT: "#fff3cd",
  CONTACTED: "#cce5ff",
  QUALIFIED: "#d4edda",
  ARCHIVED: "#f8d7da",
};


const QUOTE_STATUS_LABELS = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CHANGE_REQUESTED: "Modification demandée",
};


const EVENT_STATUS_LABELS = {
  DRAFT: "Brouillon",
  ACCEPTED: "Accepté",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};


const EVENT_TYPE_LABELS = {
  SEMINAR: "Séminaire",
  CONFERENCE: "Conférence",
  PARTY: "Soirée d'entreprise",
  OTHER: "Autre",
};


function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || [];
}


function formatError(error) {
  if (!error) {
    return "Une erreur est survenue.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.detail) {
    return error.detail;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Une erreur est survenue.";
  }
}


export default function EmployeePage() {
  const {
    user,
  } = useAuth();

  const [
    activeTab,
    setActiveTab,
  ] = useState("prospects");

  const [
    prospects,
    setProspects,
  ] = useState([]);

  const [
    prospectsLoading,
    setProspectsLoading,
  ] = useState(true);

  const [
    prospectsError,
    setProspectsError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    messagesLoading,
    setMessagesLoading,
  ] = useState(false);

  const [
    messagesLoaded,
    setMessagesLoaded,
  ] = useState(false);

  const [
    messagesError,
    setMessagesError,
  ] = useState("");

  const [
    messageActionId,
    setMessageActionId,
  ] = useState(null);

  const [
    quotes,
    setQuotes,
  ] = useState([]);

  const [
    quotesLoading,
    setQuotesLoading,
  ] = useState(false);

  const [
    quotesLoaded,
    setQuotesLoaded,
  ] = useState(false);

  const [
    quotesError,
    setQuotesError,
  ] = useState("");

  const [
    events,
    setEvents,
  ] = useState([]);

  const [
    eventsLoading,
    setEventsLoading,
  ] = useState(false);

  const [
    eventsLoaded,
    setEventsLoaded,
  ] = useState(false);

  const [
    eventsError,
    setEventsError,
  ] = useState("");

  const [
    eventActionId,
    setEventActionId,
  ] = useState(null);

  const [
    notes,
    setNotes,
  ] = useState([]);

  const [
    notesLoading,
    setNotesLoading,
  ] = useState(false);

  const [
    notesLoaded,
    setNotesLoaded,
  ] = useState(false);

  const [
    notesError,
    setNotesError,
  ] = useState("");


  useEffect(() => {
    let active = true;

    async function loadProspects() {
      try {
        const data =
          await getProspects();

        if (active) {
          setProspects(
            normalizeList(data)
          );
        }
      } catch (loadError) {
        if (active) {
          setProspectsError(
            formatError(loadError)
          );
        }
      } finally {
        if (active) {
          setProspectsLoading(false);
        }
      }
    }

    loadProspects();

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (
      activeTab !== "messages"
      || messagesLoaded
    ) {
      return;
    }

    let active = true;

    async function loadMessages() {
      setMessagesLoading(true);
      setMessagesError("");

      try {
        const data =
          await getContactMessages();

        if (active) {
          setMessages(
            normalizeList(data)
          );

          setMessagesLoaded(true);
        }
      } catch (loadError) {
        if (active) {
          setMessagesError(
            formatError(loadError)
          );
        }
      } finally {
        if (active) {
          setMessagesLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, [
    activeTab,
    messagesLoaded,
  ]);


  useEffect(() => {
    if (
      activeTab !== "quotes"
      || quotesLoaded
    ) {
      return;
    }

    let active = true;

    async function loadQuotes() {
      setQuotesLoading(true);
      setQuotesError("");

      try {
        const data =
          await getQuotes();

        if (active) {
          setQuotes(
            normalizeList(data)
          );

          setQuotesLoaded(true);
        }
      } catch (loadError) {
        if (active) {
          setQuotesError(
            formatError(loadError)
          );
        }
      } finally {
        if (active) {
          setQuotesLoading(false);
        }
      }
    }

    loadQuotes();

    return () => {
      active = false;
    };
  }, [
    activeTab,
    quotesLoaded,
  ]);


  useEffect(() => {
    if (
      activeTab !== "events"
      || eventsLoaded
    ) {
      return;
    }

    let active = true;

    async function loadEvents() {
      setEventsLoading(true);
      setEventsError("");

      try {
        const data =
          await apiFetch(
            "/api/events/"
          );

        if (active) {
          const privateEvents =
            normalizeList(data).filter(
              (event) =>
                event.client !== null
                && event.client !== undefined
            );

          setEvents(
            privateEvents
          );

          setEventsLoaded(true);
        }
      } catch (loadError) {
        if (active) {
          setEventsError(
            formatError(loadError)
          );
        }
      } finally {
        if (active) {
          setEventsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [
    activeTab,
    eventsLoaded,
  ]);


  useEffect(() => {
    if (
      activeTab !== "notes"
      || notesLoaded
    ) {
      return;
    }

    let active = true;

    async function loadNotes() {
      setNotesLoading(true);
      setNotesError("");

      try {
        const data =
          await apiFetch(
            "/api/notes/"
          );

        if (active) {
          setNotes(
            normalizeList(data)
          );

          setNotesLoaded(true);
        }
      } catch (loadError) {
        if (active) {
          setNotesError(
            formatError(loadError)
          );
        }
      } finally {
        if (active) {
          setNotesLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      active = false;
    };
  }, [
    activeTab,
    notesLoaded,
  ]);


  async function changeStatus(
    prospectId,
    nextStatus,
  ) {
    const currentProspect =
      prospects.find(
        (prospect) =>
          prospect.id === prospectId
      );

    const previousStatus =
      currentProspect?.status;

    setProspectsError("");
    setUpdatingId(prospectId);

    setProspects(
      (previousProspects) =>
        previousProspects.map(
          (prospect) =>
            prospect.id === prospectId
              ? {
                  ...prospect,
                  status: nextStatus,
                }
              : prospect
        )
    );

    try {
      const updatedProspect =
        await updateProspectStatus(
          prospectId,
          nextStatus
        );

      setProspects(
        (previousProspects) =>
          previousProspects.map(
            (prospect) =>
              prospect.id === prospectId
                ? {
                    ...prospect,
                    status:
                      updatedProspect?.status
                      || nextStatus,
                  }
                : prospect
          )
      );
    } catch (updateError) {
      if (previousStatus) {
        setProspects(
          (previousProspects) =>
            previousProspects.map(
              (prospect) =>
                prospect.id
                  === prospectId
                  ? {
                      ...prospect,
                      status:
                        previousStatus,
                    }
                  : prospect
            )
        );
      }

      setProspectsError(
        formatError(updateError)
      );
    } finally {
      setUpdatingId(null);
    }
  }


  async function changeMessageStatus(
    messageId,
    nextStatus,
  ) {
    const previousMessage =
      messages.find(
        (message) =>
          message.id === messageId
      );

    setMessagesError("");
    setMessageActionId(
      messageId
    );

    setMessages(
      (previousMessages) =>
        previousMessages.map(
          (message) =>
            message.id === messageId
              ? {
                  ...message,
                  status: nextStatus,
                }
              : message
        )
    );

    try {
      const updatedMessage =
        await updateContactMessage(
          messageId,
          {
            status: nextStatus,
          }
        );

      if (
        updatedMessage?.status
        && updatedMessage.status
          !== nextStatus
      ) {
        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (message) =>
                message.id
                  === messageId
                  ? {
                      ...message,
                      status:
                        updatedMessage
                          .status,
                    }
                  : message
            )
        );
      }
    } catch (updateError) {
      if (previousMessage) {
        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (message) =>
                message.id
                  === messageId
                  ? previousMessage
                  : message
            )
        );
      }

      setMessagesError(
        formatError(updateError)
      );
    } finally {
      setMessageActionId(null);
    }
  }


  async function transitionEvent(
    eventId,
    action,
  ) {
    setEventsError("");
    setEventActionId(eventId);

    try {
      const result =
        await apiFetch(
          `/api/events/${eventId}/${action}/`,
          {
            method: "POST",
          }
        );

      setEvents(
        (previousEvents) =>
          previousEvents.map(
            (event) =>
              event.id === eventId
                ? {
                    ...event,
                    status:
                      result?.status
                      || event.status,
                  }
                : event
          )
      );
    } catch (transitionError) {
      setEventsError(
        formatError(
          transitionError
        )
      );
    } finally {
      setEventActionId(null);
    }
  }


  return (
    <>
      <Navbar />

      <main
        className="container"
        style={{
          padding: "24px 0",
        }}
      >
        <div
          style={{
            marginBottom: 24,
          }}
        >
          <h1
            style={{
              marginBottom: 4,
            }}
          >
            Espace employé
          </h1>

          <p
            style={{
              color: "#666",
              margin: 0,
            }}
          >
            Connecté : {user?.username}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            borderBottom:
              "1px solid #ddd",
            flexWrap: "wrap",
          }}
        >
          <TabButton
            active={
              activeTab === "prospects"
            }
            onClick={
              () =>
                setActiveTab(
                  "prospects"
                )
            }
          >
            Demandes
          </TabButton>

          <TabButton
            active={
              activeTab === "messages"
            }
            onClick={
              () =>
                setActiveTab(
                  "messages"
                )
            }
          >
            Messages
          </TabButton>

          <TabButton
            active={
              activeTab === "quotes"
            }
            onClick={
              () =>
                setActiveTab(
                  "quotes"
                )
            }
          >
            Devis
          </TabButton>

          <TabButton
            active={
              activeTab === "events"
            }
            onClick={
              () =>
                setActiveTab(
                  "events"
                )
            }
          >
            Événements
          </TabButton>

          <TabButton
            active={
              activeTab === "notes"
            }
            onClick={
              () =>
                setActiveTab(
                  "notes"
                )
            }
          >
            Notes
          </TabButton>
        </div>

        {activeTab === "prospects" && (
          <ProspectsSection
            prospects={prospects}
            loading={
              prospectsLoading
            }
            error={
              prospectsError
            }
            updatingId={
              updatingId
            }
            onStatusChange={
              changeStatus
            }
          />
        )}

        {activeTab === "messages" && (
          <MessagesSection
            messages={messages}
            loading={
              messagesLoading
            }
            error={
              messagesError
            }
            actionId={
              messageActionId
            }
            onStatusChange={
              changeMessageStatus
            }
          />
        )}

        {activeTab === "quotes" && (
          <QuotesSection
            prospects={prospects}
            quotes={quotes}
            setQuotes={setQuotes}
            loading={quotesLoading}
            error={quotesError}
            setError={
              setQuotesError
            }
          />
        )}

        {activeTab === "events" && (
          <EventsSection
            events={events}
            loading={eventsLoading}
            error={eventsError}
            actionId={
              eventActionId
            }
            onTransition={
              transitionEvent
            }
          />
        )}

        {activeTab === "notes" && (
          <NotesSection
            notes={notes}
            setNotes={setNotes}
            loading={notesLoading}
            error={notesError}
            setError={
              setNotesError
            }
          />
        )}
      </main>
    </>
  );
}


function TabButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "9px 16px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontWeight:
          active
            ? "600"
            : "400",
        borderBottom:
          active
            ? "2px solid #000"
            : "2px solid transparent",
      }}
    >
      {children}
    </button>
  );
}


function MessagesSection({
  messages,
  loading,
  error,
  actionId,
  onStatusChange,
}) {
  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "NEW"
  );


  const pipelineTabs = [
    [
      "NEW",
      "Nouveaux",
    ],
    [
      "READ",
      "Lus",
    ],
    [
      "REPLIED",
      "Répondus",
    ],
    [
      "ARCHIVED",
      "Archivés",
    ],
  ];


  const labels = {
    NEW: "Nouveau",
    READ: "Lu",
    REPLIED: "Répondu",
    ARCHIVED: "Archivé",
  };


  const colors = {
    NEW: "#fff3cd",
    READ: "#cce5ff",
    REPLIED: "#d4edda",
    ARCHIVED: "#f8d7da",
  };


  const counts =
    Object.fromEntries(
      pipelineTabs.map(
        ([status]) => [
          status,
          messages.filter(
            (message) =>
              message.status === status
          ).length,
        ]
      )
    );


  const visibleMessages =
    messages.filter(
      (message) =>
        message.status
        === statusFilter
    );


  return (
    <section>
      <h2>
        Messages ({messages.length})
      </h2>


      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {pipelineTabs.map(
          ([
            status,
            label,
          ]) => (
            <button
              key={status}
              type="button"
              onClick={
                () =>
                  setStatusFilter(
                    status
                  )
              }
              style={{
                padding:
                  "8px 12px",

                borderRadius:
                  6,

                border:
                  statusFilter
                  === status
                    ? "2px solid #111"
                    : "1px solid #ddd",

                background:
                  statusFilter
                  === status
                    ? "#f5f5f5"
                    : "#fff",

                fontWeight:
                  statusFilter
                  === status
                    ? "600"
                    : "400",

                cursor:
                  "pointer",
              }}
            >
              {label} (
              {
                counts[
                  status
                ] || 0
              }
              )
            </button>
          )
        )}
      </div>


      {error && (
        <ErrorMessage
          message={error}
        />
      )}


      {loading && (
        <p>
          Chargement...
        </p>
      )}


      {!loading
        && visibleMessages.length
          === 0
        && (
          <p>
            Aucun message dans
            cette catégorie.
          </p>
        )}


      {!loading
        && visibleMessages.map(
          (message) => (
            <article
              key={message.id}
              style={{
                border:
                  "1px solid #eee",

                borderRadius:
                  8,

                padding:
                  14,

                marginBottom:
                  10,

                background:
                  "#fff",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "flex-start",

                  gap:
                    12,
                }}
              >
                <strong>
                  {message.name}
                </strong>

                <span
                  style={{
                    padding:
                      "4px 8px",

                    borderRadius:
                      999,

                    fontSize:
                      12,

                    background:
                      colors[
                        message.status
                      ]
                      || "#f5f5f5",
                  }}
                >
                  {
                    labels[
                      message.status
                    ]
                    || message.status
                  }
                </span>
              </div>


              <div
                style={{
                  fontSize:
                    13,

                  color:
                    "#666",

                  marginTop:
                    4,
                }}
              >
                {message.email}
              </div>


              {message.subject && (
                <h3>
                  {message.subject}
                </h3>
              )}


              <p
                style={{
                  whiteSpace:
                    "pre-wrap",
                }}
              >
                {message.message}
              </p>


              <div
                style={{
                  display:
                    "flex",

                  gap:
                    8,

                  flexWrap:
                    "wrap",
                }}
              >
                {
                  message.status
                  === "NEW"
                  && (
                    <button
                      type="button"
                      disabled={
                        actionId
                        === message.id
                      }
                      onClick={
                        () =>
                          onStatusChange(
                            message.id,
                            "READ"
                          )
                      }
                    >
                      Marquer comme lu
                    </button>
                  )
                }


                {
                  message.status
                  === "READ"
                  && (
                    <button
                      type="button"
                      disabled={
                        actionId
                        === message.id
                      }
                      onClick={
                        () =>
                          onStatusChange(
                            message.id,
                            "REPLIED"
                          )
                      }
                    >
                      Marquer répondu
                    </button>
                  )
                }


                {
                  message.status
                  !== "ARCHIVED"
                  && (
                    <button
                      type="button"
                      disabled={
                        actionId
                        === message.id
                      }
                      onClick={
                        () =>
                          onStatusChange(
                            message.id,
                            "ARCHIVED"
                          )
                      }
                    >
                      Archiver
                    </button>
                  )
                }


                {
                  message.status
                  === "ARCHIVED"
                  && (
                    <button
                      type="button"
                      disabled={
                        actionId
                        === message.id
                      }
                      onClick={
                        () =>
                          onStatusChange(
                            message.id,
                            "NEW"
                          )
                      }
                    >
                      Restaurer
                    </button>
                  )
                }
              </div>
            </article>
          )
        )}
    </section>
  );
}


function ProspectsSection({
  prospects,
  loading,
  error,
  updatingId,
  onStatusChange,
}) {
  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "TO_CONTACT"
  );


  const pipelineTabs = [
    [
      "TO_CONTACT",
      "À traiter",
    ],
    [
      "CONTACTED",
      "Contactées",
    ],
    [
      "QUALIFIED",
      "Qualifiées",
    ],
    [
      "ARCHIVED",
      "Archivées",
    ],
  ];


  const counts =
    Object.fromEntries(
      pipelineTabs.map(
        ([status]) => [
          status,
          prospects.filter(
            (prospect) =>
              prospect.status
              === status
          ).length,
        ]
      )
    );


  const visibleProspects =
    prospects.filter(
      (prospect) =>
        prospect.status
        === statusFilter
    );


  return (
    <section>
      <h2>
        Demandes
      </h2>

      <p
        style={{
          color: "#666",
          fontSize: 14,
        }}
      >
        Suivi des demandes de projet,
        qualification et préparation
        des devis commerciaux.
      </p>


      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {pipelineTabs.map(
          ([
            status,
            label,
          ]) => (
            <button
              key={status}
              type="button"
              onClick={
                () =>
                  setStatusFilter(
                    status
                  )
              }
              style={{
                padding:
                  "8px 12px",

                borderRadius:
                  6,

                border:
                  statusFilter
                  === status
                    ? "2px solid #111"
                    : "1px solid #ddd",

                background:
                  statusFilter
                  === status
                    ? "#f5f5f5"
                    : "#fff",

                fontWeight:
                  statusFilter
                  === status
                    ? "600"
                    : "400",

                cursor:
                  "pointer",
              }}
            >
              {label} (
              {
                counts[
                  status
                ] || 0
              }
              )
            </button>
          )
        )}
      </div>


      {error && (
        <ErrorMessage
          message={error}
        />
      )}


      {loading && (
        <p>
          Chargement...
        </p>
      )}


      {!loading
        && visibleProspects.length
          === 0
        && (
          <p
            style={{
              color: "#888",
            }}
          >
            Aucune demande dans
            cette catégorie.
          </p>
        )}


      {!loading
        && visibleProspects.length
          > 0
        && (
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {visibleProspects.map(
              (prospect) => (
                <article
                  key={
                    prospect.id
                  }
                  style={{
                    border:
                      "1px solid #eee",

                    borderRadius:
                      8,

                    padding:
                      14,

                    background:
                      "#fff",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "flex-start",

                      gap:
                        12,
                    }}
                  >
                    <div>
                      <b>
                        {
                          prospect
                            .first_name
                        }{" "}
                        {
                          prospect
                            .last_name
                        }
                      </b>

                      <div
                        style={{
                          marginTop:
                            4,

                          fontSize:
                            13,

                          color:
                            "#666",
                        }}
                      >
                        <a
                          href={
                            `mailto:${prospect.email}`
                          }
                        >
                          {
                            prospect
                              .email
                          }
                        </a>
                      </div>
                    </div>


                    <span
                      style={{
                        padding:
                          "4px 8px",

                        borderRadius:
                          999,

                        fontSize:
                          12,

                        background:
                          STATUS_COLORS[
                            prospect
                              .status
                          ]
                          || "#f5f5f5",
                      }}
                    >
                      {
                        STATUS_LABELS[
                          prospect
                            .status
                        ]
                        || prospect
                          .status
                      }
                    </span>
                  </div>


                  <div
                    style={{
                      marginTop:
                        10,

                      fontSize:
                        13,
                    }}
                  >
                    {prospect.company
                      && (
                        <div>
                          Société :{" "}
                          {
                            prospect
                              .company
                          }
                        </div>
                      )}

                    {prospect.event_type
                      && (
                        <div>
                          Événement :{" "}
                          {
                            prospect
                              .event_type
                          }
                        </div>
                      )}

                    {prospect.created_at
                      && (
                        <div>
                          Reçue le :{" "}
                          {
                            new Date(
                              prospect
                                .created_at
                            )
                              .toLocaleDateString(
                                "fr-FR"
                              )
                          }
                        </div>
                      )}
                  </div>


                  <div
                    style={{
                      display:
                        "flex",

                      gap:
                        8,

                      flexWrap:
                        "wrap",

                      marginTop:
                        12,
                    }}
                  >
                    {
                      prospect.status
                      === "TO_CONTACT"
                      && (
                        <button
                          type="button"
                          disabled={
                            updatingId
                            === prospect.id
                          }
                          onClick={
                            () =>
                              onStatusChange(
                                prospect.id,
                                "CONTACTED"
                              )
                          }
                        >
                          Marquer contactée
                        </button>
                      )
                    }


                    {
                      prospect.status
                      === "CONTACTED"
                      && (
                        <button
                          type="button"
                          disabled={
                            updatingId
                            === prospect.id
                          }
                          onClick={
                            () =>
                              onStatusChange(
                                prospect.id,
                                "QUALIFIED"
                              )
                          }
                        >
                          Qualifier
                        </button>
                      )
                    }


                    {
                      prospect.status
                      !== "ARCHIVED"
                      && (
                        <button
                          type="button"
                          disabled={
                            updatingId
                            === prospect.id
                          }
                          onClick={
                            () =>
                              onStatusChange(
                                prospect.id,
                                "ARCHIVED"
                              )
                          }
                        >
                          Archiver
                        </button>
                      )
                    }


                    {
                      prospect.status
                      === "ARCHIVED"
                      && (
                        <button
                          type="button"
                          disabled={
                            updatingId
                            === prospect.id
                          }
                          onClick={
                            () =>
                              onStatusChange(
                                prospect.id,
                                "TO_CONTACT"
                              )
                          }
                        >
                          Restaurer
                        </button>
                      )
                    }
                  </div>
                </article>
              )
            )}
          </div>
        )}
    </section>
  );
}


function QuotesSection({
  prospects,
  quotes,
  setQuotes,
  loading,
  error,
  setError,
}) {
  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const [
    sendingId,
    setSendingId,
  ] = useState(null);

  const [
    success,
    setSuccess,
  ] = useState("");


  async function handleSendQuote(
    quote
  ) {
    setSendingId(
      quote.id
    );

    setError("");
    setSuccess("");


    try {
      const result =
        await sendQuote(
          quote.id
        );


      setQuotes(
        (previousQuotes) =>
          previousQuotes.map(
            (currentQuote) =>
              currentQuote.id
              === quote.id
                ? {
                    ...currentQuote,
                    status:
                      result?.status
                      || "SENT",
                    client:
                      result?.client_id
                      || currentQuote.client,
                  }
                : currentQuote
          )
      );


      if (
        result?.client_created
        && result?.activation_required
        && result?.activation_email_sent
      ) {
        setSuccess(
          `Devis #${quote.id} envoyé. `
          + "Le compte client a été créé "
          + "et le lien d'activation "
          + "a été envoyé par e-mail."
        );

      } else if (
        result?.activation_required
        && !result?.activation_email_sent
      ) {
        setSuccess(
          `Devis #${quote.id} envoyé, `
          + "mais l'e-mail d'activation "
          + "n'a pas pu être envoyé."
        );

      } else {
        setSuccess(
          `Devis #${quote.id} envoyé au client.`
        );
      }

    } catch (sendError) {
      setError(
        formatError(
          sendError
        )
      );

    } finally {
      setSendingId(
        null
      );
    }
  }


  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: 4,
            }}
          >
            Devis
          </h2>

          <p
            style={{
              color: "#666",
              fontSize: 14,
              margin: 0,
            }}
          >
            Création et envoi
            des devis aux clients.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={
            () =>
              setShowCreateForm(
                (previous) =>
                  !previous
              )
          }
        >
          {showCreateForm
            ? "Annuler"
            : "+ Nouveau devis"}
        </button>
      </div>


      {error && (
        <ErrorMessage
          message={error}
        />
      )}


      {success && (
        <p
          style={{
            color: "#0f5132",
            background: "#d1e7dd",
            border:
              "1px solid #badbcc",
            borderRadius: 6,
            padding: "9px 12px",
          }}
        >
          {success}
        </p>
      )}


      {showCreateForm && (
        <CreateQuoteForm
          prospects={
            prospects
          }
          onSuccess={
            (quote) => {
              setQuotes(
                (previousQuotes) => [
                  quote,
                  ...previousQuotes,
                ]
              );

              setShowCreateForm(
                false
              );
            }
          }
          onError={
            setError
          }
        />
      )}


      {loading && (
        <p>
          Chargement...
        </p>
      )}


      {!loading
        && quotes.length === 0
        && (
          <p
            style={{
              color: "#888",
            }}
          >
            Aucun devis.
          </p>
        )}


      {!loading
        && quotes.map(
          (quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              sending={
                sendingId
                === quote.id
              }
              onSend={
                handleSendQuote
              }
            />
          )
        )}
    </section>
  );
}


function QuoteCard({
  quote,
  sending,
  onSend,
}) {
  const API =
    import.meta.env.VITE_API_URL
    || "http://localhost:8000";


  return (
    <article
      style={{
        border:
          "1px solid #eee",
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <strong>
          Devis #{quote.id}
        </strong>

        <span>
          {
            QUOTE_STATUS_LABELS[
              quote.status
            ]
            || quote.status
          }
        </span>
      </div>


      <div
        style={{
          fontSize: 13,
          color: "#555",
          marginBottom: 8,
        }}
      >
        HT : {quote.total_ht} €
        {" | "}

        TVA : {quote.total_tva} €
        {" | "}

        <strong>
          TTC : {quote.total_ttc} €
        </strong>
      </div>


      {quote.items?.map(
        (item) => (
          <div
            key={
              item.id
              ?? `${item.label}-${item.amount_ht}`
            }
            style={{
              fontSize: 12,
              color: "#777",
              marginBottom: 3,
            }}
          >
            {item.label}
            {" — "}
            {item.amount_ht} €
          </div>
        )
      )}


      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <a
          href={
            `${API}/api/quotes/${quote.id}/pdf/`
          }
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
          }}
        >
          Télécharger PDF
        </a>


        {quote.status === "DRAFT" && (
          <button
            type="button"
            disabled={sending}
            onClick={
              () =>
                onSend(
                  quote
                )
            }
            style={{
              fontSize: 12,
              padding: "5px 10px",
              border:
                "1px solid #badbcc",
              borderRadius: 4,
              background: "#d1e7dd",
              cursor: "pointer",
            }}
          >
            {sending
              ? "Envoi..."
              : "Envoyer le devis"}
          </button>
        )}
      </div>
    </article>
  );
}


function CreateQuoteForm({
  prospects,
  onSuccess,
  onError,
}) {
  const [
    form,
    setForm,
  ] = useState({
    prospect: "",
    tva_rate: "0.20",
  });

  const [
    items,
    setItems,
  ] = useState([
    {
      label: "",
      amount_ht: "",
    },
  ]);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const totalHT =
    items.reduce(
      (
        total,
        item,
      ) =>
        total
        + (
          Number.parseFloat(
            item.amount_ht
          )
          || 0
        ),
      0
    );

  const tvaRate =
    Number.parseFloat(
      form.tva_rate
    ) || 0;

  const totalTVA =
    totalHT * tvaRate;

  const totalTTC =
    totalHT + totalTVA;


  function updateItem(
    index,
    field,
    value,
  ) {
    setItems(
      (previousItems) =>
        previousItems.map(
          (
            item,
            currentIndex,
          ) =>
            currentIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );
  }


  function addItem() {
    setItems(
      (previousItems) => [
        ...previousItems,
        {
          label: "",
          amount_ht: "",
        },
      ]
    );
  }


  function removeItem(
    index,
  ) {
    setItems(
      (previousItems) =>
        previousItems.filter(
          (
            _item,
            currentIndex,
          ) =>
            currentIndex !== index
        )
    );
  }


  async function submit(
    event,
  ) {
    event.preventDefault();

    onError("");

    const validItems =
      items.filter(
        (item) =>
          item.label.trim()
          && item.amount_ht !== ""
      );

    const payload = {
      prospect:
        Number(
          form.prospect
        ),
      tva_rate:
        form.tva_rate,
      items:
        validItems.map(
          (item) => ({
            label:
              item.label.trim(),
            amount_ht:
              item.amount_ht,
          })
        ),
    };

    setSubmitting(true);

    try {
      const quote =
        await createQuote(
          payload
        );

      onSuccess(
        quote
      );
    } catch (creationError) {
      onError(
        formatError(
          creationError
        )
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <form
      onSubmit={submit}
      style={{
        border:
          "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        background: "#f9f9f9",
      }}
    >
      <h3
        style={{
          marginTop: 0,
        }}
      >
        Nouveau devis
      </h3>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label
            htmlFor="quote-prospect"
            style={{
              display: "block",
              marginBottom: 4,
            }}
          >
            Demande
          </label>

          <select
            id="quote-prospect"
            required
            value={
              form.prospect
            }
            onChange={
              (event) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    prospect:
                      event.target
                        .value,
                  })
                )
            }
          >
            <option value="">
              Sélectionner une demande
            </option>

            {prospects
              .filter(
                (prospect) =>
                  prospect.status
                  !== "ARCHIVED"
              )
              .map(
                (prospect) => (
                  <option
                    key={
                      prospect.id
                    }
                    value={
                      prospect.id
                    }
                  >
                    {
                      prospect.first_name
                    }{" "}
                    {
                      prospect.last_name
                    }
                    {
                      prospect.event_type
                        ? ` — ${prospect.event_type}`
                        : ""
                    }
                  </option>
                )
              )}
          </select>

          {prospects.length > 0 && (
            <div
              style={{
                marginTop: 4,
                color: "#777",
                fontSize: 12,
              }}
            >
              Demandes disponibles :
              {" "}
              {prospects.map(
                (prospect) =>
                  `${prospect.first_name} ${prospect.last_name}`
              ).join(", ")}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="quote-tva"
            style={{
              display: "block",
              marginBottom: 4,
            }}
          >
            TVA
          </label>

          <select
            id="quote-tva"
            value={
              form.tva_rate
            }
            onChange={
              (event) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    tva_rate:
                      event.target
                        .value,
                  })
                )
            }
          >
            <option value="0.20">
              20 %
            </option>

            <option value="0.10">
              10 %
            </option>

            <option value="0.055">
              5,5 %
            </option>

            <option value="0.00">
              0 %
            </option>
          </select>
        </div>
      </div>

      {items.map(
        (
          item,
          index,
        ) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns:
                "2fr 1fr auto",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <label
                htmlFor={
                  `quote-label-${index}`
                }
                style={{
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Libellé prestation
              </label>

              <input
                id={
                  `quote-label-${index}`
                }
                value={
                  item.label
                }
                onChange={
                  (event) =>
                    updateItem(
                      index,
                      "label",
                      event.target
                        .value
                    )
                }
              />
            </div>

            <div>
              <label
                htmlFor={
                  `quote-amount-${index}`
                }
                style={{
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Montant HT
              </label>

              <input
                id={
                  `quote-amount-${index}`
                }
                type="number"
                min="0"
                step="0.01"
                value={
                  item.amount_ht
                }
                onChange={
                  (event) =>
                    updateItem(
                      index,
                      "amount_ht",
                      event.target
                        .value
                    )
                }
              />
            </div>

            {items.length > 1 && (
              <button
                type="button"
                aria-label={
                  `Supprimer prestation ${index + 1}`
                }
                onClick={
                  () =>
                    removeItem(
                      index
                    )
                }
              >
                ×
              </button>
            )}
          </div>
        )
      )}

      <button
        type="button"
        onClick={addItem}
        style={{
          marginBottom: 16,
        }}
      >
        + Ajouter prestation
      </button>

      <div
        style={{
          border:
            "1px solid #ddd",
          borderRadius: 6,
          padding: 12,
          marginBottom: 16,
          background: "#fff",
        }}
      >
        <div>
          Total HT :{" "}
          <strong>
            {totalHT.toFixed(2)} €
          </strong>
        </div>

        <div>
          TVA :{" "}
          <strong>
            {totalTVA.toFixed(2)} €
          </strong>
        </div>

        <div>
          Total TTC :{" "}
          <strong>
            {totalTTC.toFixed(2)} €
          </strong>
        </div>
      </div>

      <button
        type="submit"
        className="btn"
        disabled={
          submitting
        }
      >
        {submitting
          ? "Création..."
          : "Créer le devis"}
      </button>
    </form>
  );
}


function EventsSection({
  events,
  loading,
  error,
  actionId,
  onTransition,
}) {
  return (
    <section>
      <h2>
        Événements privés
      </h2>

      <p
        style={{
          color: "#666",
          fontSize: 14,
        }}
      >
        Suivi de la réalisation
        des événements appartenant
        aux clients.
      </p>

      {error && (
        <ErrorMessage
          message={error}
        />
      )}

      {loading && (
        <p>
          Chargement...
        </p>
      )}

      {!loading
        && events.length === 0
        && (
          <p
            style={{
              color: "#888",
            }}
          >
            Aucun événement privé.
          </p>
        )}

      {!loading
        && events.map(
          (event) => (
            <EventCard
              key={event.id}
              event={event}
              busy={
                actionId === event.id
              }
              onTransition={
                onTransition
              }
            />
          )
        )}
    </section>
  );
}


function EventCard({
  event,
  busy,
  onTransition,
}) {
  return (
    <article
      aria-label={
        event.title
      }
      style={{
        border:
          "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 16,
          marginBottom: 10,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              marginBottom: 4,
            }}
          >
            {event.title}
          </h3>

          <div
            style={{
              color: "#666",
              fontSize: 13,
            }}
          >
            {event.city || "—"}
            {" · "}
            {
              EVENT_TYPE_LABELS[
                event.event_type
              ]
              || event.event_type
              || "Autre"
            }
          </div>
        </div>

        <strong>
          {
            EVENT_STATUS_LABELS[
              event.status
            ]
            || event.status
          }
        </strong>
      </div>

      {event.description && (
        <p
          style={{
            fontSize: 13,
            color: "#555",
          }}
        >
          {event.description}
        </p>
      )}

      <div
        style={{
          fontSize: 13,
          color: "#666",
          marginBottom: 10,
        }}
      >
        <div>
          Début :{" "}
          {event.start_at
            ? new Date(
                event.start_at
              ).toLocaleString(
                "fr-FR"
              )
            : "—"}
        </div>

        <div>
          Fin :{" "}
          {event.end_at
            ? new Date(
                event.end_at
              ).toLocaleString(
                "fr-FR"
              )
            : "—"}
        </div>

        <div>
          Capacité :{" "}
          {event.capacity ?? "—"}
        </div>
      </div>

      {event.status
        === "ACCEPTED"
        && (
          <button
            type="button"
            disabled={busy}
            onClick={
              () =>
                onTransition(
                  event.id,
                  "start"
                )
            }
          >
            {busy
              ? "Démarrage..."
              : "Démarrer"}
          </button>
        )}

      {event.status
        === "IN_PROGRESS"
        && (
          <button
            type="button"
            disabled={busy}
            onClick={
              () =>
                onTransition(
                  event.id,
                  "complete"
                )
            }
          >
            {busy
              ? "Finalisation..."
              : "Terminer"}
          </button>
        )}
    </article>
  );
}


function NotesSection({
  notes,
  setNotes,
  loading,
  error,
  setError,
}) {
  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: 4,
            }}
          >
            Notes internes
          </h2>

          <p
            style={{
              color: "#666",
              fontSize: 14,
              margin: 0,
            }}
          >
            Notes collaboratives
            réservées aux équipes internes.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={
            () =>
              setShowCreateForm(
                (previous) =>
                  !previous
              )
          }
        >
          {showCreateForm
            ? "Annuler"
            : "+ Nouvelle note"}
        </button>
      </div>

      {error && (
        <ErrorMessage
          message={error}
        />
      )}

      {showCreateForm && (
        <CreateNoteForm
          onSuccess={
            (note) => {
              setNotes(
                (previousNotes) => [
                  note,
                  ...previousNotes,
                ]
              );

              setShowCreateForm(
                false
              );
            }
          }
          onError={
            setError
          }
        />
      )}

      {loading && (
        <p>
          Chargement...
        </p>
      )}

      {!loading
        && notes.length === 0
        && (
          <p
            style={{
              color: "#888",
            }}
          >
            Aucune note interne.
          </p>
        )}

      {!loading
        && notes.map(
          (note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={
                (updatedNote) => {
                  setNotes(
                    (previousNotes) =>
                      previousNotes.map(
                        (currentNote) =>
                          currentNote.id
                            === updatedNote.id
                            ? updatedNote
                            : currentNote
                      )
                  );
                }
              }
              onError={
                setError
              }
            />
          )
        )}
    </section>
  );
}


function CreateNoteForm({
  onSuccess,
  onError,
}) {
  const [
    clientId,
    setClientId,
  ] = useState("");

  const [
    content,
    setContent,
  ] = useState("");

  const [
    pinned,
    setPinned,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  async function submit(
    event,
  ) {
    event.preventDefault();

    onError("");
    setSubmitting(true);

    const payload = {
      client:
        Number(clientId),
      content:
        content.trim(),
      pinned,
    };

    try {
      const note =
        await apiFetch(
          "/api/notes/",
          {
            method: "POST",
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      onSuccess(
        note
      );
    } catch (creationError) {
      onError(
        formatError(
          creationError
        )
      );
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <form
      onSubmit={submit}
      style={{
        border:
          "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        background: "#f9f9f9",
      }}
    >
      <h3
        style={{
          marginTop: 0,
        }}
      >
        Nouvelle note
      </h3>

      <div
        style={{
          marginBottom: 12,
        }}
      >
        <label
          htmlFor="note-client-id"
          style={{
            display: "block",
            marginBottom: 4,
          }}
        >
          Client ID
        </label>

        <input
          id="note-client-id"
          type="number"
          min="1"
          required
          value={clientId}
          onChange={
            (event) =>
              setClientId(
                event.target.value
              )
          }
        />
      </div>

      <div
        style={{
          marginBottom: 12,
        }}
      >
        <label
          htmlFor="note-content"
          style={{
            display: "block",
            marginBottom: 4,
          }}
        >
          Contenu
        </label>

        <textarea
          id="note-content"
          required
          rows={4}
          value={content}
          onChange={
            (event) =>
              setContent(
                event.target.value
              )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <input
          type="checkbox"
          checked={pinned}
          onChange={
            (event) =>
              setPinned(
                event.target.checked
              )
          }
        />

        Épingler la note
      </label>

      <button
        type="submit"
        className="btn"
        disabled={submitting}
      >
        {submitting
          ? "Création..."
          : "Créer la note"}
      </button>
    </form>
  );
}


function NoteCard({
  note,
  onUpdate,
  onError,
}) {
  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    content,
    setContent,
  ] = useState(
    note.content
  );

  const [
    pinned,
    setPinned,
  ] = useState(
    Boolean(
      note.pinned
    )
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  async function save() {
    onError("");
    setSubmitting(true);

    const payload = {
      content:
        content.trim(),
      pinned,
    };

    try {
      const updatedNote =
        await apiFetch(
          `/api/notes/${note.id}/`,
          {
            method: "PATCH",
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      onUpdate(
        updatedNote
      );

      setEditing(false);
    } catch (updateError) {
      onError(
        formatError(
          updateError
        )
      );
    } finally {
      setSubmitting(false);
    }
  }


  function cancelEdit() {
    setContent(
      note.content
    );

    setPinned(
      Boolean(
        note.pinned
      )
    );

    setEditing(false);
  }


  return (
    <article
      aria-label={
        `Note #${note.id}`
      }
      style={{
        border:
          note.pinned
            ? "1px solid #e4c96b"
            : "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        background:
          note.pinned
            ? "#fffdf2"
            : "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: 16,
          marginBottom: 10,
        }}
      >
        <div>
          <strong>
            Note #{note.id}
          </strong>

          <div
            style={{
              fontSize: 12,
              color: "#777",
              marginTop: 3,
            }}
          >
            Client #
            {note.client ?? "—"}
            {" · "}
            Auteur #
            {note.author ?? "—"}
          </div>
        </div>

        {note.pinned && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Épinglée
          </span>
        )}
      </div>

      {!editing && (
        <>
          <p
            style={{
              whiteSpace:
                "pre-wrap",
              marginBottom: 10,
            }}
          >
            {note.content}
          </p>

          <div
            style={{
              fontSize: 12,
              color: "#888",
              marginBottom: 10,
            }}
          >
            {note.created_at
              ? new Date(
                  note.created_at
                ).toLocaleString(
                  "fr-FR"
                )
              : "Date inconnue"}
          </div>

          <button
            type="button"
            onClick={
              () =>
                setEditing(true)
            }
          >
            Modifier
          </button>
        </>
      )}

      {editing && (
        <div>
          <div
            style={{
              marginBottom: 12,
            }}
          >
            <label
              htmlFor={
                `note-content-${note.id}`
              }
              style={{
                display: "block",
                marginBottom: 4,
              }}
            >
              Contenu
            </label>

            <textarea
              id={
                `note-content-${note.id}`
              }
              rows={4}
              value={content}
              onChange={
                (event) =>
                  setContent(
                    event.target.value
                  )
              }
              style={{
                width: "100%",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={pinned}
              onChange={
                (event) =>
                  setPinned(
                    event.target
                      .checked
                  )
              }
            />

            Épingler la note
          </label>

          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <button
              type="button"
              disabled={submitting}
              onClick={save}
            >
              {submitting
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={cancelEdit}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </article>
  );
}


function ErrorMessage({
  message,
}) {
  return (
    <div
      role="alert"
      style={{
        padding: 12,
        marginBottom: 16,
        border:
          "1px solid #f5c2c7",
        borderRadius: 6,
        background: "#f8d7da",
      }}
    >
      {message}
    </div>
  );
}
