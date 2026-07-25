import cors from "@fastify/cors";
import Fastify from "fastify";
import { productRoutes } from "./modules/products/product.routes";
import { env } from "./config/env";
import { authRoutes } from "./modules/auth/auth.routes";
import { categoryRoutes } from "./modules/categories/category.routes";
import authPlugin from "./plugins/auth";
import errorHandlerPlugin from "./plugins/error-handler";
import swaggerPlugin from "./plugins/swagger";
import { productVariantRoutes } from "./modules/product-variants/product-variant.routes";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "request.headers.authorization",
          "request.headers.cookie",
          "password",
          "passwordHash",
          "refreshToken",
          "tokenHash",
        ],
        censor: "[REDACTED]",
      },
    },
    disableRequestLogging: env.NODE_ENV === "test",
  });

    
  
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(swaggerPlugin);
  await app.register(authPlugin);
  await app.register(productRoutes);
  await app.register(productVariantRoutes);
  await app.register(errorHandlerPlugin);

  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Verificar status da API",
        response: {
          200: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
              },
              message: {
                type: "string",
              },
              data: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                  },
                  environment: {
                    type: "string",
                  },
                  timestamp: {
                    type: "string",
                    format: "date-time",
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return {
        success: true,
        message: "LS Street API está funcionando.",
        data: {
          status: "online",
          environment: env.NODE_ENV,
          timestamp: new Date().toISOString(),
        },
      };
    },
  );

  await app.register(authRoutes, {
    prefix: "/auth",
  });

  await app.register(categoryRoutes, {
    prefix: "/categories",
  });

  return app;
}