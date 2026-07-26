import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import {
  AdminLayout,
} from "./components/AdminLayout";

import {
  ProtectedRoute,
} from "./components/ProtectedRoute";

import {
  DashboardPage,
} from "./pages/DashboardPage";

import {
  LoginPage,
} from "./pages/LoginPage";

import {
  NotFoundPage,
} from "./pages/NotFoundPage";

import {
  OrdersPage,
} from "./pages/OrdersPage";

import {
  CategoriesPage,
} from "./pages/CategoriesPage";

function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <div className="placeholder-page">
      <span className="eyebrow">
        LS STREET
      </span>

      <h1>{title}</h1>

      <p>
        Esta tela será implementada
        na próxima etapa.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute />
        }
      >
        <Route
          path="/admin"
          element={
            <AdminLayout />
          }
        >
          <Route
            index
            element={
              <DashboardPage />
            }
          />

          <Route
  path="pedidos"
  element={<OrdersPage />}
/>

          <Route
            path="produtos"
            element={
              <PlaceholderPage
                title="Produtos"
              />
            }
          />

          <Route
  path="categorias"
  element={<CategoriesPage />}
/>

          <Route
            path="estoque"
            element={
              <PlaceholderPage
                title="Estoque"
              />
            }
          />

          <Route
            path="pagamentos"
            element={
              <PlaceholderPage
                title="Pagamentos"
              />
            }
          />

          <Route
            path="cupons"
            element={
              <PlaceholderPage
                title="Cupons"
              />
            }
          />

          <Route
            path="banners"
            element={
              <PlaceholderPage
                title="Banners"
              />
            }
          />

          <Route
            path="clientes"
            element={
              <PlaceholderPage
                title="Clientes"
              />
            }
          />

          <Route
            path="favoritos"
            element={
              <PlaceholderPage
                title="Favoritos"
              />
            }
          />

          <Route
            path="auditoria"
            element={
              <PlaceholderPage
                title="Auditoria"
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/admin"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <NotFoundPage />
        }
      />
    </Routes>
  );
}