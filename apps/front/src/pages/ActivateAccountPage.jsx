import {
  useMemo,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import AuthForm from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";

import {
  activateAccount,
} from "../api/auth";

import {
  useAuth,
} from "../auth/useAuth";


export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();

  const [searchParams] =
    useSearchParams();

  const uid =
    searchParams.get("uid");

  const token =
    searchParams.get("token");

  const invalidLink =
    !uid || !token;

  const initialValues = useMemo(
    () => ({
      password: "",
      password2: "",
    }),
    []
  );

  if (invalidLink) {
    return (
      <>
        <Navbar />

        <main
          className="container"
          style={{
            padding: "60px 0",
            maxWidth: 520,
          }}
        >
          <div
            style={{
              padding: 24,
              border: "1px solid #f5c2c7",
              borderRadius: 8,
              background: "#f8d7da",
              color: "#842029",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Lien d&apos;activation invalide
            </h2>

            <p
              style={{
                lineHeight: 1.6,
              }}
            >
              Ce lien d&apos;activation est
              incomplet ou invalide.
            </p>

            <Link to="/">
              Retour à l&apos;accueil
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <AuthForm
        title="Activer mon compte"
        subtitle={
          <>
            Votre compte Innov&apos;Events
            est prêt. Choisissez maintenant
            votre mot de passe.
          </>
        }
        submitLabel="Activer mon compte"
        initialValues={initialValues}
        fields={[
          {
            name: "password",
            label: "Nouveau mot de passe",
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
          if (!values.password) {
            return (
              "Veuillez choisir un mot de passe."
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
        onSubmit={async (values) => {
          await activateAccount(
            uid,
            token,
            values.password
          );

          const authenticatedUser =
            await refreshMe();

          if (!authenticatedUser) {
            throw new Error(
              "Le compte a été activé, "
              + "mais la connexion automatique "
              + "a échoué."
            );
          }

          navigate("/client", {
            replace: true,
          });
        }}
      />
    </>
  );
}