import { AppError } from "../../core/errors/app-error";
import { createPaginationMetadata } from "../../core/pagination/pagination";
import { createSlug } from "../../core/utils/slug";

import { CategoryRepository } from "./category.repository";
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./category.types";

export class CategoryService {
  constructor(
    private readonly repository: CategoryRepository,
  ) {}

  async create(input: CreateCategoryInput) {
    const name = input.name.trim();

    const existingName =
      await this.repository.findByName(name);

    if (existingName) {
      throw new AppError(
        "Já existe uma categoria com este nome.",
        409,
        "CATEGORY_NAME_ALREADY_EXISTS",
      );
    }

    const slug = await this.createUniqueSlug(name);

    const category = await this.repository.create({
      name,
      slug,
      description: input.description?.trim(),
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
    });

    return this.toPublicCategory(category);
  }

  async listAdmin(input: ListCategoriesInput) {
    const [categories, totalItems] = await Promise.all([
      this.repository.list(input),
      this.repository.count(input),
    ]);

    return {
      categories: categories.map((category) =>
        this.toPublicCategory(category),
      ),

      pagination: createPaginationMetadata(
        input.page,
        input.limit,
        totalItems,
      ),
    };
  }

  async listPublic(input: Omit<ListCategoriesInput, "isActive">) {
    const publicInput: ListCategoriesInput = {
      ...input,
      isActive: true,
    };

    const [categories, totalItems] = await Promise.all([
      this.repository.list(publicInput),
      this.repository.count(publicInput),
    ]);

    return {
      categories: categories.map((category) =>
        this.toPublicCategory(category),
      ),

      pagination: createPaginationMetadata(
        input.page,
        input.limit,
        totalItems,
      ),
    };
  }

  async findById(publicId: string) {
    const category =
      await this.repository.findByPublicId(publicId);

    if (!category) {
      throw new AppError(
        "Categoria não encontrada.",
        404,
        "CATEGORY_NOT_FOUND",
      );
    }

    return this.toPublicCategory(category);
  }

  async findPublicBySlug(slug: string) {
    const category =
      await this.repository.findActiveBySlug(slug);

    if (!category) {
      throw new AppError(
        "Categoria não encontrada.",
        404,
        "CATEGORY_NOT_FOUND",
      );
    }

    return this.toPublicCategory(category);
  }

  async update(
    publicId: string,
    input: UpdateCategoryInput,
  ) {
    const currentCategory =
      await this.repository.findByPublicId(publicId);

    if (!currentCategory) {
      throw new AppError(
        "Categoria não encontrada.",
        404,
        "CATEGORY_NOT_FOUND",
      );
    }

    let slug: string | undefined;
    let normalizedName: string | undefined;

    if (input.name !== undefined) {
      normalizedName = input.name.trim();

      const categoryWithSameName =
        await this.repository.findByName(normalizedName);

      if (
        categoryWithSameName &&
        categoryWithSameName.id !== currentCategory.id
      ) {
        throw new AppError(
          "Já existe uma categoria com este nome.",
          409,
          "CATEGORY_NAME_ALREADY_EXISTS",
        );
      }

      if (normalizedName !== currentCategory.name) {
        slug = await this.createUniqueSlug(
          normalizedName,
          currentCategory.id,
        );
      }
    }

    const category = await this.repository.update(publicId, {
      name: normalizedName,
      slug,
      description:
        typeof input.description === "string"
          ? input.description.trim()
          : input.description,
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
    });

    return this.toPublicCategory(category);
  }

  async updateStatus(
    publicId: string,
    isActive: boolean,
  ) {
    const category =
      await this.repository.findByPublicId(publicId);

    if (!category) {
      throw new AppError(
        "Categoria não encontrada.",
        404,
        "CATEGORY_NOT_FOUND",
      );
    }

    if (category.isActive === isActive) {
      return this.toPublicCategory(category);
    }

    const updatedCategory =
      await this.repository.updateStatus(
        publicId,
        isActive,
      );

    return this.toPublicCategory(updatedCategory);
  }

  private async createUniqueSlug(
    name: string,
    ignoredInternalId?: string,
  ): Promise<string> {
    const baseSlug = createSlug(name);

    if (!baseSlug) {
      throw new AppError(
        "Não foi possível gerar um slug para esta categoria.",
        422,
        "INVALID_CATEGORY_SLUG",
      );
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
      const existing =
        await this.repository.findBySlug(candidate);

      if (
        !existing ||
        existing.id === ignoredInternalId
      ) {
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private toPublicCategory(category: {
    publicId: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: category.publicId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}