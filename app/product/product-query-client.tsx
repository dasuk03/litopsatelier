"use client";

import { useSearchParams } from "next/navigation";
import { ProductClient } from "./[id]/product-client";

export function ProductQueryClient() {
  const searchParams = useSearchParams();
  return <ProductClient id={searchParams.get("id") ?? ""} />;
}
