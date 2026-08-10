export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export type OrderRecord = {
  id: string;
  createdAt: string;
  status: "Новый" | "Подтверждён" | "В работе" | "Завершён";
  customer: {
    name: string;
    phone: string;
    email: string;
    contactMethod: string;
  };
  delivery: {
    city: string;
    address: string;
    method: string;
    comment: string;
  };
  items: Array<{
    productId: string;
    name: string;
    material: string;
    size: number;
    quantity: number;
    price: number;
  }>;
  total: number;
  consent?: {
    acceptedAt: string;
    documents: string[];
    version: string;
  };
};

export type CustomRequestRecord = {
  id: string;
  createdAt: string;
  status: "Новая" | "В работе" | "Выполнена" | "Отменена";
  jewelryType: string;
  material: string;
  stone: string;
  size: string;
  tone: string;
  budget: string;
  deadline: string;
  idea: string;
  referenceNames: string[];
  name: string;
  phone: string;
  email: string;
  contactMethod: string;
  consent?: {
    acceptedAt: string;
    documents: string[];
    version: string;
  };
};

export type ContactMessageRecord = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent?: {
    acceptedAt: string;
    documents: string[];
    version: string;
  };
};
