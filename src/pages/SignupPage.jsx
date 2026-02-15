import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/auth/AuthForm";
import Navbar from "../components/Navbar";

export default function SignupPage() {
  const nav = useNavigate();

  return (
    <>
      <Navbar />

      <div className="container">
        <AuthForm
          title="Créer un compte"
          subtitle="Inscrivez-vous puis connectez-vous."
          submitLabel="Inscription"
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "username", label: "Username", autoComplete: "username" },
            { name: "password", label: "Mot de passe", type: "password", autoComplete: "new-password" },
            { name: "password2", label: "Confirmer le mot de passe", type: "password", autoComplete: "new-password" },
          ]}
          validate={(v) => {
            if (v.password !== v.password2) return "Les mots de passe ne correspondent pas.";
            return null;
          }}
          onSubmit={async (v) => {
            console.log("SIGNUP mock:", v);
            nav("/login", { replace: true });
          }}
          footer={
            <p style={{ fontSize: 12, margin: 0 }}>
              Vous avez déjà un compte ?{" "}
              <Link to="/login" style={{ fontWeight: 700 }}>
                Se connecter
              </Link>
            </p>
          }
        />
      </div>
    </>
  );
}
