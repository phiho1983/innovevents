import { useState } from "react";
import { Link } from "react-router-dom";

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
    // TODO: brancher API (POST /api/prospects/)
    console.log("submit", form);
    alert("Demande envoyée (mock)");
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <h1 className="text-2xl font-bold">Innov&apos;Events</h1>

        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-purple-700 underline" to="/demande-de-devis">
            Demande de devis
          </Link>
          <Link className="text-purple-700 underline" to="/login">
            Connexion
          </Link>
        </nav>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="mb-6 text-lg font-bold">Demande de devis</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="Prénom">
            <Input name="first_name" value={form.first_name} onChange={onChange} />
          </Field>

          <Field label="Nom">
            <Input name="last_name" value={form.last_name} onChange={onChange} />
          </Field>

          <Field label="Email">
            <Input name="email" type="email" value={form.email} onChange={onChange} />
          </Field>

          <Field label="Téléphone">
            <Input name="phone" value={form.phone} onChange={onChange} />
          </Field>

          <Field label="Société">
            <Input name="company" value={form.company} onChange={onChange} />
          </Field>

          <Field label="Ville">
            <Input name="city" value={form.city} onChange={onChange} />
          </Field>

          <Field label="Message">
            <textarea
              name="message"
              value={form.message}
              onChange={onChange}
              className="h-28 w-full resize-none rounded-lg border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/20"
            />
          </Field>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-black/10 py-3 text-sm font-medium text-black transition hover:bg-black/15"
          >
            Envoyer ma demande
          </button>
        </form>
      </main>
    </div>
  );
}

/** Petits composants pour garder le JSX propre */
function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/20"
    />
  );
}
