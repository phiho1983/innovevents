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
  resetPassword,
} from "../api/auth";


export default function ResetPasswordPage() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const mode =
    location.state?.mode
    || "reset";

  const initialEmail =
    location.state?.email
    || "";

  const initialValues =
    useMemo(
      () => ({
        email:
          initialEmail,
      }),
      [initialEmail]
    );

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const isSetup =
    mode === "setup";

  if (completed) {
    return (
      <>
        <Navbar />

        <AuthStatus
          title="Mot de passe enregistré"
          actions={
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/login", { replace: true })}
            >
              Se connecter
            </button>
          }
        >

          <p>
            {
              isSetup
                ? (
                  "Votre mot de passe a été défini "
                  + "avec succès."
                )
                : (
                  "Votre mot de passe a été "
                  + "réinitialisé avec succès."
                )
            }
          </p>

          <p>
            Vous pouvez maintenant vous connecter.
            Un second code de sécurité vous sera
            envoyé par e-mail lors de la connexion.
          </p>

        </AuthStatus>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <AuthForm
        title={
          isSetup
            ? "Définir mon mot de passe"
            : "Réinitialiser mon mot de passe"
        }
        subtitle={
          <>
            Saisissez le code à 6 chiffres
            reçu par e-mail puis choisissez
            votre nouveau mot de passe.
          </>
        }
        submitLabel={
          isSetup
            ? "Définir mon mot de passe"
            : "Réinitialiser le mot de passe"
        }
        initialValues={
          initialValues
        }
        fields={[
          {
            name:
              "email",
            label:
              "Adresse e-mail",
            type:
              "email",
            autoComplete:
              "email",
          },
          {
            name:
              "code",
            label:
              "Code de sécurité",
            type:
              "text",
            autoComplete:
              "one-time-code",
            inputMode:
              "numeric",
            maxLength: 6,
            placeholder:
              "123456",
          },
          {
            name:
              "password",
            label:
              "Nouveau mot de passe",
            type:
              "password",
            autoComplete:
              "new-password",
          },
          {
            name:
              "password2",
            label:
              "Confirmer le mot de passe",
            type:
              "password",
            autoComplete:
              "new-password",
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
              "Adresse e-mail requise."
            );
          }

          if (
            !/^\d{6}$/.test(
              code || ""
            )
          ) {
            return (
              "Le code doit contenir "
              + "exactement 6 chiffres."
            );
          }

          if (!values.password) {
            return (
              "Nouveau mot de passe requis."
            );
          }

          if (
            values.password
            !== values.password2
          ) {
            return (
              "Les mots de passe "
              + "ne correspondent pas."
            );
          }

          return null;
        }}
        onSubmit={async (
          values
        ) => {
          await resetPassword(
            values.email
              .trim()
              .toLowerCase(),
            values.code.trim(),
            values.password
          );

          setCompleted(
            true
          );
        }}
        footer={
          <p>
            Vous n&apos;avez pas reçu
            de code ?{" "}
            <Link
              to="/forgot-password"
              state={{
                email:
                  initialEmail,
                mode,
              }}
            >
              Demander un nouveau code
            </Link>
          </p>
        }
      />
    </>
  );
}
