import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "./useAuth";

import {
  getHomePathForUser,
  isAdminUser,
  isClientUser,
  isEmployeeUser,
} from "./roleAccess";


function LoadingRoute() {
  return (
    <div>
      Chargement…
    </div>
  );
}


export function AdminOnlyRoute() {
  const {
    loading,
    user,
  } = useAuth();

  if (loading) {
    return <LoadingRoute />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isAdminUser(user)) {
    return (
      <Navigate
        to={getHomePathForUser(user)}
        replace
      />
    );
  }

  return <Outlet />;
}


export function EmployeeOnlyRoute() {
  const {
    loading,
    user,
  } = useAuth();

  if (loading) {
    return <LoadingRoute />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isEmployeeUser(user)) {
    return (
      <Navigate
        to={getHomePathForUser(user)}
        replace
      />
    );
  }

  return <Outlet />;
}


export function ClientOnlyRoute() {
  const {
    loading,
    user,
  } = useAuth();

  if (loading) {
    return <LoadingRoute />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isClientUser(user)) {
    return (
      <Navigate
        to={getHomePathForUser(user)}
        replace
      />
    );
  }

  return <Outlet />;
}