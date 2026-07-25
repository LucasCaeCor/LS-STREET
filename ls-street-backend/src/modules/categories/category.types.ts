export interface CreateCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

export interface ListCategoriesInput {
  page: number;
  limit: number;
  search?: string;
  sortOrder: "asc" | "desc";
  isActive?: boolean;
}

export interface CategoryPublicData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}