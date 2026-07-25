export const errorResponseSchema = {
  type: "object",
  required: ["success", "error"],

  properties: {
    success: {
      type: "boolean",
      const: false,
    },

    error: {
      type: "object",
      required: ["code", "message"],

      properties: {
        code: {
          type: "string",
        },

        message: {
          type: "string",
        },

        details: {},
      },
    },
  },
} as const;

export const paginationSchema = {
  type: "object",
  required: [
    "page",
    "limit",
    "totalItems",
    "totalPages",
    "hasNextPage",
    "hasPreviousPage",
  ],

  properties: {
    page: {
      type: "integer",
      minimum: 1,
    },

    limit: {
      type: "integer",
      minimum: 1,
    },

    totalItems: {
      type: "integer",
      minimum: 0,
    },

    totalPages: {
      type: "integer",
      minimum: 0,
    },

    hasNextPage: {
      type: "boolean",
    },

    hasPreviousPage: {
      type: "boolean",
    },
  },
} as const;