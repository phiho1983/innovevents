import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/useAuth";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: "24px 0" }}>
        <h1>Admin</h1>
        <p>
          Connecté : <b>{user?.username}</b>
        </p>
        <p>
          Rôle : <b>STAFF</b>
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
