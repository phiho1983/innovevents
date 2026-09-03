import {
  useState,
} from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";

import {
  useAuth,
} from "../auth/useAuth";

import {
  createContactMessage,
} from "../api/contactMessages";

import "./ContactPage.css";


export default function ContactPage() {
  const {
    user,
  } = useAuth();


  const [
    form,
    setForm,
  ] = useState({
    name:
      user?.username || "",

    email:
      user?.email || "",

    subject: "",
    message: "",
  });


  const [
    sent,
    setSent,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  function onChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (
        previousForm
      ) => ({
        ...previousForm,

        [name]:
          value,
      })
    );
  }


  async function submit(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");


    try {
      await createContactMessage({
        name:
          form.name.trim(),

        email:
          form.email.trim(),

        subject:
          form.subject.trim(),

        message:
          form.message.trim(),
      });


      setSent(true);

    } catch (
      submitError
    ) {
      setError(
        formatApiError(
          submitError
        )
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <>
      <Navbar />


      <main className="contactPage">
        <div className="container contactLayout">
          <section className="contactIntro">
            <p className="contactEyebrow">
              Contact
            </p>


            <h1 className="contactHeroTitle">
              Une question ?
              <br />

              <em>
                Parlons-en.
              </em>
            </h1>


            <p className="contactHeroText">
              Notre équipe est disponible
              pour répondre à vos questions
              et vous accompagner dans
              votre projet événementiel.
            </p>


            <div className="contactDetails">
              <div className="contactDetail">
                <span>
                  E-mail
                </span>

                <a
                  href="mailto:contact@innov-events.com"
                >
                  contact@innov-events.com
                </a>
              </div>


              <div className="contactDetail">
                <span>
                  Localisation
                </span>

                <p>
                  France
                </p>
              </div>
            </div>
          </section>


          <section
            className="contactPanel"
            aria-labelledby={
              "contact-form-title"
            }
          >
            {sent ? (
              <div className="contactSuccess">
                <span
                  className="contactSuccessIcon"
                  aria-hidden="true"
                >
                  ✓
                </span>


                <p className="contactPanelEyebrow">
                  Message envoyé
                </p>


                <h2>
                  Merci pour
                  votre message.
                </h2>


                <p>
                  Nous reviendrons vers vous
                  rapidement.
                </p>
              </div>
            ) : (
              <>
                <div className="contactPanelHeader">
                  <p className="contactPanelEyebrow">
                    Écrivez-nous
                  </p>


                  <h2
                    id="contact-form-title"
                  >
                    Comment pouvons-nous
                    vous aider ?
                  </h2>
                </div>


                <form
                  onSubmit={
                    submit
                  }
                  className="contactForm"
                >
                  <ContactField
                    label="Nom"
                    htmlFor="contact-name"
                  >
                    <input
                      id="contact-name"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        onChange
                      }
                      className="contactInput"
                      autoComplete="name"
                      maxLength={120}
                      required
                    />
                  </ContactField>


                  <ContactField
                    label="E-mail"
                    htmlFor="contact-email"
                  >
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={
                        form.email
                      }
                      onChange={
                        onChange
                      }
                      className="contactInput"
                      autoComplete="email"
                      required
                    />
                  </ContactField>


                  <ContactField
                    label="Objet"
                    htmlFor="contact-subject"
                  >
                    <input
                      id="contact-subject"
                      name="subject"
                      value={
                        form.subject
                      }
                      onChange={
                        onChange
                      }
                      className="contactInput"
                      maxLength={160}
                      required
                    />
                  </ContactField>


                  <ContactField
                    label="Message"
                    htmlFor="contact-message"
                  >
                    <textarea
                      id="contact-message"
                      name="message"
                      value={
                        form.message
                      }
                      onChange={
                        onChange
                      }
                      rows={6}
                      maxLength={5000}
                      className="contactTextarea"
                      placeholder={
                        "Décrivez votre demande..."
                      }
                      required
                    />
                  </ContactField>


                  {error && (
                    <div
                      role="alert"
                      style={{
                        padding: 12,
                        border:
                          "1px solid #f5c2c7",
                        borderRadius: 6,
                        marginBottom: 12,
                      }}
                    >
                      {error}
                    </div>
                  )}


                  <button
                    type="submit"
                    className="btn contactSubmit"
                    disabled={
                      loading
                    }
                  >
                    {
                      loading
                        ? "Envoi en cours..."
                        : "Envoyer mon message"
                    }

                    {!loading && (
                      <span
                        aria-hidden="true"
                      >
                        →
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>


      <Footer />
    </>
  );
}


function ContactField({
  label,
  htmlFor,
  children,
}) {
  return (
    <div className="contactField">
      <label
        htmlFor={
          htmlFor
        }
        className="contactLabel"
      >
        {label}
      </label>

      {children}
    </div>
  );
}


function formatApiError(
  error
) {
  if (!error) {
    return (
      "Une erreur est survenue "
      + "pendant l'envoi."
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
    "Une erreur est survenue pendant l'envoi."
  );
}