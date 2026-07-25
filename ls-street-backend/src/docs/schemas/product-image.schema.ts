import type { FastifyInstance } from "fastify";

export function registerProductImageSchemas(
  app: FastifyInstance,
) {
  app.addSchema({
    $id: "productImageResponse",

    type: "object",

    properties: {
      publicId: {
        type: "string",
      },

      url: {
        type: "string",
      },

      cloudinaryPublicId: {
        type: "string",
      },

      originalFilename: {
        type: "string",
        nullable: true,
      },

      altText: {
        type: "string",
        nullable: true,
      },

      position: {
        type: "integer",
      },

      isPrimary: {
        type: "boolean",
      },

      productId: {
        type: "string",
      },

      createdAt: {
        type: "string",
        format: "date-time",
      },

      updatedAt: {
        type: "string",
        format: "date-time",
      },
    },
  });
}