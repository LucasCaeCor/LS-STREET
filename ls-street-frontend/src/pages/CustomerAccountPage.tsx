import {
  BadgeCheck,
  CalendarDays,
  Heart,
  LogOut,
  Mail,
  Phone,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import {
  useFavorites,
} from "../contexts/FavoritesContext";
import {
  Link,
  useNavigate,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

function formatDate(
  value?: string,
) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "long",
    },
  ).format(
    new Date(value),
  );
}

export function CustomerAccountPage() {
  const navigate =
    useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const {
  totalFavorites,
} = useFavorites();

  if (!user) {
    return null;
  }

  async function handleLogout() {
    await logout();

    navigate(
      "/",
      {
        replace: true,
      },
    );
  }

  return (
    <section className="customer-account-page">
      <header className="customer-account-header">
        <div className="customer-account-avatar">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
            />
          ) : (
            <UserRound
              size={34}
            />
          )}
        </div>

        <div>
          <span>
            MINHA CONTA
          </span>

          <h1>
            Olá, {user.name}
          </h1>

          <p>
            Gerencie seus dados e
            acompanhe sua experiência
            na LS STREET.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
        >
          <LogOut size={18} />
          Sair
        </button>
      </header>

      <div className="customer-account-grid">
        <section className="customer-account-profile">
          <header>
            <UserRound
              size={20}
            />

            <h2>
              Dados da conta
            </h2>
          </header>

          <div>
            <article>
              <Mail size={17} />

              <section>
                <span>E-mail</span>

                <strong>
                  {user.email}
                </strong>
              </section>
            </article>

            <article>
              <Phone size={17} />

              <section>
                <span>Telefone</span>

                <strong>
                  {user.phone ??
                    "Não cadastrado"}
                </strong>
              </section>
            </article>

            <article>
              <BadgeCheck
                size={17}
              />

              <section>
                <span>
                  Verificação
                </span>

                <strong>
                  {user.emailVerified
                    ? "E-mail verificado"
                    : "E-mail não verificado"}
                </strong>
              </section>
            </article>

            <article>
              <CalendarDays
                size={17}
              />

              <section>
                <span>
                  Cliente desde
                </span>

                <strong>
                  {formatDate(
                    user.createdAt,
                  )}
                </strong>
              </section>
            </article>
          </div>
        </section>

        <section className="customer-account-shortcuts">
          <header>
            <h2>
              Atalhos
            </h2>
          </header>

          <div>
            <article>
  <ShoppingBag
    size={24}
  />

  <h3>Meus pedidos</h3>

  <p>
    Acompanhe pagamentos,
    preparação e entrega.
  </p>

  <Link
    to="/minha-conta/pedidos"
    className="customer-account-shortcut-link"
  >
    Ver meus pedidos
  </Link>
</article>

            <article>
              <Heart size={24} />

              <h3>Favoritos</h3>

              <p>
                Guarde os produtos que
                mais combinam com você.
              </p>

              <Link
  to="/minha-conta/favoritos"
  className="customer-account-shortcut-link"
>
  Ver favoritos
  {totalFavorites > 0 &&
    ` (${totalFavorites})`}
</Link>
            </article>
          </div>
        </section>
      </div>

      <Link
        to="/"
        className="customer-account-store-link"
      >
        Continuar comprando
      </Link>
    </section>
  );
}