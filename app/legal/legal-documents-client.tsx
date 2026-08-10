"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { loadLegalDocuments } from "../lib/cms";
import {
  defaultLegalDocuments,
  legalDocumentSlugs,
  type LegalDocument,
  type LegalDocumentSlug,
} from "../lib/legal-documents";

function isSlug(value: string | null): value is LegalDocumentSlug {
  return Boolean(value && legalDocumentSlugs.includes(value as LegalDocumentSlug));
}

function renderBody(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const heading = /^\d+\./.test(block) || (block.length < 70 && !/[.!?:]$/.test(block));
      return heading ? <h2 key={`${block}-${index}`}>{block}</h2> : <p key={`${block}-${index}`}>{block}</p>;
    });
}

export function LegalDocumentsClient() {
  const searchParams = useSearchParams();
  const requestedSlug = searchParams.get("document");
  const slug = isSlug(requestedSlug) ? requestedSlug : "privacy";
  const [documents, setDocuments] = useState<LegalDocument[]>(defaultLegalDocuments);

  useEffect(() => {
    let active = true;
    void loadLegalDocuments()
      .then((next) => {
        if (active) setDocuments(next.filter((document) => document.published));
      })
      .catch(() => {
        // The built-in version remains available if the CMS is temporarily unavailable.
      });
    return () => {
      active = false;
    };
  }, []);

  const document = useMemo(
    () => documents.find((item) => item.slug === slug) ?? defaultLegalDocuments[0],
    [documents, slug],
  );

  return (
    <div className="inner-page legal-page">
      <header
        className={`legal-header${document.slug === "seller-details" ? " legal-header--seller" : ""}`}
      >
        <p className="eyebrow">Информация для покупателей</p>
        <h1>{document.title}</h1>
        <p>{document.summary}</p>
        <span>
          Редакция от {new Date(document.updatedAt).toLocaleDateString("ru-RU")}
        </span>
      </header>

      <div className="legal-layout">
        <aside className="legal-navigation" aria-label="Список документов">
          {documents.map((item) => (
            <Link
              className={item.slug === document.slug ? "is-active" : ""}
              href={`/legal?document=${item.slug}`}
              key={item.slug}
            >
              <span>{item.title}</span>
              <ArrowRight size={15} />
            </Link>
          ))}
        </aside>
        <article className="legal-content">{renderBody(document.body)}</article>
      </div>
    </div>
  );
}
