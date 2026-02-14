import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    try {
      // login() renvoie l'user (grâce à /api/me)
      const user = await login(username, password);
      nav(user?.is_staff ? "/admin" : "/client", { replace: true });
    } catch (e) {
      setErr(e?.message || "Erreur de connexion");
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Connexion</h3>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 320 }}>
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />

        <label>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
