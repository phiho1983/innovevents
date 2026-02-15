import { useEffect, useMemo, useState } from "react";

/**
 * AuthForm — composant réutilisable
 * props:
 * - title, subtitle, subtitleColor
 * - fields: [{ name, label, type?, required?, autoComplete?, placeholder? }]
 * - submitLabel
 * - onSubmit: async (values) => void
 * - validate: (values) => string|null
 * - footer: ReactNode
 * - initialValues?: object (ex: { username: "phi" })
 */
export default function AuthForm({
  title,
  subtitle,
  subtitleColor,
  fields,
  submitLabel = "Valider",
  onSubmit,
  validate,
  footer,
  initialValues,
}) {
  // Valeurs par défaut basées sur fields
  const defaultValues = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.name, ""])),
    [fields]
  );

  // Init : default + initialValues (sans oublier les champs manquants)
  const [values, setValues] = useState(() => ({
    ...defaultValues,
    ...(initialValues || {}),
  }));

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si fields / initialValues changent (ex: nav signup -> login), on resynchronise intelligemment
  useEffect(() => {
    setValues((prev) => ({
      ...defaultValues,
      ...prev, // garde ce que l'utilisateur a tapé si même champ
      ...(initialValues || {}), // mais applique preset (ex username)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues, initialValues]);

  function set(name, value) {
    setValues((p) => ({ ...p, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);

    const msg = validate?.(values);
    if (msg) {
      setErr(msg);
      return;
    }

    try {
      setLoading(true);
      await onSubmit?.(values);
    } catch (e) {
      setErr(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      {title && <h2 style={{ margin: 0 }}>{title}</h2>}
      {subtitle && (
        <p style={{ marginTop: 8, color: subtitleColor || "#555" }}>
          {subtitle}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 10, marginTop: 16 }}
      >
        {fields.map((f) => (
          <div key={f.name} style={{ display: "grid", gap: 6 }}>
            <label htmlFor={f.name} style={{ fontWeight: 700, fontSize: 12 }}>
              {f.label}
            </label>
            <input
              id={f.name}
              type={f.type || "text"}
              value={values[f.name] ?? ""}
              onChange={(e) => set(f.name, e.target.value)}
              required={f.required !== false}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              disabled={loading}
              style={{
                height: 42,
                borderRadius: 10,
                border: "1px solid #ddd",
                padding: "0 12px",
                outline: "none",
                opacity: loading ? 0.8 : 1,
              }}
            />
          </div>
        ))}

        {err && <p style={{ color: "crimson", margin: 0, fontSize: 12 }}>{err}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: 44,
            borderRadius: 12,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? "..." : submitLabel}
        </button>

        {footer ? <div style={{ marginTop: 6 }}>{footer}</div> : null}
      </form>
    </div>
  );
}
