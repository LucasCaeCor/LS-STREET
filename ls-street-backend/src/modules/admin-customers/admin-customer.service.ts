import {
  AppError,
} from "../../core/errors/app-error";

import type {
  ListAdminCustomersQuery,
  UpdateCustomerStatusBody,
} from "./admin-customer.schema";

import {
  AdminCustomerRepository,
} from "./admin-customer.repository";

export class AdminCustomerService {
  constructor(
    private readonly repository:
      AdminCustomerRepository,
  ) {}

  private mapCustomerListItem(
    customer: Awaited<
      ReturnType<
        AdminCustomerRepository["updateStatus"]
      >
    >,
  ) {
    const latestOrder =
      customer.orders[0] ??
      null;

    return {
      id:
        customer.publicId,

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      avatarUrl:
        customer.avatarUrl,

      role:
        customer.role,

      status:
        customer.status,

      emailVerified:
        customer.emailVerified,

      lastLoginAt:
        customer.lastLoginAt,

      createdAt:
        customer.createdAt,

      updatedAt:
        customer.updatedAt,

      counts: {
        orders:
          customer._count
            .orders,

        addresses:
          customer._count
            .addresses,

        favorites:
          customer._count
            .favorites,
      },

      latestOrder:
        latestOrder
          ? {
              number:
                latestOrder
                  .number,

              status:
                latestOrder
                  .status,

              totalInCents:
                latestOrder
                  .totalInCents,

              createdAt:
                latestOrder
                  .createdAt,
            }
          : null,
    };
  }

  async list(
    query:
      ListAdminCustomersQuery,
  ) {
    const {
      customers,
      totalItems,
    } =
      await this.repository
        .findAll(query);

    const totalPages =
      Math.ceil(
        totalItems /
          query.limit,
      );

    return {
      customers:
        customers.map(
          (customer) =>
            this.mapCustomerListItem(
              customer,
            ),
        ),

      pagination: {
        page: query.page,
        limit: query.limit,

        totalItems,
        totalPages,

        hasNextPage:
          query.page <
          totalPages,

        hasPreviousPage:
          query.page > 1,
      },
    };
  }

  async summary() {
    return this.repository
      .getSummary();
  }

  async findByPublicId(
    publicId: string,
  ) {
    const customer =
      await this.repository
        .findByPublicId(
          publicId,
        );

    if (!customer) {
      throw new AppError(
        "Cliente não encontrado.",
        404,
        "CUSTOMER_NOT_FOUND",
      );
    }

    const purchaseStats =
      await this.repository
        .getPurchaseStats(
          customer.id,
        );

    const completedOrders =
      purchaseStats._count
        ._all;

    const totalSpentInCents =
      purchaseStats._sum
        .totalInCents ?? 0;

    const averageOrderInCents =
      completedOrders > 0
        ? Math.round(
            totalSpentInCents /
              completedOrders,
          )
        : 0;

    return {
      id:
        customer.publicId,

      name:
        customer.name,

      email:
        customer.email,

      phone:
        customer.phone,

      avatarUrl:
        customer.avatarUrl,

      role:
        customer.role,

      status:
        customer.status,

      emailVerified:
        customer.emailVerified,

      lastLoginAt:
        customer.lastLoginAt,

      createdAt:
        customer.createdAt,

      updatedAt:
        customer.updatedAt,

      statistics: {
        ordersCount:
          customer._count
            .orders,

        completedOrdersCount:
          completedOrders,

        totalSpentInCents,

        averageOrderInCents,

        addressesCount:
          customer._count
            .addresses,

        favoritesCount:
          customer._count
            .favorites,
      },

      addresses:
        customer.addresses.map(
          (address) => ({
            id:
              address.publicId,

            recipientName:
              address.recipientName,

            phone:
              address.phone,

            zipCode:
              address.zipCode,

            street:
              address.street,

            number:
              address.number,

            complement:
              address.complement,

            neighborhood:
              address.neighborhood,

            city:
              address.city,

            state:
              address.state,

            country:
              address.country,

            label:
              address.label,

            isDefault:
              address.isDefault,

            createdAt:
              address.createdAt,

            updatedAt:
              address.updatedAt,
          }),
        ),

      recentOrders:
        customer.orders.map(
          (order) => {
            const preview =
              order.items[0] ??
              null;

            const payment =
              order.payments[0] ??
              null;

            return {
              number:
                order.number,

              status:
                order.status,

              totals: {
                subtotalInCents:
                  order
                    .subtotalInCents,

                discountInCents:
                  order
                    .discountInCents,

                shippingInCents:
                  order
                    .shippingInCents,

                totalInCents:
                  order
                    .totalInCents,
              },

              preview:
                preview
                  ? {
                      productName:
                        preview
                          .productName,

                      imageUrl:
                        preview
                          .imageUrl,
                    }
                  : null,

              payment:
                payment
                  ? {
                      method:
                        payment
                          .method,

                      status:
                        payment
                          .status,
                    }
                  : null,

              paidAt:
                order.paidAt,

              createdAt:
                order.createdAt,
            };
          },
        ),
    };
  }

  async updateStatus(
    publicId: string,
    input:
      UpdateCustomerStatusBody,
  ) {
    const customer =
      await this.repository
        .findStatusByPublicId(
          publicId,
        );

    if (!customer) {
      throw new AppError(
        "Cliente não encontrado.",
        404,
        "CUSTOMER_NOT_FOUND",
      );
    }

    if (
      customer.status ===
      input.status
    ) {
      throw new AppError(
        "O cliente já possui esse status.",
        409,
        "CUSTOMER_STATUS_UNCHANGED",
      );
    }

    const updatedCustomer =
      await this.repository
        .updateStatus(
          publicId,
          input.status,
        );

    if (
      input.status !==
      "ACTIVE"
    ) {
      await this.repository
        .revokeSessions(
          customer.id,
        );
    }

    return this.mapCustomerListItem(
      updatedCustomer,
    );
  }
}