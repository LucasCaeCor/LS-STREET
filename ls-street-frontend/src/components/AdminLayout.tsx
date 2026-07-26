import {
  BarChart3,
  Boxes,
  ClipboardList,
  Heart,
  Image,
  LogOut,
   Percent,
  ScrollText,
  ShoppingBag,
  Tags,
  Users,
  WalletCards,
} from "lucide-react";

import {
  NavLink,
  Outlet,
} from "react-router";

import {
  useAuth,
} from "../contexts/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: BarChart3,
    end: true,
  },
  {
    label: "Pedidos",
    path: "/admin/pedidos",
    icon: ClipboardList,
  },
  {
    label: "Produtos",
    path: "/admin/produtos",
    icon: ShoppingBag,
  },
  {
    label: "Categorias",
    path: "/admin/categorias",
    icon: Tags,
  },
  {
    label: "Estoque",
    path: "/admin/estoque",
    icon: Boxes,
  },
  {
    label: "Pagamentos",
    path: "/admin/pagamentos",
    icon: WalletCards,
  },
  {
    label: "Cupons",
    path: "/admin/cupons",
    icon: Percent,
  },
  {
    label: "Banners",
    path: "/admin/banners",
    icon: Image,
  },
  {
    label: "Clientes",
    path: "/admin/clientes",
    icon: Users,
  },
  {
    label: "Favoritos",
    path: "/admin/favoritos",
    icon: Heart,
  },
  {
    label: "Auditoria",
    path: "/admin/auditoria",
    icon: ScrollText,
  },
];

export function AdminLayout() {
  const {
    user,
    logout,
  } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            LS
          </div>

          <div>
            <strong>
              LS STREET
            </strong>

            <span>
              Painel administrativo
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map(
            ({
              label,
              path,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "nav-link active"
                    : "nav-link"
                }
              >
                <Icon size={19} />

                <span>
                  {label}
                </span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="avatar">
              {user?.name
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name}
              </strong>

              <span>
                {user?.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}