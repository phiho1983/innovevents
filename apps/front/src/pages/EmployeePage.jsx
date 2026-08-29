import {
  useEffect,
  useState,
} from "react";

import Navbar from "../components/Navbar";

import {
  useAuth,
} from "../auth/useAuth";

import {
  convertProspect,
  getProspects,
  updateProspectStatus,
} from "../api/prospects";

import {
  createQuote,
  getQuotes,
} from "../api/quotes";


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
    convertingId,
    setConvertingId,
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


  async function convertToClient(
    prospect,
  ) {
    const confirmed =
      window.confirm(
        `Convertir ${prospect.first_name} `
        + `${prospect.last_name} en client ?`
      );

    if (!confirmed) {
      return;
    }

    setProspectsError("");
    setConvertingId(
      prospect.id
    );

    try {
      const result =
        await convertProspect(
          prospect.id
        );

      setProspects(
        (previousProspects) =>
          previousProspects.map(
            (currentProspect) =>
              currentProspect.id
                === prospect.id
                ? {
                    ...currentProspect,
                    status: "QUALIFIED",
                  }
                : currentProspect
          )
      );

      if (
        result?.activation_email_sent
      ) {
        window.alert(
          "Client créé avec succès.\n\n"
          + "Un code de vérification "
          + `a été envoyé à ${result.email}.\n`
          + `Identifiant : ${result.username}`
        );
      } else {
        window.alert(
          "Le client a été créé, "
          + "mais l'e-mail d'activation "
          + "n'a pas pu être envoyé."
        );
      }
    } catch (conversionError) {
      setProspectsError(
        formatError(
          conversionError
        )
      );

      window.alert(
        "Erreur lors de la conversion."
      );
    } finally {
      setConvertingId(null);
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
          }}
        >
          <button
            type="button"
            onClick={
              () =>
                setActiveTab(
                  "prospects"
                )
            }
            style={{
              padding: "9px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight:
                activeTab
                === "prospects"
                  ? "600"
                  : "400",
              borderBottom:
                activeTab
                === "prospects"
                  ? "2px solid #000"
                  : "2px solid transparent",
            }}
          >
            Prospects
          </button>

          <button
            type="button"
            onClick={
              () =>
                setActiveTab(
                  "quotes"
                )
            }
            style={{
              padding: "9px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight:
                activeTab === "quotes"
                  ? "600"
                  : "400",
              borderBottom:
                activeTab === "quotes"
                  ? "2px solid #000"
                  : "2px solid transparent",
            }}
          >
            Devis
          </button>
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
            convertingId={
              convertingId
            }
            onStatusChange={
              changeStatus
            }
            onConvert={
              convertToClient
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
      </main>
    </>
  );
}


function ProspectsSection({
  prospects,
  loading,
  error,
  updatingId,
  convertingId,
  onStatusChange,
  onConvert,
}) {
  return (
    <section>
      <h2>
        Prospects
      </h2>

      <p
        style={{
          color: "#666",
          fontSize: 14,
        }}
      >
        Suivi commercial,
        qualification et conversion
        des prospects en clients.
      </p>

      {error && (
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
          {error}
        </div>
      )}

      {loading && (
        <p>
          Chargement...
        </p>
      )}

      {!loading
        && prospects.length === 0
        && (
          <p
            style={{
              color: "#888",
            }}
          >
            Aucun prospect.
          </p>
        )}

      {!loading
        && prospects.length > 0
        && (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background:
                      "#f5f5f5",
                  }}
                >
                  {[
                    "Nom",
                    "Email",
                    "Société",
                    "Type événement",
                    "Statut",
                    "Action",
                    "Date",
                  ].map(
                    (heading) => (
                      <th
                        key={heading}
                        style={{
                          padding:
                            "8px 10px",
                          textAlign:
                            "left",
                          borderBottom:
                            "2px solid #ddd",
                        }}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {prospects.map(
                  (prospect) => (
                    <tr
                      key={prospect.id}
                      style={{
                        borderBottom:
                          "1px solid #eee",
                      }}
                    >
                      <td
                        style={{
                          padding:
                            "8px 10px",
                        }}
                      >
                        <b>
                          {
                            prospect.first_name
                          }{" "}
                          {
                            prospect.last_name
                          }
                        </b>
                      </td>

                      <td
                        style={{
                          padding:
                            "8px 10px",
                        }}
                      >
                        <a
                          href={
                            `mailto:${prospect.email}`
                          }
                        >
                          {
                            prospect.email
                          }
                        </a>
                      </td>

                      <td
                        style={{
                          padding:
                            "8px 10px",
                        }}
                      >
                        {
                          prospect.company
                          || "—"
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "8px 10px",
                        }}
                      >
                        {
                          prospect.event_type
                          || "—"
                        }
                      </td>

                      <td
                        style={{
                          padding:
                            "8px 10px",
                        }}
                      >
                        <select
                          aria-label={
                            `Statut de ${prospect.first_name} ${prospect.last_name}`
                          }
                          value={
                            prospect.status
                          }
                          disabled={
                            updatingId
                            === prospect.id
                          }
                          onChange={
                            (event) =>
                              onStatusChange(
                                prospect.id,
                                event.target
                                  .value
                              )
                          }
                          style={{
                            padding:
                              "4px 6px",
                            borderRadius:
                              4,
                            border:
                              "1px solid #ddd",
                            background:
                              STATUS_COLORS[
                                prospect
                                  .status
                              ]
                              || "#fff",
                          }}
                        >
                          {Object.entries(
                            STATUS_LABELS
                          ).map(
                            ([
                              value,
                              label,
                            ]) => (
                              <option
                                key={value}
                                value={value}
                              >
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td
                        style={{
                          padding:
                            "8px 10px",
                        }}
                      >
                        {prospect.status
                          !== "ARCHIVED"
                          && (
                            <button
                              type="button"
                              disabled={
                                convertingId
                                === prospect.id
                              }
                              onClick={
                                () =>
                                  onConvert(
                                    prospect
                                  )
                              }
                              style={{
                                padding:
                                  "4px 8px",
                                fontSize: 12,
                                cursor:
                                  "pointer",
                                border:
                                  "1px solid #ddd",
                                borderRadius:
                                  4,
                                background:
                                  "#e8f5e9",
                              }}
                            >
                              {convertingId
                                === prospect.id
                                ? "Conversion..."
                                : "Convertir en client"}
                            </button>
                          )}
                      </td>

                      <td
                        style={{
                          padding:
                            "8px 10px",
                          color: "#888",
                        }}
                      >
                        {
                          prospect.created_at
                            ? new Date(
                                prospect
                                  .created_at
                              )
                                .toLocaleDateString(
                                  "fr-FR"
                                )
                            : "—"
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
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
            Consultation et création
            des devis commerciaux.
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
          {error}
        </div>
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
            />
          )
        )}
    </section>
  );
}


function QuoteCard({
  quote,
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
            Prospect
          </label>

          <input
            id="quote-prospect"
            type="number"
            min="1"
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
          />

          {prospects.length > 0 && (
            <div
              style={{
                marginTop: 4,
                color: "#777",
                fontSize: 12,
              }}
            >
              Prospects disponibles :
              {" "}
              {prospects.map(
                (prospect) =>
                  `${prospect.id} - ${prospect.first_name} ${prospect.last_name}`
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