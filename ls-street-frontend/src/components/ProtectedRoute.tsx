import {
  Navigate,
  Outlet,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

export function ProtectedRoute() {
  const {
    user,
    loading,
    authenticated,
  } = useAuth();

  if (loading) {
    return (
      <div className="full-screen-loading">
        <div className="spinner" />

        <span>
          Carregando sessão...
        </span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}