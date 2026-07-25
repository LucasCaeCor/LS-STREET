import type {
  Category,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { getPrismaPagination } from "../../core/pagination/pagination";

import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "./category.types";

interface CreateCategoryData extends CreateCategoryInput {
  slug: string;
}

interface UpdateCategoryData extends UpdateCategoryInput {
  slug?: string;
}

export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateCategoryData): Promise<Category> {
    return this.prisma.category.create({
      data,
    });
  }

  async findByPublicId(
    publicId: string,
  ): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: {
        publicId,
      },
    });
  }

  async findBySlug(
    slug: string,
  ): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: {
        slug,
      },
    });
  }

  async findByName(
    name: string,
  ): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
  }

  async findActiveBySlug(
    slug: string,
  ): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        slug,
        isActive: true,
      },
    });
  }

  async list(
    input: ListCategoriesInput,
  ): Promise<Category[]> {
    const pagination = getPrismaPagination(
      input.page,
      input.limit,
    );

    return this.prisma.category.findMany({
      where: this.createWhereInput(input),

      orderBy: {
        name: input.sortOrder,
      },

      skip: pagination.skip,
      take: pagination.take,
    });
  }

  async count(
    input: ListCategoriesInput,
  ): Promise<number> {
    return this.prisma.category.count({
      where: this.createWhereInput(input),
    });
  }

  async update(
    publicId: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    return this.prisma.category.update({
      where: {
        publicId,
      },
      data,
    });
  }

  async updateStatus(
    publicId: string,
    isActive: boolean,
  ): Promise<Category> {
    return this.prisma.category.update({
      where: {
        publicId,
      },

      data: {
        isActive,
      },
    });
  }

  private createWhereInput(
    input: ListCategoriesInput,
  ): Prisma.CategoryWhereInput {
    const where: Prisma.CategoryWhereInput = {};

    if (input.isActive !== undefined) {
      where.isActive = input.isActive;
    }

    if (input.search) {
      where.OR = [
        {
          name: {
            contains: input.search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: input.search,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: input.search,
            mode: "insensitive",
          },
        },
      ];
    }

    return where;
  }
}