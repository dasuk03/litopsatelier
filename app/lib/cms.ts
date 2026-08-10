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
import { isCmsConfigured, requireNeon } from "./neon";

export const neonImagePrefix = "neon-image:";

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
  const client = requireNeon();
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
  const client = requireNeon();
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

export async function saveProduct(
  product: Product,
  sortOrder = 0,
  options?: { cleanupImages?: boolean },
) {
  const client = requireNeon();
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
  if (options?.cleanupImages !== false) {
    await deleteUnusedProductImages(normalized.id, normalized.images);
  }
  return normalized;
}

export async function saveProducts(products: Product[]) {
  const client = requireNeon();
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
  const client = requireNeon();
  const { error } = await client.from("store_products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
}

function imageReferenceId(value: string) {
  return value.startsWith(neonImagePrefix) ? value.slice(neonImagePrefix.length) : null;
}

function blobToDataUri(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось подготовить фотографию"));
    reader.readAsDataURL(blob);
  });
}

async function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function compressProductImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`Файл «${file.name}» не является изображением`);
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error(`Файл «${file.name}» больше 12 МБ`);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Формат «${file.name}» не удалось открыть в браузере`));
      image.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Браузер не поддерживает обработку фотографий");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    let blob: Blob | null = null;
    for (const quality of [0.84, 0.72, 0.6]) {
      blob = await canvasBlob(canvas, "image/webp", quality);
      if (blob && blob.size <= 4_000_000) break;
    }
    if (!blob) blob = await canvasBlob(canvas, "image/jpeg", 0.78);
    if (!blob || blob.size > 4_000_000) {
      throw new Error(`Фотографию «${file.name}» не удалось уменьшить до 4 МБ`);
    }

    return {
      contentType: blob.type === "image/webp" ? "image/webp" : "image/jpeg",
      dataUri: await blobToDataUri(blob),
      sizeBytes: blob.size,
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function deleteUnusedProductImages(productId: string, references: string[]) {
  const client = requireNeon();
  const retained = new Set(references.map(imageReferenceId).filter((id): id is string => Boolean(id)));
  const { data, error } = await client
    .from("product_images")
    .select("id")
    .eq("product_id", productId);
  if (error) throw new Error(error.message);
  const stale = (data ?? []).map((row) => String(row.id)).filter((id) => !retained.has(id));
  if (!stale.length) return;
  const { error: deleteError } = await client.from("product_images").delete().in("id", stale);
  if (deleteError) throw new Error(deleteError.message);
}

export async function uploadProductImages(files: File[], productId: string) {
  const client = requireNeon();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Сессия администратора завершилась. Войдите снова.");

  const references: string[] = [];

  for (const file of files) {
    const compressed = await compressProductImage(file);
    const { data, error } = await client
      .from("product_images")
      .insert({
        product_id: productId,
        content_type: compressed.contentType,
        data_uri: compressed.dataUri,
        size_bytes: compressed.sizeBytes,
        width: compressed.width,
        height: compressed.height,
        sort_order: references.length,
        uploaded_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    references.push(`${neonImagePrefix}${data.id}`);
  }

  return references;
}

const imageCache = new Map<string, Promise<string>>();

export function loadProductImage(reference: string) {
  const id = imageReferenceId(reference);
  if (!id) return Promise.resolve(reference);
  const cached = imageCache.get(id);
  if (cached) return cached;

  const request = (async () => {
    const client = requireNeon();
    const { data, error } = await client
      .from("product_images")
      .select("data_uri")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return String(data.data_uri);
  })();
  imageCache.set(id, request);
  return request;
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
  const client = requireNeon();
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
  const client = requireNeon();
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
  const client = requireNeon();
  const { data, error } = await client.rpc("is_admin");
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function claimAdmin(inviteToken: string) {
  const client = requireNeon();
  const { data, error } = await client.rpc("claim_admin", { invite_token: inviteToken.trim() });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function loadOrders() {
  const client = requireNeon();
  const { data, error } = await client
    .from("store_orders")
    .select("payload,status")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...(row.payload as OrderRecord), status: row.status as OrderRecord["status"] }));
}

export async function loadCustomRequests() {
  const client = requireNeon();
  const { data, error } = await client
    .from("custom_requests")
    .select("payload,status")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...(row.payload as CustomRequestRecord), status: row.status as CustomRequestRecord["status"] }));
}

export async function loadContactMessages() {
  const client = requireNeon();
  const { data, error } = await client
    .from("contact_messages")
    .select("payload")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.payload as ContactMessageRecord);
}

export async function submitOrder(order: OrderRecord) {
  if (!isCmsConfigured) return false;
  const client = requireNeon();
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
  const client = requireNeon();
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
  const client = requireNeon();
  const { error } = await client.from("contact_messages").insert({
    id: message.id,
    payload: message,
    created_at: message.createdAt,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function setOrderStatus(id: string, status: OrderRecord["status"]) {
  const client = requireNeon();
  const { error } = await client.from("store_orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setCustomRequestStatus(id: string, status: CustomRequestRecord["status"]) {
  const client = requireNeon();
  const { error } = await client.from("custom_requests").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export function readableCmsError(error: unknown) {
  const message = messageFrom(error);
  if (/invalid (login credentials|email or password)|incorrect password/i.test(message)) {
    return "Неверный логин или пароль";
  }
  if (/row-level security|permission denied/i.test(message)) {
    return "У этой учётной записи нет прав администратора";
  }
  return message;
}
