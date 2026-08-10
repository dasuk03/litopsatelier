import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDocumentsClient } from "./legal-documents-client";

export const metadata: Metadata = {
  title: "Документы",
  description: "Правовая информация, условия заказа и обработки данных Litops Atelier.",
  alternates: { canonical: "/legal/" },
};

export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div className="inner-page legal-loading" role="status">
          <span className="admin-spinner" aria-hidden="true" />
          <p>Загружаем документ…</p>
        </div>
      }
    >
      <LegalDocumentsClient />
    </Suspense>
  );
}
