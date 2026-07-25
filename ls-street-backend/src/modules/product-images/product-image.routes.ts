import type { FastifyInstance } from "fastify";

import { prisma } from "../../database/prisma";
import { ProductImageController } from "./product-image.controller";
import { ProductImageRepository } from "./product-image.repository";
import { ProductImageService } from "./product-image.service";
import type {
  
  FastifyReply,
  FastifyRequest,
} from "fastify";



export async function productImageRoutes(
  app: FastifyInstance,
) {

    interface ProductParams {
  productId: string;
}

interface ProductImageParams {
  id: string;
}

    
  const repository = new ProductImageRepository(prisma);
  const service = new ProductImageService(repository);
  const controller = new ProductImageController(service);
const verifyAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user as {
    role?: string;
  };

  if (user.role !== "ADMIN") {
    return reply.status(403).send({
      message:
        "Você não possui permissão para realizar esta operação.",
      code: "ADMIN_PERMISSION_REQUIRED",
    });
  }
};
  
  app.get(
    "/products/:productId/images",
    {
      schema: {
        tags: ["Product Images"],
        summary: "Listar imagens de um produto",

        params: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: {
              type: "string",
              description: "Public ID do produto",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              images: {
                type: "array",
                items: {
                  $ref: "productImageResponse#",
                },
              },
            },
          },

          404: {
            $ref: "errorResponse#",
          },
        },
      },
    },

    controller.listByProduct.bind(controller),
  );

  app.get(
    "/product-images/:id",
    {
      schema: {
        tags: ["Product Images"],
        summary: "Buscar uma imagem pelo ID",

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "Public ID da imagem",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              image: {
                $ref: "productImageResponse#",
              },
            },
          },

          404: {
            $ref: "errorResponse#",
          },
        },
      },
    },

    controller.findById.bind(controller),
  );

 app.post<{
  Params: ProductParams;
}>(
  "/admin/products/:productId/images",
  {
    preHandler: [app.authenticate, verifyAdmin],

    schema: {
      tags: ["Product Images"],
      summary: "Adicionar imagem ao produto",
      security: [{ bearerAuth: [] }],

      consumes: ["multipart/form-data"],

      params: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: {
            type: "string",
            description: "Public ID do produto",
          },
        },
      },

      response: {
        201: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },

            image: {
              $ref: "productImageResponse#",
            },
          },
        },

        404: {
          $ref: "errorResponse#",
        },

        409: {
          $ref: "errorResponse#",
        },

        413: {
          $ref: "errorResponse#",
        },

        415: {
          $ref: "errorResponse#",
        },

        422: {
          $ref: "errorResponse#",
        },
      },
    },
  },

  controller.create.bind(controller),
);
  app.put<{
  Params: ProductImageParams;
}>(
  "/admin/product-images/:id",
    {
      preHandler: [app.authenticate, verifyAdmin],

      schema: {
        tags: ["Product Images"],
        summary: "Atualizar uma imagem",
        security: [{ bearerAuth: [] }],

        consumes: ["multipart/form-data"],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "Public ID da imagem",
            },
          },
        },

        body: {
          type: "object",
          properties: {
            image: {
              type: "string",
              format: "binary",
            },

            altText: {
              type: "string",
              nullable: true,
            },

            position: {
              type: "integer",
              minimum: 0,
            },

            isPrimary: {
              type: "boolean",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },

              image: {
                $ref: "productImageResponse#",
              },
            },
          },

          404: {
            $ref: "errorResponse#",
          },

          409: {
            $ref: "errorResponse#",
          },

          413: {
            $ref: "errorResponse#",
          },

          415: {
            $ref: "errorResponse#",
          },

          422: {
            $ref: "errorResponse#",
          },
        },
      },
    },

    controller.update.bind(controller),
  );

  app.patch<{
  Params: ProductImageParams;
}>(
  "/admin/product-images/:id/primary",
    {
      preHandler: [app.authenticate, verifyAdmin],

      schema: {
        tags: ["Product Images"],
        summary: "Definir imagem como principal",
        security: [{ bearerAuth: [] }],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "Public ID da imagem",
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },

              image: {
                $ref: "productImageResponse#",
              },
            },
          },

          404: {
            $ref: "errorResponse#",
          },
        },
      },
    },

    controller.setPrimary.bind(controller),
  );

  app.delete<{
  Params: ProductImageParams;
}>(
  "/admin/product-images/:id",
    {
      preHandler: [app.authenticate, verifyAdmin],

      schema: {
        tags: ["Product Images"],
        summary: "Excluir uma imagem",
        security: [{ bearerAuth: [] }],

        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: {
              type: "string",
              description: "Public ID da imagem",
            },
          },
        },

        response: {
          204: {
            type: "null",
          },

          404: {
            $ref: "errorResponse#",
          },
        },
      },
    },

    controller.delete.bind(controller),
  );
}