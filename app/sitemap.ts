import type { MetadataRoute } from "next";
import { defaultProducts } from "./lib/products";

const baseUrl = "https://litopsatelier.ru";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/catalog", "/product", "/custom", "/contact", "/checkout", "/legal"];

  return [
    ...pages.map((path, index) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: index === 0 ? ("weekly" as const) : ("monthly" as const),
      priority: index === 0 ? 1 : 0.8,
    })),
    ...defaultProducts.map((product) => ({
      url: `${baseUrl}/product/${product.id}/`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
