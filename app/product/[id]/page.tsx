import type { Metadata } from "next";
import { defaultProducts } from "../../lib/products";
import { ProductClient } from "./product-client";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return defaultProducts.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = defaultProducts.find((item) => item.id === id);

  if (!product) return { title: "Браслет не найден" };

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/product/${product.id}/` },
    openGraph: {
      title: `${product.name} · Litops Atelier`,
      description: product.shortDescription,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductClient id={id} />;
}
