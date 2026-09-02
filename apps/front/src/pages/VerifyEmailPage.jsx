import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AuthForm, { AuthStatus } from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";

import {
  verifyEmail,
} from "../api/auth";


export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail =
    location.state?.email
    || "";

  const mode =
    location.state?.mode
    || "activation";

  const initialValues = useMemo(
    () => ({
      email: initialEmail,
    }),
    [initialEmail]
  );

  const [
    verifiedEmail,
    setVerifiedEmail,
  ] = useState("");

  if (verifiedEmail) {
    return (
      <>
        <Navbar />

        <AuthStatus
          title="Adresse e-mail vérifiée"
          actions={
            mode === "signup" ? (
              <button
                type="button"
                className="btn"
                onClick={() => navigate("/login", { replace: true })}
              >
                Se connecter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigate("/forgot-password", {
                    state: { email: verifiedEmail, mode: "setup" },
                  })}
                >
                  Définir mon mot de passe
                </button>
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => navigate("/login")}
                >
                  J&apos;ai déjà un mot de passe
                </button>
              </>
            )
          }
        >

          <p>
            Votre adresse e-mail a été
            vérifiée avec succès.
          </p>

          {mode === "signup" ? (
            <>
              <p>
                Votre compte est maintenant
                activé. Vous pouvez vous
                connecter avec le mot de passe
                choisi lors de votre inscription.
              </p>

            </>
          ) : (
            <>
              <p>
                Si votre compte a été créé
                par Innov&apos;Events à partir
                d&apos;une demande de devis,
                vous devez maintenant définir
                votre mot de passe.
              </p>

            </>
          )}
        </AuthStatus>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <AuthForm
        title="Vérifier mon adresse e-mail"
        subtitle={
          <>
            Saisissez votre adresse e-mail
            et le code à 6 chiffres reçu
            par e-mail.
          </>
        }
        submitLabel="Vérifier mon adresse"
        initialValues={initialValues}
        fields={[
          {
            name: "email",
            label: "Adresse e-mail",
            type: "email",
            autoComplete: "email",
          },
          {
            name: "code",
            label: "Code de vérification",
            type: "text",
            autoComplete:
              "one-time-code",
            inputMode:
              "numeric",
            maxLength: 6,
            placeholder:
              "123456",
          },
        ]}
        validate={(values) => {
          const email =
            values.email
            ?.trim();

          const code =
            values.code
            ?.trim();

          if (!email) {
            return (
              "Veuillez saisir "
              + "votre adresse e-mail."
            );
          }

          if (!code) {
            return (
              "Veuillez saisir "
              + "le code reçu par e-mail."
            );
          }

          if (
            !/^\d{6}$/.test(
              code
            )
          ) {
            return (
              "Le code doit contenir "
              + "exactement 6 chiffres."
            );
          }

          return null;
        }}
        onSubmit={async (
          values
        ) => {
          const email =
            values.email
            .trim()
            .toLowerCase();

          await verifyEmail(
            email,
            values.code.trim()
          );

          setVerifiedEmail(
            email
          );
        }}
        footer={
          <p>
            <Link to="/login">
              Retour à la connexion
            </Link>
          </p>
        }
      />
    </>
  );
}
