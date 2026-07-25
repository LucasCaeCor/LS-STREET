import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { ZodType } from "zod";

import { AppError } from "../errors/app-error";

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

interface ValidationErrorDetails {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

function formatValidationError(
  error: {
    flatten(): ValidationErrorDetails;
  },
) {
  return error.flatten();
}

export function validate(schemas: ValidationSchemas) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    if (schemas.params) {
      const result = schemas.params.safeParse(
        request.params,
      );

      if (!result.success) {
        throw new AppError(
          "Os parâmetros informados são inválidos.",
          422,
          "VALIDATION_ERROR",
          formatValidationError(result.error),
        );
      }

      request.params = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(
        request.query,
      );

      if (!result.success) {
        throw new AppError(
          "Os parâmetros da consulta são inválidos.",
          422,
          "VALIDATION_ERROR",
          formatValidationError(result.error),
        );
      }

      request.query = result.data;
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(
        request.body,
      );

      if (!result.success) {
        throw new AppError(
          "Os dados enviados são inválidos.",
          422,
          "VALIDATION_ERROR",
          formatValidationError(result.error),
        );
      }

      request.body = result.data;
    }
  };
}