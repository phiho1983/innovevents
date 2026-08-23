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

      <div className="container">
        <AuthForm
          title="Créer un compte"
          subtitle={
            "Inscrivez-vous puis vérifiez "
            + "votre adresse e-mail."
          }
          submitLabel="Inscription"
          fields={[
            {
              name: "email",
              label: "Email",
              type: "email",
              autoComplete: "email",
            },
            {
              name: "username",
              label: "Username",
              autoComplete: "username",
            },
            {
              name: "password",
              label: "Mot de passe",
              type: "password",
              autoComplete: "new-password",
            },
            {
              name: "password2",
              label: "Confirmer le mot de passe",
              type: "password",
              autoComplete: "new-password",
            },
          ]}
          validate={(values) => {
            if (
              !values.username
                ?.trim()
            ) {
              return "Username requis.";
            }

            if (
              !values.email
                ?.trim()
            ) {
              return "Email requis.";
            }

            if (
              !values.password
            ) {
              return (
                "Mot de passe requis."
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
            <p
              style={{
                fontSize: 12,
                margin: 0,
              }}
            >
              Vous avez déjà
              un compte ?{" "}
              <Link
                to="/login"
                style={{
                  fontWeight: 700,
                }}
              >
                Se connecter
              </Link>
            </p>
          }
        />
      </div>
    </>
  );
}