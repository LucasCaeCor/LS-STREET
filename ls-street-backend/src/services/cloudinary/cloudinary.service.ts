import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../config/cloudinary";
import { Readable } from "node:stream";

export interface UploadImageOptions {
  folder: string;
  filename?: string;
}

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export class CloudinaryService {
  async uploadImage(
    buffer: Buffer,
    options: UploadImageOptions,
  ): Promise<UploadImageResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.filename,

          resource_type: "image",

          overwrite: true,

          unique_filename: true,

          use_filename: true,

          transformation: [
            {
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },

        (error, result) => {
          if (error || !result) {
            return reject(error);
          }

          const upload = result as UploadApiResponse;

          resolve({
            url: upload.secure_url,
            publicId: upload.public_id,
          });
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}

export const cloudinaryService = new CloudinaryService();