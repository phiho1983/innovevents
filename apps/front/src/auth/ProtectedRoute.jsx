// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <div>Chargement…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
