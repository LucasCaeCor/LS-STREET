import {
  CircleDollarSign,
  PackageCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  apiRequest,
} from "../lib/api";

import type {
  DashboardData,
  DashboardResponse,
} from "../types/dashboard";

function formatMoney(
  valueInCents: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(valueInCents / 100);
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(new Date(value));
}

function formatStatus(
  status: string,
) {
  const statuses:
    Record<string, string> = {
      PENDING_PAYMENT:
        "Aguardando pagamento",

      PAYMENT_IN_REVIEW:
        "Pagamento em análise",

      PAID: "Pago",
      PREPARING: "Preparando",
      SHIPPED: "Enviado",
      DELIVERED: "Entregue",
      CANCELLED: "Cancelado",
      REFUNDED: "Reembolsado",
    };

  return statuses[status] ??
    status;
}

export function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<
      DashboardData | null
    >(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response =
          await apiRequest<
            DashboardResponse
          >(
            "/admin/dashboard?days=30",
          );

        setDashboard(
          response.data.dashboard,
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Não foi possível carregar o dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        Carregando dashboard...
      </div>
    );
  }

  if (
    error ||
    !dashboard
  ) {
    return (
      <div className="page-error">
        <strong>
          Não foi possível carregar.
        </strong>

        <span>{error}</span>
      </div>
    );
  }

  const metrics = [
    {
      label:
        "Receita total",
      value:
        formatMoney(
          dashboard.metrics
            .totalRevenueInCents,
        ),
      detail:
        `${dashboard.metrics.periodOrdersCount} pedidos no período`,
      icon:
        CircleDollarSign,
    },
    {
      label:
        "Pedidos",
      value:
        String(
          dashboard.metrics
            .totalOrders,
        ),
      detail:
        `${dashboard.metrics.pendingPaymentOrders} aguardando pagamento`,
      icon: ShoppingCart,
    },
    {
      label:
        "Clientes ativos",
      value:
        String(
          dashboard.metrics
            .activeCustomers,
        ),
      detail:
        "Clientes cadastrados",
      icon: Users,
    },
    {
      label:
        "Produtos ativos",
      value:
        String(
          dashboard.metrics
            .activeProducts,
        ),
      detail:
        `${dashboard.metrics.lowStockCount} com estoque baixo`,
      icon:
        PackageCheck,
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">
            VISÃO GERAL
          </span>

          <h1>Dashboard</h1>

          <p>
            Acompanhe o desempenho
            da LS Street nos últimos
            30 dias.
          </p>
        </div>

        <div className="period-badge">
          Últimos 30 dias
        </div>
      </header>

      <section className="metrics-grid">
        {metrics.map(
          ({
            label,
            value,
            detail,
            icon: Icon,
          }) => (
            <article
              className="metric-card"
              key={label}
            >
              <div className="metric-icon">
                <Icon size={22} />
              </div>

              <span>
                {label}
              </span>

              <strong>
                {value}
              </strong>

              <small>
                {detail}
              </small>
            </article>
          ),
        )}
      </section>

      <section className="dashboard-grid">
        <article className="panel recent-orders-panel">
          <div className="panel-header">
            <div>
              <h2>
                Pedidos recentes
              </h2>

              <p>
                Últimas compras
                realizadas.
              </p>
            </div>
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Data</th>
                </tr>
              </thead>

              <tbody>
                {dashboard
                  .recentOrders
                  .map((order) => (
                    <tr
                      key={
                        order.number
                      }
                    >
                      <td>
                        <strong>
                          #
                          {
                            order.number
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          order.customerName
                        }
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${order.status.toLowerCase()}`}
                        >
                          {formatStatus(
                            order.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatMoney(
                          order.totalInCents,
                        )}
                      </td>

                      <td>
                        {formatDate(
                          order.createdAt,
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel status-panel">
          <div className="panel-header">
            <div>
              <h2>
                Pedidos por status
              </h2>

              <p>
                Distribuição atual.
              </p>
            </div>
          </div>

          <div className="status-list">
            {Object.entries(
              dashboard.ordersByStatus,
            ).map(
              ([
                status,
                quantity,
              ]) => (
                <div
                  className="status-row"
                  key={status}
                >
                  <span>
                    {formatStatus(
                      status,
                    )}
                  </span>

                  <strong>
                    {quantity}
                  </strong>
                </div>
              ),
            )}
          </div>
        </article>
      </section>
    </div>
  );
}