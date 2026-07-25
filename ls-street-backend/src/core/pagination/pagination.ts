import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type PaginationQuery = z.infer<
  typeof paginationQuerySchema
>;

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PrismaPagination {
  skip: number;
  take: number;
}

export function getPrismaPagination(
  page: number,
  limit: number,
): PrismaPagination {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function createPaginationMetadata(
  page: number,
  limit: number,
  totalItems: number,
): PaginationMetadata {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}