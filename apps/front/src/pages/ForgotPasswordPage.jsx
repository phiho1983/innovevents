import { useMemo } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AuthForm from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";
import { forgotPassword } from "../api/auth";


export default function ForgotPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.state?.mode || "reset";
  const initialEmail = location.state?.email || "";
  const isSetup = mode === "setup";
  const initialValues = useMemo(
    () => ({ email: initialEmail }),
    [initialEmail]
  );

  return (
    <>
      <Navbar />

      <AuthForm
        title={
          isSetup
            ? "Définir mon mot de passe"
            : "Mot de passe oublié"
        }
        subtitle={
          isSetup
            ? (
              <>
                Un code de sécurité va vous être envoyé par e-mail
                afin de vous permettre de choisir votre mot de passe.
              </>
            )
            : (
              <>
                Saisissez votre adresse e-mail. Un code de
                réinitialisation vous sera envoyé.
              </>
            )
        }
        submitLabel="Recevoir mon code"
        initialValues={initialValues}
        fields={[
          {
            name: "email",
            label: "Adresse e-mail",
            type: "email",
            autoComplete: "email",
            placeholder: "vous@exemple.fr",
          },
        ]}
        validate={(values) => {
          if (!values.email?.trim()) {
            return "Veuillez saisir votre adresse e-mail.";
          }

          return null;
        }}
        onSubmit={async (values) => {
          const normalizedEmail = values.email.trim().toLowerCase();

          await forgotPassword(normalizedEmail);

          navigate("/reset-password", {
            state: {
              email: normalizedEmail,
              mode,
            },
          });
        }}
        footer={
          <p>
            <Link to="/login">Retour à la connexion</Link>
          </p>
        }
      />
    </>
  );
}
