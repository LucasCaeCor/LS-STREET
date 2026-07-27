import {
  Route,
  Routes,
} from "react-router";

import {
  AdminLayout,
} from "./components/AdminLayout";

import {
  CustomerProtectedRoute,
} from "./components/CustomerProtectedRoute";

import {
  ProtectedRoute,
} from "./components/ProtectedRoute";

import {
  StoreLayout,
} from "./components/StoreLayout";

import {
  AuditPage,
} from "./pages/AuditPage";

import {
  BannersPage,
} from "./pages/BannersPage";

import {
  CategoriesPage,
} from "./pages/CategoriesPage";

import {
  CouponsPage,
} from "./pages/CouponsPage";

import {
  CustomerAccountPage,
} from "./pages/CustomerAccountPage";

import {
  CustomerLoginPage,
} from "./pages/CustomerLoginPage";

import {
  CustomerRegisterPage,
} from "./pages/CustomerRegisterPage";

import {
  CustomersPage,
} from "./pages/CustomersPage";

import {
  DashboardPage,
} from "./pages/DashboardPage";

import {
  InventoryPage,
} from "./pages/InventoryPage";

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
  PaymentsPage,
} from "./pages/PaymentsPage";

import {
  ProductsPage,
} from "./pages/ProductsPage";

import {
  StoreHomePage,
} from "./pages/StoreHomePage";

import {
  StoreProductPage,
} from "./pages/StoreProductPage";



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
      {/* Login administrativo */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* Área administrativa */}
      <Route
        element={<ProtectedRoute />}
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
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
            element={<ProductsPage />}
          />

          <Route
            path="categorias"
            element={<CategoriesPage />}
          />

          <Route
            path="estoque"
            element={<InventoryPage />}
          />

          <Route
            path="pagamentos"
            element={<PaymentsPage />}
          />

          <Route
            path="cupons"
            element={<CouponsPage />}
          />

          <Route
            path="banners"
            element={<BannersPage />}
          />

          <Route
            path="clientes"
            element={<CustomersPage />}
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
            element={<AuditPage />}
          />
        </Route>
      </Route>

      {/* Loja pública */}
      <Route
        element={<StoreLayout />}
      >
        <Route
          path="/"
          element={<StoreHomePage />}
        />

        <Route
          path="/produto/:slug"
          element={
            <StoreProductPage />
          }
        />
        <Route
          path="/conta/entrar"
          element={
            <CustomerLoginPage />
          }
        />

        <Route
          path="/conta/cadastro"
          element={
            <CustomerRegisterPage />
          }
        />

        {/* Área protegida do cliente */}
        <Route
          element={
            <CustomerProtectedRoute />
          }
        >
          <Route
            path="/minha-conta"
            element={
              <CustomerAccountPage />
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}