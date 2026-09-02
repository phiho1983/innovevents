import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./AuthForm.css";


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
  const defaultValues =
    useMemo(
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


  const [
    values,
    setValues,
  ] = useState(
    () => ({
      ...defaultValues,
      ...(initialValues || {}),
    })
  );


  const [
    err,
    setErr,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(false);


  useEffect(() => {
    setValues(
      (
        previousValues
      ) => ({
        ...defaultValues,
        ...previousValues,
        ...(initialValues || {}),
      })
    );

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
      (
        previousValues
      ) => ({
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
      validate?.(
        values
      );


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
        error?.message ||
          "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="authPage">
      <div className="container authLayout">
        <section className="authVisual">
          <div className="authVisualContent">
            <p className="authEyebrow">
              Innov&apos;Events
            </p>

            <h2 className="authVisualTitle">
              Votre espace
              <br />
              <em>événementiel.</em>
            </h2>

            <p className="authVisualText">
              Retrouvez vos échanges,
              vos projets et vos événements
              dans un espace sécurisé.
            </p>
          </div>

          <div
            className="authVisualDecoration"
            aria-hidden="true"
          >
            <span>01</span>
            <span>02</span>
            <span>03</span>
          </div>
        </section>


        <section className="authCard">
          <div className="authCardHeader">
            <p className="authCardEyebrow">
              Espace sécurisé
            </p>

            {title && (
              <h1 className="authTitle">
                {title}
              </h1>
            )}


            {subtitle && (
              <div
                className="authSubtitle"
                style={
                  subtitleColor
                    ? {
                        color:
                          subtitleColor,
                      }
                    : undefined
                }
              >
                {subtitle}
              </div>
            )}
          </div>


          <form
            onSubmit={
              handleSubmit
            }
            className="authForm"
          >
            {fields.map(
              (field) => (
                <div
                  key={
                    field.name
                  }
                  className="authField"
                >
                  <label
                    htmlFor={
                      field.name
                    }
                    className="authLabel"
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
                      field.type ||
                      "text"
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
                      field.required !==
                      false
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
                    className="authInput"
                  />
                </div>
              )
            )}


            {err && (
              <div
                className="authError"
                role="alert"
              >
                {err}
              </div>
            )}


            <button
              type="submit"
              disabled={
                loading
              }
              className="authBtn"
            >
              <span>
                {
                  loading
                    ? "En cours..."
                    : submitLabel
                }
              </span>

              {!loading && (
                <span
                  aria-hidden="true"
                  className="authBtnArrow"
                >
                  →
                </span>
              )}
            </button>


            {footer && (
              <div className="authFooter">
                {footer}
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}