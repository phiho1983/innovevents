import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/useAuth";

export default function ClientAccountPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "24px 0" }}>
        <h1>Mon compte</h1>
        <p>
          Bonjour <b>{user?.username}</b>
        </p>
        <p>
          Email : <b>{user?.email || "—"}</b>
        </p>
        <p>
          Rôle : <b>CLIENT</b>
        </p>

        <div style={{ marginTop: 16 }}>
          <button
            className="btn"
            onClick={() => {
              logout();
              nav("/", { replace: true });
            }}
          >
            Se déconnecter
          </button>
        </div>
      </main>
    </>
  );
}
