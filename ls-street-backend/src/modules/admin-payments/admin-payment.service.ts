import {
  AppError,
} from "../../core/errors/app-error";

import {
  createPaginationMetadata,
} from "../../core/pagination/pagination";

import {
  AdminPaymentRepository,
} from "./admin-payment.repository";

import type {
  ListAdminPaymentsQuery,
} from "./admin-payment.schema";

export class AdminPaymentService {
  constructor(
    private readonly repository:
      AdminPaymentRepository,
  ) {}

  async list(
    query:
      ListAdminPaymentsQuery,
  ) {
    const endDate =
      query.endDate
        ? new Date(query.endDate)
        : undefined;

    if (endDate) {
      endDate.setHours(
        23,
        59,
        59,
        999,
      );
    }

    const result =
      await this.repository.list({
        page: query.page,
        limit: query.limit,

        search: query.search,

        status: query.status,
        method: query.method,
        gateway: query.gateway,

        startDate:
          query.startDate,

        endDate,

        sortOrder:
          query.sortOrder,
      });

    return {
      payments:
        result.payments,

      pagination:
        createPaginationMetadata(
          query.page,
          query.limit,
          result.totalItems,
        ),
    };
  }

  async findById(
    paymentId: string,
  ) {
    const payment =
      await this.repository
        .findById(paymentId);

    if (!payment) {
      throw new AppError(
        "Pagamento não encontrado.",
        404,
        "PAYMENT_NOT_FOUND",
      );
    }

    return payment;
  }

  async getSummary() {
    return this.repository
      .getSummary();
  }
}