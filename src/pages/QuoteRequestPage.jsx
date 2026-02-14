import { useEffect, useState } from "react";

const API_BASE = "";

export default function QuoteRequestPage() {
  const [thankYouMessage, setThankYouMessage] = useState("Merci !");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/public-config/`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.thank_you_message) setThankYouMessage(data.thank_you_message);
      })
      .catch(() => {});
  }, []);

  function onChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/prospects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data || { global: "Erreur inconnue." });
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch (err) {
        console.error("FETCH ERROR:", err);
        setErrors({ global: `Erreur réseau: ${err?.message || err}` });
        setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
        <h3>Demande envoyée ✅</h3>
        <p>{thankYouMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Demande de devis</h3>

      {errors.global && (
        <div style={{ padding: 12, background: "#ffecec", border: "1px solid #ffb3b3", borderRadius: 10, marginBottom: 12 }}>
          {errors.global}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <Field label="Prénom" name="first_name" value={form.first_name} onChange={onChange} error={errors.first_name} />
        <Field label="Nom" name="last_name" value={form.last_name} onChange={onChange} error={errors.last_name} />
        <Field label="Email" name="email" value={form.email} onChange={onChange} error={errors.email} type="email" />
        <Field label="Téléphone" name="phone" value={form.phone} onChange={onChange} error={errors.phone} />
        <Field label="Société" name="company" value={form.company} onChange={onChange} error={errors.company} />
        <Field label="Ville" name="city" value={form.city} onChange={onChange} error={errors.city} />

        <div>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Message</label>
          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            rows={5}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
          />
          {errors.message && <ErrorText error={errors.message} />}
        </div>

        <button type="submit" disabled={loading} style={{ padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer" }}>
          {loading ? "Envoi..." : "Envoyer ma demande"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type = "text" }) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
      />
      {error && <ErrorText error={error} />}
    </div>
  );
}

function ErrorText({ error }) {
  const msg = Array.isArray(error) ? error[0] : error;
  return <div style={{ marginTop: 6, color: "#b00020" }}>{msg}</div>;
}
