import type { Product } from "@prisma/client";

export const PRODUCT_KINDS = ["WEBSITE", "APP", "DIGITAL"] as const;
export const PRODUCT_KIND_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  APP: "App",
  DIGITAL: "Digital product",
};
export const PRODUCT_LIMIT = 12;
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export type ProductCardData = Omit<Product, "image"> & { hasImage: boolean };

// Uploaded images take priority over the website's thumbnail.
export function productImageSrc(product: ProductCardData): string {
  if (product.hasImage) {
    return `/api/products/${product.id}/image?v=${product.updatedAt.getTime()}`;
  }

  return product.thumbnailUrl;
}

export function toProductCard({ image, ...product }: Product): ProductCardData {
  return { ...product, hasImage: Boolean(image && image.byteLength > 0) };
}
