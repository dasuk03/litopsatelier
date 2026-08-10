import type {
  ContactMessageRecord,
  CustomRequestRecord,
  OrderRecord,
} from "./storage";
import {
  defaultLegalDocuments,
  legalDocumentSlugs,
  type LegalDocument,
  type LegalDocumentSlug,
} from "./legal-documents";
import type { Product } from "./products";
import { isCmsConfigured, requireSupabase } from "./supabase";

type ProductRow = {
  id: string;
  data: Product;
  published: boolean;
  sort_order: number;
};

type LegalDocumentRow = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  published: boolean;
  sort_order: number;
  updated_at: string;
};

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

export async function loadPublishedProducts() {
  if (!isCmsConfigured) return null;
  const client = requireSupabase();
  const { data, error } = await client
    .from("store_products")
    .select("id,data,published,sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map((row) => ({
    ...row.data,
    id: row.id,
    published: row.published,
    sortOrder: row.sort_order,
  }));
}

export async function loadAdminProducts() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("store_products")
    .select("id,data,published,sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as ProductRow[]).map((row) => ({
    ...row.data,
    id: row.id,
    published: row.published,
    sortOrder: row.sort_order,
  }));
}

export async function saveProduct(product: Product, sortOrder = 0) {
  const client = requireSupabase();
  const normalized: Product = {
    ...product,
    published: product.published !== false,
    sortOrder,
  };
  const { error } = await client.from("store_products").upsert({
    id: normalized.id,
    data: normalized,
    published: normalized.published,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return normalized;
}

export async function saveProducts(products: Product[]) {
  const client = requireSupabase();
  const rows = products.map((product, index) => ({
    id: product.id,
    data: { ...product, published: product.published !== false, sortOrder: index },
    published: product.published !== false,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await client.from("store_products").upsert(rows);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(productId: string) {
  const client = requireSupabase();
  const { error } = await client.from("store_products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
}

function safeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "product";
}

export async function uploadProductImages(files: File[], productId: string) {
  const client = requireSupabase();
  const urls: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`Файл «${file.name}» не является изображением`);
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error(`Файл «${file.name}» больше 8 МБ`);
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
    const path = `${safeSegment(productId)}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from("product-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data } = client.storage.from("product-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

function rowToDocument(row: LegalDocumentRow): LegalDocument | null {
  if (!legalDocumentSlugs.includes(row.slug as LegalDocumentSlug)) return null;
  return {
    slug: row.slug as LegalDocumentSlug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    published: row.published,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

export async function loadLegalDocuments(options?: { admin?: boolean }) {
  if (!isCmsConfigured) return defaultLegalDocuments;
  const client = requireSupabase();
  let query = client
    .from("legal_documents")
    .select("slug,title,summary,body,published,sort_order,updated_at")
    .order("sort_order", { ascending: true });
  if (!options?.admin) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const remote = ((data ?? []) as LegalDocumentRow[])
    .map(rowToDocument)
    .filter((document): document is LegalDocument => Boolean(document));
  const bySlug = new Map(remote.map((document) => [document.slug, document]));
  return defaultLegalDocuments.map((document) => bySlug.get(document.slug) ?? document);
}

export async function saveLegalDocument(document: LegalDocument) {
  const client = requireSupabase();
  const updatedAt = new Date().toISOString();
  const { error } = await client.from("legal_documents").upsert({
    slug: document.slug,
    title: document.title,
    summary: document.summary,
    body: document.body,
    published: document.published,
    sort_order: document.sortOrder,
    updated_at: updatedAt,
  });
  if (error) throw new Error(error.message);
  return { ...document, updatedAt };
}

export async function isCurrentUserAdmin() {
  const client = requireSupabase();
  const { data, error } = await client.rpc("is_admin");
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function loadOrders() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("store_orders")
    .select("payload,status")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...(row.payload as OrderRecord), status: row.status as OrderRecord["status"] }));
}

export async function loadCustomRequests() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("custom_requests")
    .select("payload,status")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...(row.payload as CustomRequestRecord), status: row.status as CustomRequestRecord["status"] }));
}

export async function loadContactMessages() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("contact_messages")
    .select("payload")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.payload as ContactMessageRecord);
}

export async function submitOrder(order: OrderRecord) {
  if (!isCmsConfigured) return false;
  const client = requireSupabase();
  const { error } = await client.from("store_orders").insert({
    id: order.id,
    payload: order,
    status: order.status,
    created_at: order.createdAt,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function submitCustomRequest(request: CustomRequestRecord) {
  if (!isCmsConfigured) return false;
  const client = requireSupabase();
  const { error } = await client.from("custom_requests").insert({
    id: request.id,
    payload: request,
    status: request.status,
    created_at: request.createdAt,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function submitContactMessage(message: ContactMessageRecord) {
  if (!isCmsConfigured) return false;
  const client = requireSupabase();
  const { error } = await client.from("contact_messages").insert({
    id: message.id,
    payload: message,
    created_at: message.createdAt,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function setOrderStatus(id: string, status: OrderRecord["status"]) {
  const client = requireSupabase();
  const { error } = await client.from("store_orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setCustomRequestStatus(id: string, status: CustomRequestRecord["status"]) {
  const client = requireSupabase();
  const { error } = await client.from("custom_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export function readableCmsError(error: unknown) {
  const message = messageFrom(error);
  if (/invalid login credentials/i.test(message)) return "Неверный логин или пароль";
  if (/row-level security|permission denied/i.test(message)) {
    return "У этой учётной записи нет прав администратора";
  }
  return message;
}
