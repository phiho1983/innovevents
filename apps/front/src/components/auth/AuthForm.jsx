import {
  useEffect,
  useMemo,
  useState,
} from "react";


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
  const defaultValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map(
          (field) => [
            field.name,
            "",
          ]
        )
      ),
    [fields]
  );

  const [values, setValues] =
    useState(() => ({
      ...defaultValues,
      ...(initialValues || {}),
    }));

  const [err, setErr] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    setValues((previousValues) => ({
      ...defaultValues,
      ...previousValues,
      ...(initialValues || {}),
    }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaultValues,
    initialValues,
  ]);

  function set(
    name,
    value
  ) {
    setValues(
      (previousValues) => ({
        ...previousValues,
        [name]: value,
      })
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setErr(null);

    const message =
      validate?.(values);

    if (message) {
      setErr(message);
      return;
    }

    try {
      setLoading(true);

      await onSubmit?.(
        values
      );
    } catch (error) {
      setErr(
        error?.message
        || "Erreur"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {title && (
        <h2
          style={{
            margin: 0,
          }}
        >
          {title}
        </h2>
      )}

      {subtitle && (
        <p
          style={{
            marginTop: 8,
            color:
              subtitleColor
              || "#555",
          }}
        >
          {subtitle}
        </p>
      )}

      <form
        onSubmit={
          handleSubmit
        }
        style={{
          display: "grid",
          gap: 10,
          marginTop: 16,
        }}
      >
        {fields.map(
          (field) => (
            <div
              key={
                field.name
              }
              style={{
                display:
                  "grid",
                gap: 6,
              }}
            >
              <label
                htmlFor={
                  field.name
                }
                style={{
                  fontWeight:
                    700,
                  fontSize:
                    12,
                }}
              >
                {
                  field.label
                }
              </label>

              <input
                id={
                  field.name
                }
                type={
                  field.type
                  || "text"
                }
                value={
                  values[
                    field.name
                  ] ?? ""
                }
                onChange={(
                  event
                ) =>
                  set(
                    field.name,
                    event
                      .target
                      .value
                  )
                }
                required={
                  field.required
                  !== false
                }
                autoComplete={
                  field.autoComplete
                }
                placeholder={
                  field.placeholder
                }
                inputMode={
                  field.inputMode
                }
                maxLength={
                  field.maxLength
                }
                pattern={
                  field.pattern
                }
                disabled={
                  loading
                }
                style={{
                  height: 42,
                  borderRadius:
                    10,
                  border:
                    "1px solid #ddd",
                  padding:
                    "0 12px",
                  outline:
                    "none",
                  opacity:
                    loading
                    ? 0.8
                    : 1,
                }}
              />
            </div>
          )
        )}

        {err && (
          <p
            style={{
              color:
                "crimson",
              margin: 0,
              fontSize:
                12,
            }}
          >
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading
          }
          style={{
            height: 44,
            borderRadius:
              12,
            cursor:
              loading
              ? "not-allowed"
              : "pointer",
            opacity:
              loading
              ? 0.8
              : 1,
          }}
        >
          {
            loading
            ? "..."
            : submitLabel
          }
        </button>

        {footer ? (
          <div
            style={{
              marginTop: 6,
            }}
          >
            {footer}
          </div>
        ) : null}
      </form>
    </div>
  );
}