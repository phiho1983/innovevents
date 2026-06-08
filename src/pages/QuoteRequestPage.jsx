import { useState } from "react";
import Navbar from "../components/Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function QuoteRequestPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    message: "",
  });

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/api/prospects/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      alert("Demande envoyée avec succès");
    } catch (error) {
      console.error("Erreur envoi demande :", error);
      alert(error?.detail || error?.message || "Erreur lors de l'envoi");
    }
  }

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="quoteWrap">
          <h2 className="quoteTitle">Demande de devis</h2>
          <p className="quoteSub">
            Remplissez ce formulaire, nous revenons vers vous rapidement.
          </p>

          <form onSubmit={onSubmit} className="quoteForm">
            <div className="quoteGrid2">
              <Field label="Prénom">
                <Input name="first_name" value={form.first_name} onChange={onChange} />
              </Field>

              <Field label="Nom">
                <Input name="last_name" value={form.last_name} onChange={onChange} />
              </Field>
            </div>

            <div className="quoteGrid2">
              <Field label="Email">
                <Input name="email" type="email" value={form.email} onChange={onChange} />
              </Field>

              <Field label="Téléphone">
                <Input name="phone" value={form.phone} onChange={onChange} />
              </Field>
            </div>

            <div className="quoteGrid2">
              <Field label="Société">
                <Input name="company" value={form.company} onChange={onChange} />
              </Field>

              <Field label="Ville">
                <Input name="city" value={form.city} onChange={onChange} />
              </Field>
            </div>

            <Field label="Message">
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                className="quoteTextarea"
                placeholder="Décrivez votre besoin (date, lieu, nombre de personnes, type d’événement...)"
              />
            </Field>

            <button type="submit" className="btn quoteBtn">
              Envoyer ma demande
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div className="quoteField">
      <label className="quoteLabel">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return <input {...props} className="quoteInput" />;
}