import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

export function CustomerProtectedRoute() {
  const location =
    useLocation();

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
    const redirect =
      encodeURIComponent(
        `${location.pathname}${location.search}`,
      );

    return (
      <Navigate
        to={`/conta/entrar?redirect=${redirect}`}
        replace
      />
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (
    user?.role !== "CUSTOMER"
  ) {
    return (
      <Navigate
        to="/conta/entrar"
        replace
      />
    );
  }

  return <Outlet />;
}