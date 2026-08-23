import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Navbar from "../components/Navbar";

import {
  forgotPassword,
} from "../api/auth";


export default function ForgotPasswordPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const mode =
    location.state?.mode
    || "reset";

  const [
    email,
    setEmail,
  ] = useState(
    location.state?.email
    || ""
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const isSetup =
    mode === "setup";

  async function submit(
    event
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const normalizedEmail =
      email
      .trim()
      .toLowerCase();

    try {
      await forgotPassword(
        normalizedEmail
      );

      navigate(
        "/reset-password",
        {
          state: {
            email:
              normalizedEmail,
            mode,
          },
        }
      );
    } catch (err) {
      setError(
        err?.message
        || "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <main
        className="container"
        style={{
          padding: "60px 0",
          maxWidth: 400,
        }}
      >
        <h2>
          {
            isSetup
              ? "Définir mon mot de passe"
              : "Mot de passe oublié"
          }
        </h2>

        <p
          style={{
            marginTop: 12,
            lineHeight: 1.6,
            color: "#666",
          }}
        >
          {
            isSetup
              ? (
                "Un code de sécurité va vous être envoyé "
                + "par e-mail afin de vous permettre "
                + "de choisir votre mot de passe."
              )
              : (
                "Saisissez votre adresse e-mail. "
                + "Un code de réinitialisation "
                + "vous sera envoyé."
              )
          }
        </p>

        <form
          onSubmit={submit}
          style={{
            marginTop: 16,
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="Votre adresse e-mail"
            autoComplete="email"
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 10px",
              border:
                "1px solid #ddd",
              borderRadius: 4,
              marginBottom: 12,
              boxSizing:
                "border-box",
            }}
          />

          {error && (
            <p
              style={{
                color: "crimson",
                fontSize: 13,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              width: "100%",
            }}
          >
            {
              loading
                ? "Envoi..."
                : "Recevoir mon code"
            }
          </button>

          <p
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 13,
            }}
          >
            <Link to="/login">
              Retour à la connexion
            </Link>
          </p>
        </form>
      </main>
    </>
  );
}