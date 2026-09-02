import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../auth/useAuth";

import {
  getHomePathForUser,
} from "../auth/roleAccess";

import AuthForm from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";


export default function LoginPage() {
  const {
    login,
    verifyLogin2FA,
  } = useAuth();


  const navigate =
    useNavigate();


  const [
    pendingUsername,
    setPendingUsername,
  ] = useState(null);


  function resetLogin() {
    setPendingUsername(
      null
    );
  }


  function redirectAfterLogin(
    user
  ) {
    navigate(
      getHomePathForUser(
        user
      ),
      {
        replace: true,
      }
    );
  }


  if (pendingUsername) {
    return (
      <>
        <Navbar />

        <AuthForm
          title="Vérification de connexion"
          subtitle={
            <>
              Un code à 6 chiffres
              vient d&apos;être envoyé
              à l&apos;adresse e-mail
              associée à votre compte.
              Saisissez-le pour terminer
              la connexion.
            </>
          }
          submitLabel="Vérifier le code"
          fields={[
            {
              name:
                "code",
              label:
                "Code de connexion",
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
          ]}
          validate={(
            values
          ) => {
            const code =
              values.code
                ?.trim();


            if (!code) {
              return (
                "Veuillez saisir "
                + "le code reçu "
                + "par e-mail."
              );
            }


            if (
              !/^\d{6}$/.test(
                code
              )
            ) {
              return (
                "Le code doit "
                + "contenir exactement "
                + "6 chiffres."
              );
            }


            return null;
          }}
          onSubmit={async (
            values
          ) => {
            const user =
              await verifyLogin2FA(
                pendingUsername,
                values.code.trim()
              );


            redirectAfterLogin(
              user
            );
          }}
          footer={
            <button
              type="button"
              onClick={
                resetLogin
              }
              className="authTextButton"
            >
              Utiliser un autre compte
            </button>
          }
        />
      </>
    );
  }


  return (
    <>
      <Navbar />

      <AuthForm
        title="Connexion"
        subtitle={
          "Connectez-vous à votre compte "
          + "pour accéder à votre espace."
        }
        submitLabel="Se connecter"
        fields={[
          {
            name:
              "username",
            label:
              "Nom d’utilisateur",
            autoComplete:
              "username",
          },
          {
            name:
              "password",
            label:
              "Mot de passe",
            type:
              "password",
            autoComplete:
              "current-password",
          },
        ]}
        validate={(
          values
        ) => {
          if (
            !values.username
              ?.trim() ||
            !values.password
          ) {
            return (
              "Veuillez saisir "
              + "votre nom d’utilisateur "
              + "et votre mot de passe."
            );
          }


          return null;
        }}
        onSubmit={async (
          values
        ) => {
          const response =
            await login(
              values.username.trim(),
              values.password
            );


          if (
            !response
              ?.requires_2fa
          ) {
            throw new Error(
              "La vérification "
              + "par e-mail n'a "
              + "pas été déclenchée."
            );
          }


          setPendingUsername(
            response.username ||
              values.username.trim()
          );
        }}
        footer={
          <div className="authFooterLinks">
            <p>
              Pas encore de compte ?{" "}

              <Link to="/signup">
                Créer un compte
              </Link>
            </p>

            <p>
              Adresse e-mail
              pas encore vérifiée ?{" "}

              <Link to="/verify-email">
                Saisir mon code
              </Link>
            </p>

            <p>
              <Link to="/forgot-password">
                Mot de passe oublié ?
              </Link>
            </p>
          </div>
        }
      />
    </>
  );
}