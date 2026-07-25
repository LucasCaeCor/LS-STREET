import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { env } from "../config/env";

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  if (!env.SWAGGER_ENABLED) {
    return;
  }

  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.3",

      info: {
        title: "LS Street API",
        description: "API oficial do e-commerce LS Street.",
        version: "1.0.0",
      },

      servers: [
        {
          url: env.API_URL,
          description:
            env.NODE_ENV === "production"
              ? "Servidor de produção"
              : "Servidor local",
        },
      ],

      tags: [
        {
          name: "Health",
          description: "Status da aplicação",
        },
        {
          name: "Auth",
          description: "Cadastro, login e gerenciamento de sessão",
        },
        {
          name: "Users",
          description: "Gerenciamento de usuários",
        },
        {
          name: "Categories",
          description: "Gerenciamento de categorias",
        },
        {
          name: "Products",
          description: "Gerenciamento de produtos",
        },
        {
          name: "Inventory",
          description: "Gerenciamento de estoque",
        },
        {
          name: "Carts",
          description: "Gerenciamento do carrinho",
        },
        {
          name: "Orders",
          description: "Gerenciamento de pedidos",
        },
        {
          name: "Payments",
          description: "Pagamentos e integrações",
        },
      ],

      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",

    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },

    staticCSP: true,
  });
};

export default fp(swaggerPlugin, {
  name: "swagger-plugin",
});