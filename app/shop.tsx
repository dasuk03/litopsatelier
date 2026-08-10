"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  defaultProducts,
  type CartItem,
  type Product,
  type ProductMaterial,
} from "./lib/products";
import { loadPublishedProducts } from "./lib/cms";

const storageKeys = {
  products: "litops-products-v3",
  cart: "litops-cart-v3",
  favorites: "litops-favorites-v3",
  catalogView: "litops-catalog-view-v3",
};

type Toast = { id: number; message: string } | null;

type ShopContextValue = {
  products: Product[];
  productsLoading: boolean;
  setProducts: (products: Product[]) => void;
  resetProducts: () => void;
  cart: CartItem[];
  favorites: string[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toast: Toast;
  showToast: (message: string) => void;
  addToCart: (
    productId: string,
    options?: {
      material?: ProductMaterial;
      size?: number;
      quantity?: number;
    },
  ) => void;
  updateCartQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  cartCount: number;
  cartSubtotal: number;
  catalogView: 2 | 3 | 4;
  setCatalogView: (view: 2 | 3 | 4) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The storefront remains usable when storage is unavailable.
  }
}

function cartKey(productId: string, material: ProductMaterial, size: number) {
  return `${productId}__${material}__${size}`;
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<Product[]>(defaultProducts);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [catalogView, setCatalogViewState] = useState<2 | 3 | 4>(3);
  const [storageReady, setStorageReady] = useState(false);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cachedProducts = readStorage(storageKeys.products, defaultProducts);
    setProductsState(cachedProducts);
    setCart(readStorage(storageKeys.cart, []));
    setFavorites(readStorage(storageKeys.favorites, []));
    setCatalogViewState(readStorage(storageKeys.catalogView, 3));
    setStorageReady(true);

    void loadPublishedProducts()
      .then((remoteProducts) => {
        if (cancelled || !remoteProducts?.length) return;
        setProductsState(remoteProducts);
        writeStorage(storageKeys.products, remoteProducts);
      })
      .catch(() => {
        // Cached catalog keeps the shop usable during a temporary network issue.
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (storageReady) writeStorage(storageKeys.products, products);
  }, [products, storageReady]);

  useEffect(() => {
    if (storageReady) writeStorage(storageKeys.cart, cart);
  }, [cart, storageReady]);

  useEffect(() => {
    if (storageReady) writeStorage(storageKeys.favorites, favorites);
  }, [favorites, storageReady]);

  useEffect(() => {
    if (storageReady) writeStorage(storageKeys.catalogView, catalogView);
  }, [catalogView, storageReady]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const setProducts = useCallback((nextProducts: Product[]) => {
    setProductsState(nextProducts);
  }, []);

  const resetProducts = useCallback(() => {
    setProductsState(defaultProducts);
    showToast("Каталог восстановлен");
  }, [showToast]);

  const addToCart = useCallback(
    (
      productId: string,
      options?: {
        material?: ProductMaterial;
        size?: number;
        quantity?: number;
      },
    ) => {
      const product = products.find((item) => item.id === productId);
      if (!product) return;
      const material = options?.material ?? product.material;
      const size = options?.size ?? product.sizes[0];
      const quantity = Math.max(1, options?.quantity ?? 1);
      const key = cartKey(productId, material, size);

      setCart((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) {
          return current.map((item) =>
            item.key === key
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [...current, { key, productId, material, size, quantity }];
      });
      showToast(`${product.name} добавлен в корзину`);
    },
    [products, showToast],
  );

  const updateCartQuantity = useCallback((key: string, quantity: number) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.key !== key)
        : current.map((item) =>
            item.key === key ? { ...item, quantity } : item,
          ),
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((current) => current.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((current) => {
        const exists = current.includes(productId);
        showToast(exists ? "Удалено из избранного" : "Добавлено в избранное");
        return exists
          ? current.filter((id) => id !== productId)
          : [...current, productId];
      });
    },
    [showToast],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0),
    [cart, products],
  );

  const setCatalogView = useCallback((view: 2 | 3 | 4) => {
    setCatalogViewState(view);
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      products,
      productsLoading,
      setProducts,
      resetProducts,
      cart,
      favorites,
      cartOpen,
      setCartOpen,
      toast,
      showToast,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      toggleFavorite,
      cartCount,
      cartSubtotal,
      catalogView,
      setCatalogView,
    }),
    [
      products,
      productsLoading,
      setProducts,
      resetProducts,
      cart,
      favorites,
      cartOpen,
      toast,
      showToast,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      toggleFavorite,
      cartCount,
      cartSubtotal,
      catalogView,
      setCatalogView,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop должен использоваться внутри ShopProvider");
  return context;
}
