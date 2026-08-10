import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductQueryClient } from "./product-query-client";

export const metadata: Metadata = {
  title: "Карточка браслета",
  description: "Подробная информация о браслете Litops Atelier.",
  alternates: { canonical: "/product/" },
};

export default function ProductQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="inner-page product-loading" role="status">
          <span className="admin-spinner" aria-hidden="true" />
          <p>Загружаем карточку браслета…</p>
        </div>
      }
    >
      <ProductQueryClient />
    </Suspense>
  );
}
