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
import multipart from "@fastify/multipart";
import { productImageRoutes } from "./modules/product-images/product-image.routes";
import { registerProductImageSchemas } from "./docs/schemas/product-image.schema";
import { registerErrorSchemas } from "./docs/schemas/error.schema";
import { cartRoutes } from "./modules/carts/cart.routes";
import { addressRoutes } from "./modules/addresses/address.routes";
import {
  checkoutRoutes,
} from "./modules/checkout/checkout.routes";
import {
  orderRoutes,
} from "./modules/orders/order.routes";
import {
  adminOrderRoutes,
} from "./modules/orders/admin-order.routes";
import {
  adminDashboardRoutes,
} from "./modules/admin-dashboard/admin-dashboard.routes";
import {
  paymentRoutes,
  paymentWebhookRoutes,
} from "./modules/payments/payment.routes";
import {
  inventoryRoutes,
} from "./modules/inventory/inventory.routes";
import {
  adminPaymentRoutes,
} from "./modules/admin-payments/admin-payment.routes";
import {
  adminCouponRoutes,
  couponRoutes,
} from "./modules/coupons/coupon.routes";
import {
  adminBannerRoutes,
  bannerRoutes,
} from "./modules/banners/banner.routes";
import {
  favoriteRoutes,
} from "./modules/favorites/favorite.routes";
import auditPlugin from "./plugins/audit";
import {
  adminAuditRoutes,
} from "./modules/audit/admin-audit.routes";
import {
  adminCustomerRoutes,
} from "./modules/admin-customers/admin-customer.routes";
import {
  adminFavoriteRoutes,
} from "./modules/admin-favorites/admin-favorite.routes";




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
    registerProductImageSchemas(app);
    registerErrorSchemas(app);
  
  await app.register(cors, {
  origin: "http://localhost:5173",
// origin: env.API_URL,


  credentials: true,

  methods: [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-signature",
    "x-request-id",
  ],
});

    await app.register(multipart, {
    limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024,
    },

    throwFileSizeLimit: true,
    });

  await app.register(swaggerPlugin);
  await app.register(authPlugin);
  await app.register(auditPlugin);
  await app.register(productRoutes);
  await app.register(productVariantRoutes);
  await app.register(productImageRoutes);
  await app.register(cartRoutes, {
  prefix: "/cart",
});
  await app.register(addressRoutes, {
  prefix: "/me/addresses",
});
  await app.register(checkoutRoutes, {
  prefix: "/checkout",
});
  await app.register(orderRoutes, {
  prefix: "/orders",
});
await app.register(paymentRoutes, {
  prefix: "/orders",
});

  await app.register(adminOrderRoutes, {
  prefix: "/admin/orders",
});
await app.register(
  paymentWebhookRoutes,
  {
    prefix: "/payments",
  },
);
await app.register(
  adminDashboardRoutes,
  {
    prefix:
      "/admin/dashboard",
  },
);
await app.register(
  inventoryRoutes,
  {
    prefix:
      "/admin/inventory",
  },
);
await app.register(
  adminPaymentRoutes,
  {
    prefix:
      "/admin/payments",
  },
);
await app.register(
  couponRoutes,
  {
    prefix: "/coupons",
  },
);
await app.register(
  adminCouponRoutes,
  {
    prefix: "/admin/coupons",
  },
);
await app.register(
  bannerRoutes,
  {
    prefix: "/banners",
  },
);
await app.register(
  adminBannerRoutes,
  {
    prefix:
      "/admin/banners",
  },
);
await app.register(
  favoriteRoutes,
  {
    prefix: "/favorites",
  },
);
await app.register(
  adminAuditRoutes,
  {
    prefix:
      "/admin/audit",
  },
);
await app.register(
  adminCustomerRoutes,
  {
    prefix: "/admin/customers",
  },
);

await app.register(
  adminFavoriteRoutes,
  {
    prefix:
      "/admin/favorites",
  },
);







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