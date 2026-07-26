export interface ManagedProductImage {
  id: string;
  publicId: string;
  productId: string;

  url: string;
  cloudinaryPublicId: string | null;
  originalFilename: string | null;

  altText: string | null;

  position: number;
  isPrimary: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ProductImagesResponse {
  images: ManagedProductImage[];
}

export interface ProductImageResponse {
  message: string;
  image: ManagedProductImage;
}