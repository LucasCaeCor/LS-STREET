import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router";

import App from "./App";
import {
  CartProvider,
} from "./contexts/CartContext";

import {
  AuthProvider,
} from "./contexts/AuthContext";

import "./styles.css";
import {
  FavoritesProvider,
} from "./contexts/FavoritesContext";
createRoot(
  document.getElementById(
    "root",
  )!,
).render(
   <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);