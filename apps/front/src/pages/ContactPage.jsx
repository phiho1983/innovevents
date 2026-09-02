import {
  useState,
} from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";

import {
  useAuth,
} from "../auth/useAuth";

import "./ContactPage.css";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";


export default function ContactPage() {
  const {
    user,
  } = useAuth();


  const [
    form,
    setForm,
  ] = useState({
    username:
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

        [name]: value,
      })
    );
  }


  async function submit(
    event
  ) {
    event.preventDefault();


    await fetch(
      `${API}/api/contact/`,
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
    ).catch(
      () => {}
    );


    setSent(true);
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

                <a href="mailto:contact@innov-events.com">
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
            aria-labelledby="contact-form-title"
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
                    label="Nom d’utilisateur"
                    htmlFor="contact-username"
                  >
                    <input
                      id="contact-username"
                      name="username"
                      value={
                        form.username
                      }
                      onChange={
                        onChange
                      }
                      className="contactInput"
                      autoComplete="username"
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
                      className="contactTextarea"
                      placeholder={
                        "Décrivez votre demande..."
                      }
                      required
                    />
                  </ContactField>


                  <button
                    type="submit"
                    className="btn contactSubmit"
                  >
                    Envoyer mon message

                    <span aria-hidden="true">
                      →
                    </span>
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