import type {
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";

import type { ZodType } from "zod";

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
  headers?: ZodType;
}

interface ValidationIssue {
  field: string;
  message: string;
}

function formatZodIssues(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
): ValidationIssue[] {
  return issues.map((issue) => ({
    field:
      issue.path.length > 0
        ? issue.path.map(String).join(".")
        : "request",
    message: issue.message,
  }));
}

export function validate(
  schemas: ValidationSchemas,
): preHandlerHookHandler {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const validations = [
      {
        key: "body" as const,
        schema: schemas.body,
        value: request.body,
      },
      {
        key: "params" as const,
        schema: schemas.params,
        value: request.params,
      },
      {
        key: "query" as const,
        schema: schemas.query,
        value: request.query,
      },
      {
        key: "headers" as const,
        schema: schemas.headers,
        value: request.headers,
      },
    ];

    for (const validation of validations) {
      if (!validation.schema) {
        continue;
      }

      const result = await validation.schema.safeParseAsync(
        validation.value,
      );

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: "Dados da requisição inválidos.",
          code: "VALIDATION_ERROR",
          errors: formatZodIssues(result.error.issues),
        });
      }

      /*
       * Substitui os dados originais pelos dados processados pelo Zod.
       *
       * Isso é importante para:
       * - z.coerce.number();
       * - valores default;
       * - transform();
       * - trim();
       */
      switch (validation.key) {
        case "body":
          request.body = result.data;
          break;

        case "params":
          request.params = result.data;
          break;

        case "query":
          request.query = result.data;
          break;

        case "headers":
          /*
           * Os headers do Fastify/Node possuem uma estrutura especial.
           * Evitamos substituir request.headers completamente.
           */
          Object.assign(
            request.headers,
            result.data,
          );
          break;
      }
    }
  };
}