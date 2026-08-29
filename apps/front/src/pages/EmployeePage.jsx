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


function normalizeProspects(data) {
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
    prospects,
    setProspects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    convertingId,
    setConvertingId,
  ] = useState(null);


  useEffect(() => {
    let active = true;

    async function loadProspects() {
      try {
        const data =
          await getProspects();

        if (active) {
          setProspects(
            normalizeProspects(data)
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            formatError(loadError)
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProspects();

    return () => {
      active = false;
    };
  }, []);


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

    setError("");
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

      setError(
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

    setError("");
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
      setError(
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
                          key={
                            prospect.id
                          }
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
                                  changeStatus(
                                    prospect.id,
                                    event.target
                                      .value
                                  )
                              }
                              style={{
                                padding:
                                  "4px 6px",
                                borderRadius: 4,
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
                                    key={
                                      value
                                    }
                                    value={
                                      value
                                    }
                                  >
                                    {
                                      label
                                    }
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
                                      convertToClient(
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
      </main>
    </>
  );
}