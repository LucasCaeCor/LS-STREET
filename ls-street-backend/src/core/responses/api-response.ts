import type { FastifyReply } from "fastify";

interface SuccessResponseOptions<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

interface PaginatedResponseOptions<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message?: string;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  options: SuccessResponseOptions<T>,
) {
  const {
    data,
    message = "Operação realizada com sucesso.",
    statusCode = 200,
  } = options;

  return reply.status(statusCode).send({
    success: true,
    message,
    data,
  });
}

export function sendCreated<T>(
  reply: FastifyReply,
  data: T,
  message = "Registro criado com sucesso.",
) {
  return sendSuccess(reply, {
    data,
    message,
    statusCode: 201,
  });
}

export function sendNoContent(reply: FastifyReply) {
  return reply.status(204).send();
}

export function sendPaginated<T>(
  reply: FastifyReply,
  options: PaginatedResponseOptions<T>,
) {
  return reply.status(200).send({
    success: true,
    message: options.message ?? "Registros encontrados com sucesso.",
    data: options.data,
    pagination: options.pagination,
  });
}