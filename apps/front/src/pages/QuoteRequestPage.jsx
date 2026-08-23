import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

export default function QuoteRequestPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onChange(e) {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/prospects/`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw (
          data || {
            detail:
              `Erreur HTTP ${response.status}`,
          }
        );
      }

      navigate("/", {
        replace: true,
        state: {
          quoteSuccess: (
            "Votre demande de devis a bien "
            + "été envoyée. Notre équipe vous "
            + "contactera prochainement."
          ),
        },
      });
    } catch (err) {
      console.error(
        "Erreur envoi demande :",
        err
      );

      setError(
        formatApiError(err)
      );

      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="quoteWrap">
          <h2 className="quoteTitle">
            Demande de devis
          </h2>

          <p className="quoteSub">
            Remplissez ce formulaire,
            nous revenons vers vous rapidement.
          </p>

          <form
            onSubmit={onSubmit}
            className="quoteForm"
          >
            <div className="quoteGrid2">
              <Field label="Prénom">
                <Input
                  name="first_name"
                  value={
                    form.first_name
                  }
                  onChange={
                    onChange
                  }
                  required
                />
              </Field>

              <Field label="Nom">
                <Input
                  name="last_name"
                  value={
                    form.last_name
                  }
                  onChange={
                    onChange
                  }
                  required
                />
              </Field>
            </div>

            <div className="quoteGrid2">
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    onChange
                  }
                  required
                />
              </Field>

              <Field label="Téléphone">
                <Input
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    onChange
                  }
                />
              </Field>
            </div>

            <div className="quoteGrid2">
              <Field label="Société">
                <Input
                  name="company"
                  value={
                    form.company
                  }
                  onChange={
                    onChange
                  }
                />
              </Field>

              <Field label="Ville">
                <Input
                  name="city"
                  value={
                    form.city
                  }
                  onChange={
                    onChange
                  }
                />
              </Field>
            </div>

            <Field label="Message">
              <textarea
                name="message"
                value={
                  form.message
                }
                onChange={
                  onChange
                }
                className="quoteTextarea"
                placeholder="Décrivez votre besoin (date, lieu, nombre de personnes, type d’événement...)"
                required
              />
            </Field>

            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #f5c2c7",
                  borderRadius: 6,
                  background:
                    "#f8d7da",
                  color:
                    "#842029",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn quoteBtn"
              disabled={
                loading
              }
            >
              {
                loading
                  ? "Envoi en cours..."
                  : "Envoyer ma demande"
              }
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div className="quoteField">
      <label className="quoteLabel">
        {label}
      </label>

      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="quoteInput"
    />
  );
}

function formatApiError(error) {
  if (!error) {
    return (
      "Une erreur est survenue "
      + "lors de l'envoi."
    );
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  if (error.detail) {
    return error.detail;
  }

  if (error.message) {
    return error.message;
  }

  const message =
    Object.entries(error)
      .map(
        ([field, value]) => {
          const text =
            Array.isArray(value)
              ? value.join(" ")
              : String(value);

          return `${field} : ${text}`;
        }
      )
      .join(" | ");

  return (
    message
    || "Une erreur est survenue lors de l'envoi."
  );
}