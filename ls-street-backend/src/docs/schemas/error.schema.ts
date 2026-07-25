import type { FastifyInstance } from "fastify";

export function registerErrorSchemas(
  app: FastifyInstance,
) {
  app.addSchema({
    $id: "errorResponse",

    type: "object",

    required: ["message"],

    properties: {
      message: {
        type: "string",
      },

      code: {
        type: "string",
      },
    },
  });
}