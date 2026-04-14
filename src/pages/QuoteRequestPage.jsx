import { useState } from "react";
import Navbar from "../components/Navbar";

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

  function onSubmit(e) {
    e.preventDefault();
    console.log("submit", form);
    alert("Demande envoyée (mock)");
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