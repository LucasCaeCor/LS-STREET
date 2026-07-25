import { AppError } from "../../core/errors/app-error";

import { CartRepository } from "./cart.repository";

import type {
  AddCartItemInput,
  UpdateCartItemInput,
} from "./cart.schema";

export class CartService {
  constructor(
    private readonly repository: CartRepository,
  ) {}

  private calculateAvailableStock(variant: {
    stock: number;
    reservedStock: number;
  }) {
    return Math.max(
      variant.stock - variant.reservedStock,
      0,
    );
  }

  private validateVariantAvailability(variant: {
    isActive: boolean;
    stock: number;
    reservedStock: number;
    product: {
      status:
        | "DRAFT"
        | "ACTIVE"
        | "INACTIVE"
        | "ARCHIVED";
    };
  }) {
    if (!variant.isActive) {
      throw new AppError(
        "Esta variante não está disponível.",
        422,
        "PRODUCT_VARIANT_INACTIVE",
      );
    }

    if (variant.product.status !== "ACTIVE") {
      throw new AppError(
        "Este produto não está disponível para compra.",
        422,
        "PRODUCT_NOT_AVAILABLE",
      );
    }

    const availableStock =
      this.calculateAvailableStock(variant);

    if (availableStock <= 0) {
      throw new AppError(
        "Esta variante está sem estoque.",
        422,
        "PRODUCT_VARIANT_OUT_OF_STOCK",
      );
    }

    return availableStock;
  }

  private validateQuantity(
    quantity: number,
    availableStock: number,
  ) {
    if (quantity > availableStock) {
      throw new AppError(
        `Quantidade indisponível. Existem apenas ${availableStock} unidade(s) disponíveis.`,
        422,
        "INSUFFICIENT_PRODUCT_STOCK",
      );
    }
  }

  async getCart(userId: string) {
    const cart =
      await this.repository.findOrCreateByUserId(
        userId,
      );

    return this.toPublicCart(cart);
  }

  async addItem(
    userId: string,
    body: AddCartItemInput,
  ) {
    const variant =
      await this.repository.findVariantByPublicId(
        body.variantId,
      );

    if (!variant) {
      throw new AppError(
        "Variante não encontrada.",
        404,
        "PRODUCT_VARIANT_NOT_FOUND",
      );
    }

    const availableStock =
      this.validateVariantAvailability(variant);

    const cart =
      await this.repository.findOrCreateByUserId(
        userId,
      );

    const existingItem =
      await this.repository.findItemByCartAndVariant(
        cart.id,
        variant.id,
      );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + body.quantity;

      this.validateQuantity(
        newQuantity,
        availableStock,
      );

      await this.repository.updateItemQuantity(
        existingItem.id,
        newQuantity,
      );
    } else {
      this.validateQuantity(
        body.quantity,
        availableStock,
      );

      await this.repository.createItem(
        cart.id,
        variant.id,
        body.quantity,
      );
    }

    const updatedCart =
      await this.repository.findByUserId(userId);

    if (!updatedCart) {
      throw new AppError(
        "Não foi possível carregar o carrinho.",
        500,
        "CART_LOAD_ERROR",
      );
    }

    return this.toPublicCart(updatedCart);
  }

  async updateItem(
    userId: string,
    itemId: string,
    body: UpdateCartItemInput,
  ) {
    const item =
      await this.repository.findItemById(itemId);

    if (!item) {
      throw new AppError(
        "Item do carrinho não encontrado.",
        404,
        "CART_ITEM_NOT_FOUND",
      );
    }

    if (item.cart.userId !== userId) {
      throw new AppError(
        "Você não tem permissão para alterar este item.",
        403,
        "CART_ITEM_ACCESS_DENIED",
      );
    }

    const availableStock =
      this.validateVariantAvailability(
        item.variant,
      );

    this.validateQuantity(
      body.quantity,
      availableStock,
    );

    await this.repository.updateItemQuantity(
      item.id,
      body.quantity,
    );

    const updatedCart =
      await this.repository.findByUserId(userId);

    if (!updatedCart) {
      throw new AppError(
        "Não foi possível carregar o carrinho.",
        500,
        "CART_LOAD_ERROR",
      );
    }

    return this.toPublicCart(updatedCart);
  }

  async removeItem(
    userId: string,
    itemId: string,
  ) {
    const item =
      await this.repository.findItemById(itemId);

    if (!item) {
      throw new AppError(
        "Item do carrinho não encontrado.",
        404,
        "CART_ITEM_NOT_FOUND",
      );
    }

    if (item.cart.userId !== userId) {
      throw new AppError(
        "Você não tem permissão para remover este item.",
        403,
        "CART_ITEM_ACCESS_DENIED",
      );
    }

    await this.repository.deleteItem(item.id);

    const updatedCart =
      await this.repository.findByUserId(userId);

    if (!updatedCart) {
      throw new AppError(
        "Não foi possível carregar o carrinho.",
        500,
        "CART_LOAD_ERROR",
      );
    }

    return this.toPublicCart(updatedCart);
  }

  async clearCart(userId: string) {
    const cart =
      await this.repository.findByUserId(userId);

    if (!cart) {
      return {
        items: [],
        summary: {
          uniqueItems: 0,
          totalQuantity: 0,
          subtotalInCents: 0,
        },
      };
    }

    await this.repository.clearCart(cart.id);

    const updatedCart =
      await this.repository.findByUserId(userId);

    if (!updatedCart) {
      throw new AppError(
        "Não foi possível carregar o carrinho.",
        500,
        "CART_LOAD_ERROR",
      );
    }

    return this.toPublicCart(updatedCart);
  }

  private toPublicCart(cart: {
    id: string;
    createdAt: Date;
    updatedAt: Date;

    items: Array<{
      id: string;
      quantity: number;
      createdAt: Date;
      updatedAt: Date;

      variant: {
        publicId: string;
        sku: string;
        color: string | null;
        size: string | null;
        priceInCents: number;
        compareAtPriceInCents: number | null;
        stock: number;
        reservedStock: number;
        isActive: boolean;

        product: {
          publicId: string;
          name: string;
          slug: string;
          status:
            | "DRAFT"
            | "ACTIVE"
            | "INACTIVE"
            | "ARCHIVED";

          images: Array<{
            publicId: string;
            url: string;
            altText: string | null;
            isPrimary: boolean;
          }>;
        };
      };
    }>;
  }) {
    const items = cart.items.map((item) => {
      const unitPriceInCents =
        item.variant.priceInCents;

      const totalInCents =
        unitPriceInCents * item.quantity;

      const availableStock =
        this.calculateAvailableStock(
          item.variant,
        );

      const image =
        item.variant.product.images[0] ?? null;

      return {
        id: item.id,

        quantity: item.quantity,

        unitPriceInCents,
        totalInCents,

        availableStock,

        isAvailable:
          item.variant.isActive &&
          item.variant.product.status ===
            "ACTIVE" &&
          availableStock >= item.quantity,

        variant: {
          id: item.variant.publicId,
          sku: item.variant.sku,
          color: item.variant.color,
          size: item.variant.size,

          priceInCents:
            item.variant.priceInCents,

          compareAtPriceInCents:
            item.variant.compareAtPriceInCents,
        },

        product: {
          id: item.variant.product.publicId,
          name: item.variant.product.name,
          slug: item.variant.product.slug,
          image,
        },

        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const totalQuantity = items.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );

    const subtotalInCents = items.reduce(
      (total, item) =>
        total + item.totalInCents,
      0,
    );

    return {
      items,

      summary: {
        uniqueItems: items.length,
        totalQuantity,
        subtotalInCents,
      },

      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}