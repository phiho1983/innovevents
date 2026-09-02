import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthForm from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";

import {
  signup as apiSignup,
} from "../api/auth";


export default function SignupPage() {
  const navigate =
    useNavigate();


  return (
    <>
      <Navbar />

      <AuthForm
        title="Créer un compte"
        subtitle={
          "Créez votre espace puis vérifiez "
          + "votre adresse e-mail pour l'activer."
        }
        submitLabel="Créer mon compte"
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
        validate={(
          values
        ) => {
          if (
            !values.username
              ?.trim()
          ) {
            return (
              "Nom d’utilisateur requis."
            );
          }


          if (
            !values.email
              ?.trim()
          ) {
            return (
              "Adresse e-mail requise."
            );
          }


          if (
            !values.password
          ) {
            return (
              "Mot de passe requis."
            );
          }


          if (
            values.password !==
            values.password2
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
          const email =
            values.email
              .trim()
              .toLowerCase();


          await apiSignup(
            values.username.trim(),
            email,
            values.password
          );


          navigate(
            "/verify-email",
            {
              replace: true,

              state: {
                email,
                mode:
                  "signup",
              },
            }
          );
        }}
        footer={
          <p>
            Vous avez déjà
            un compte ?{" "}

            <Link to="/login">
              Se connecter
            </Link>
          </p>
        }
      />
    </>
  );
}