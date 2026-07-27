import {
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  useAuth,
} from "../contexts/AuthContext";

import {
  useState,
  type FormEvent,
} from "react";

import {
  StoreCartDrawer,
} from "./StoreCartDrawer";

import {
  useCart,
} from "../contexts/CartContext";

import {
  Link,
  Outlet,
  useNavigate,
} from "react-router";

export function StoreLayout() {
  const navigate =
    useNavigate();


    const {
    user,
    loading,
    authenticated,
    } = useAuth();
    
    const {
  cart,
  loading: loadingCart,
  openCart,
} = useCart();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  function handleCartClick() {
  if (
    authenticated &&
    user?.role === "CUSTOMER"
  ) {
    openCart();

    return;
  }

  if (
    authenticated &&
    user?.role === "ADMIN"
  ) {
    navigate("/admin");

    return;
  }

  navigate(
    `/conta/entrar?redirect=${encodeURIComponent(
      "/carrinho",
    )}`,
  );
}


  function submitSearch(
    event: FormEvent,
  ) {
    event.preventDefault();

    const normalizedSearch =
      search.trim();

    if (!normalizedSearch) {
      return;
    }

    navigate(
      `/?search=${encodeURIComponent(
        normalizedSearch,
      )}#destaques`,
    );

    setMobileMenuOpen(false);
  }

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="store-shell">
      <div className="store-announcement">
        <span>
          FRETE GRÁTIS EM COMPRAS
          SELECIONADAS
        </span>

        <span>
          TROCA FÁCIL E COMPRA
          SEGURA
        </span>

        <span>
          STREETWEAR AUTÊNTICO
        </span>
      </div>

      <header className="store-header">
        <div className="store-header-content">
          <button
            type="button"
            className="store-mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                (current) =>
                  !current,
              )
            }
            aria-label={
              mobileMenuOpen
                ? "Fechar menu"
                : "Abrir menu"
            }
          >
            {mobileMenuOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>

          <Link
            to="/"
            className="store-logo"
            onClick={closeMenu}
          >
            <span>LS</span>

            <div>
              <strong>
                LS STREET
              </strong>

              <small>
                URBAN CLOTHING
              </small>
            </div>
          </Link>

          <nav
            className={
              mobileMenuOpen
                ? "store-navigation open"
                : "store-navigation"
            }
          >
            <a
              href="/#inicio"
              onClick={closeMenu}
            >
              Início
            </a>

            <a
              href="/#categorias"
              onClick={closeMenu}
            >
              Categorias
            </a>

            <a
              href="/#destaques"
              onClick={closeMenu}
            >
              Produtos
            </a>

            <a
              href="/#sobre"
              onClick={closeMenu}
            >
              Sobre
            </a>
          </nav>

          <form
            className="store-header-search"
            onSubmit={submitSearch}
          >
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Buscar produtos"
              aria-label="Buscar produtos"
            />
          </form>
          <div className="store-account-actions">
                {loading ? (
                    <div className="store-account-loading">
                    <UserRound size={19} />
                    </div>
                ) : authenticated &&
                    user?.role === "CUSTOMER" ? (
                    <Link
                    to="/minha-conta"
                    className="store-account-link"
                    onClick={closeMenu}
                    >
                    <UserRound size={19} />

                    <span>
                        {user.name.split(" ")[0]}
                    </span>
                    </Link>
                ) : authenticated &&
                    user?.role === "ADMIN" ? (
                    <Link
                    to="/admin"
                    className="store-account-link"
                    onClick={closeMenu}
                    >
                    <ShieldCheck
                        size={19}
                    />

                    <span>Painel</span>
                    </Link>
                ) : (
                    <Link
                    to="/conta/entrar"
                    className="store-account-link"
                    onClick={closeMenu}
                    >
                    <UserRound size={19} />

                    <span>Entrar</span>
                    </Link>
                )}
            </div>
                    <button
                    type="button"
                    className="store-cart-header-button"
                    onClick={handleCartClick}
                    aria-label="Abrir carrinho"
                    >
                    {loadingCart ? (
                        <LoaderCircle
                        size={19}
                        className="icon-spinning"
                        />
                    ) : (
                        <ShoppingBag
                        size={19}
                        />
                    )}

                    {(cart?.summary
                        .totalQuantity ?? 0) >
                        0 && (
                        <span>
                        {
                            cart!.summary
                            .totalQuantity
                        }
                        </span>
                    )}
                    </button>
        </div>
      </header>
      <StoreCartDrawer />

      <main className="store-main">
        <Outlet />
      </main>

      <footer
        className="store-footer"
        id="sobre"
      >
        <div className="store-footer-content">
          <section>
            <Link
              to="/"
              className="store-logo store-footer-logo"
            >
              <span>LS</span>

              <div>
                <strong>
                  LS STREET
                </strong>

                <small>
                  URBAN CLOTHING
                </small>
              </div>
            </Link>

            <p>
              Moda urbana para quem
              transforma a rua em
              identidade.
            </p>
          </section>

          <section>
            <h3>Navegação</h3>

            <a href="/#inicio">
              Início
            </a>

            <a href="/#categorias">
              Categorias
            </a>

            <a href="/#destaques">
              Produtos
            </a>
          </section>

          <section>
            <h3>Atendimento</h3>

            <span>
              Segunda a sexta
            </span>

            <span>
              09h às 18h
            </span>

            <span>
              contato@lsstreet.com.br
            </span>
          </section>

          <section>
            <h3>Redes sociais</h3>

           <a
  href="https://instagram.com"
  target="_blank"
  rel="noreferrer"
  className="store-social-link"
>
  Instagram
</a>
          </section>
        </div>

        <div className="store-footer-bottom">
          <span>
            © 2026 LS STREET.
            Todos os direitos
            reservados.
          </span>

          <Link to="/login">
            Administração
          </Link>
        </div>
      </footer>
    </div>
  );
}