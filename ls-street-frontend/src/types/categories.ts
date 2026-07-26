export interface Category {
  id: string;
  name: string;
  slug: string;

  description: string | null;
  imageUrl: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CategoryPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;

  data: Category[];

  pagination: CategoryPagination;
}

export interface CategoryResponse {
  success: boolean;
  message: string;

  data: {
    category: Category;
  };
}