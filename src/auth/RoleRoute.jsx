// front/src/auth/RoleRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function StaffOnlyRoute() {
  const { loading, user, isStaff } = useAuth();
  if (loading) return <div>Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <Navigate to="/client" replace />;
  return <Outlet />;
}

export function ClientOnlyRoute() {
  const { loading, user, isStaff } = useAuth();
  if (loading) return <div>Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isStaff) return <Navigate to="/admin" replace />;
  return <Outlet />;
}
