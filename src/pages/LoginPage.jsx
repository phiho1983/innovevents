import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AuthForm from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <Navbar />

      <AuthForm
        title="Connexion"
        subtitle="Connectez-vous à votre compte."
        submitLabel="Se connecter"
        fields={[
          { name: "username", label: "Username", autoComplete: "username" },
          {
            name: "password",
            label: "Mot de passe",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        validate={(v) => {
          if (!v.username?.trim() || !v.password) {
            return "Veuillez saisir votre username et votre mot de passe.";
          }
          return null;
        }}
        onSubmit={async (v) => {
          const user = await login(v.username.trim(), v.password);
          nav(user?.is_staff ? "/admin" : "/client", { replace: true });
        }}
        footer={
          <p style={{ fontSize: 12, margin: 0 }}>
            Pas de compte ?{" "}
            <Link to="/signup" style={{ fontWeight: 700 }}>
              Créer un compte
            </Link>
          </p>
        }
      />
    </>
  );
}
