import Navbar from "../components/Navbar";

import {
  useAuth,
} from "../auth/useAuth";


export default function EmployeePage() {
  const {
    user,
  } = useAuth();

  return (
    <>
      <Navbar />

      <main
        className="container"
        style={{
          padding: "24px 0",
        }}
      >
        <h1>
          Espace employé
        </h1>

        <p
          style={{
            color: "#666",
          }}
        >
          Connecté : {user?.username}
        </p>

        <p
          style={{
            marginTop: 16,
            color: "#888",
            fontSize: 14,
          }}
        >
          Accès employé activé.
          Les fonctionnalités métier
          seront regroupées dans cet espace.
        </p>
      </main>
    </>
  );
}