import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Navbar";

import "./QuoteRequestPage.css";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


export default function QuoteRequestPage() {
  const navigate =
    useNavigate();


  const [
    form,
    setForm,
  ] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    message: "",
  });


  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  function onChange(event) {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (
        previousForm
      ) => ({
        ...previousForm,
        [name]: value,
      })
    );
  }


  async function onSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");


    try {
      const response =
        await fetch(
          `${API}/api/prospects/`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                form
              ),
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => null
          );


      if (!response.ok) {
        throw (
          data || {
            detail:
              `Erreur HTTP ${response.status}`,
          }
        );
      }


      navigate(
        "/",
        {
          replace: true,

          state: {
            quoteSuccess:
              (
                "Votre demande de devis a bien "
                + "été envoyée. Notre équipe vous "
                + "contactera prochainement."
              ),
          },
        }
      );
    } catch (submitError) {
      console.error(
        "Erreur envoi demande :",
        submitError
      );


      setError(
        formatApiError(
          submitError
        )
      );


      setLoading(false);
    }
  }


  return (
    <>
      <Navbar />


      <main className="quotePage">
        <div className="container quotePageInner">
          {/* ============================================= */}
          {/* Introduction                                  */}
          {/* ============================================= */}

          <section className="quoteIntro">
            <p className="quoteEyebrow">
              Votre projet
            </p>

            <h1 className="quoteHeroTitle">
              Imaginons
              <br />
              votre prochain
              <br />

              <em>
                événement.
              </em>
            </h1>

            <p className="quoteHeroText">
              Parlez-nous de votre besoin.
              Nous prendrons le temps de comprendre
              votre projet afin de vous proposer
              un accompagnement adapté.
            </p>


            <div className="quoteInfoList">
              <div className="quoteInfoItem">
                <span>
                  01
                </span>

                <p>
                  Décrivez votre événement
                  et vos premières idées.
                </p>
              </div>

              <div className="quoteInfoItem">
                <span>
                  02
                </span>

                <p>
                  Indiquez le lieu,
                  la période et les participants.
                </p>
              </div>

              <div className="quoteInfoItem">
                <span>
                  03
                </span>

                <p>
                  Notre équipe revient vers vous
                  pour échanger sur votre projet.
                </p>
              </div>
            </div>
          </section>


          {/* ============================================= */}
          {/* Formulaire                                     */}
          {/* ============================================= */}

          <section
            className="quoteFormPanel"
            aria-labelledby="quote-form-title"
          >
            <div className="quoteFormHeader">
              <p className="quoteFormNumber">
                01 — Votre demande
              </p>

              <h2
                id="quote-form-title"
                className="quoteTitle"
              >
                Parlez-nous
                de votre projet.
              </h2>

              <p className="quoteSub">
                Les champs marqués comme obligatoires
                nous permettent de traiter votre demande.
              </p>
            </div>


            <form
              onSubmit={
                onSubmit
              }
              className="quoteForm"
            >
              <div className="quoteGrid2">
                <Field
                  label="Prénom"
                  htmlFor="first_name"
                >
                  <Input
                    id="first_name"
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      onChange
                    }
                    autoComplete="given-name"
                    required
                  />
                </Field>


                <Field
                  label="Nom"
                  htmlFor="last_name"
                >
                  <Input
                    id="last_name"
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      onChange
                    }
                    autoComplete="family-name"
                    required
                  />
                </Field>
              </div>


              <div className="quoteGrid2">
                <Field
                  label="Email"
                  htmlFor="email"
                >
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={
                      form.email
                    }
                    onChange={
                      onChange
                    }
                    autoComplete="email"
                    required
                  />
                </Field>


                <Field
                  label="Téléphone"
                  htmlFor="phone"
                >
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={
                      form.phone
                    }
                    onChange={
                      onChange
                    }
                    autoComplete="tel"
                  />
                </Field>
              </div>


              <div className="quoteGrid2">
                <Field
                  label="Société"
                  htmlFor="company"
                >
                  <Input
                    id="company"
                    name="company"
                    value={
                      form.company
                    }
                    onChange={
                      onChange
                    }
                    autoComplete="organization"
                  />
                </Field>


                <Field
                  label="Ville"
                  htmlFor="city"
                >
                  <Input
                    id="city"
                    name="city"
                    value={
                      form.city
                    }
                    onChange={
                      onChange
                    }
                    autoComplete="address-level2"
                  />
                </Field>
              </div>


              <Field
                label="Votre projet"
                htmlFor="message"
              >
                <textarea
                  id="message"
                  name="message"
                  value={
                    form.message
                  }
                  onChange={
                    onChange
                  }
                  className="quoteTextarea"
                  placeholder={
                    "Date, lieu, nombre de personnes, "
                    + "type d’événement, ambiance recherchée..."
                  }
                  required
                />
              </Field>


              {error && (
                <div
                  className="quoteError"
                  role="alert"
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

                {!loading && (
                  <span aria-hidden="true">
                    →
                  </span>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}


function Field({
  label,
  htmlFor,
  children,
}) {
  return (
    <div className="quoteField">
      <label
        className="quoteLabel"
        htmlFor={
          htmlFor
        }
      >
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


function formatApiError(
  error
) {
  if (!error) {
    return (
      "Une erreur est survenue "
      + "lors de l'envoi."
    );
  }


  if (
    typeof error ===
    "string"
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
    Object.entries(
      error
    )
      .map(
        (
          [
            field,
            value,
          ]
        ) => {
          const text =
            Array.isArray(
              value
            )
              ? value.join(
                  " "
                )
              : String(
                  value
                );


          return (
            `${field} : ${text}`
          );
        }
      )
      .join(" | ");


  return (
    message ||
    (
      "Une erreur est survenue "
      + "lors de l'envoi."
    )
  );
}