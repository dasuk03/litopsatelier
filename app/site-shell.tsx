"use client";

import {
  ArrowDown,
  ArrowRight,
  Check,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import Lenis from "lenis";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { withBasePath } from "./lib/paths";
import { rub } from "./lib/products";
import { ProductImage } from "./product-image";
import { useShop } from "./shop";

const navigation = [
  ["01", "Главная", "/"],
  ["02", "Каталог", "/catalog"],
  ["03", "О бренде", "/#story"],
  ["04", "Индивидуальный заказ", "/custom"],
  ["05", "Контакты", "/contact"],
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    products,
    cart,
    favorites,
    cartOpen,
    setCartOpen,
    cartCount,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    toast,
  } = useShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sticky, setSticky] = useState(false);
  const [promo, setPromo] = useState("");

  const isHome = pathname === "/";
  const discount = promo.trim().toUpperCase() === "LITOPS10"
    ? Math.round(cartSubtotal * 0.1)
    : 0;
  const delivery = cartSubtotal === 0 || cartSubtotal >= 7000 ? 0 : 490;
  const total = Math.max(0, cartSubtotal + delivery - discount);

  const cartRows = useMemo(
    () =>
      cart
        .map((item) => ({
          item,
          product: products.find((product) => product.id === item.productId),
        }))
        .filter((row) => row.product),
    [cart, products],
  );

  useEffect(() => {
    try {
      setPromo(window.localStorage.getItem("litops-promo-v1") ?? "");
    } catch {
      // Promo state remains optional when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced
      ? null
      : new Lenis({
          anchors: true,
          autoRaf: true,
          lerp: 0.085,
          overscroll: true,
          smoothWheel: true,
          syncTouch: false,
          wheelMultiplier: 0.9,
        });

    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--page-scroll", `${scrollY}`);
      document.documentElement.style.setProperty(
        "--scroll-progress",
        max > 0 ? `${scrollY / max}` : "0",
      );
      setSticky(scrollY > 22);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      lenis?.destroy();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setSticky(window.scrollY > 22);
  }, [pathname]);

  useEffect(() => {
    const revealSelector = "[data-reveal]";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealImmediately = (root: ParentNode) => {
      if (root instanceof Element && root.matches(revealSelector)) {
        root.classList.add("is-visible");
      }
      root.querySelectorAll(revealSelector).forEach((node) => node.classList.add("is-visible"));
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealImmediately(document);
      const mutationObserver = new MutationObserver((records) => {
        records.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) revealImmediately(node);
          });
        });
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      return () => mutationObserver.disconnect();
    }

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -4%" },
    );
    const observeRevealNodes = (root: ParentNode) => {
      const nodes: Element[] = [];
      if (root instanceof Element && root.matches(revealSelector)) nodes.push(root);
      root.querySelectorAll(revealSelector).forEach((node) => nodes.push(node));
      nodes.forEach((node) => {
        if (observed.has(node)) return;
        observed.add(node);
        observer.observe(node);
      });
    };

    observeRevealNodes(document);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) observeRevealNodes(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const modalOpen = menuOpen || searchOpen || cartOpen;
    document.documentElement.classList.toggle("shell-modal-open", modalOpen);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setSearchOpen(false);
      setCartOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("shell-modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, searchOpen, cartOpen, setCartOpen]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    setSearchOpen(false);
    router.push(value ? `/catalog?q=${encodeURIComponent(value)}` : "/catalog");
  };

  return (
    <div className="page-shell">
      <div className="scroll-progress" aria-hidden="true" />
      <header
        className={`site-header ${isHome ? "site-header--home" : "site-header--inner"} ${sticky ? "is-sticky" : ""}`}
      >
        <button
          className="header-control"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Открыть меню"
        >
          <Menu size={18} strokeWidth={1.7} /> <span>Меню</span>
        </button>
        <Link
          className="brand-logo brand-logo-header"
          href="/"
          aria-label="Litops Atelier — главная"
        >
          <img
            src={withBasePath("/images/litops-logo-transparent.png")}
            alt="Litops Atelier"
            width="86"
            height="68"
            decoding="async"
          />
        </Link>
        <div className="header-actions">
          <button
            className="header-icon"
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Поиск по каталогу"
          >
            <Search size={18} strokeWidth={1.7} />
          </button>
          <Link
            className="header-icon favorite-trigger"
            href="/catalog?favorites=1"
            aria-label={`Избранное, товаров: ${favorites.length}`}
          >
            <Heart size={18} strokeWidth={1.7} />
            {favorites.length > 0 && <b>{favorites.length}</b>}
          </Link>
          <button
            className="header-control cart-trigger"
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Открыть корзину, товаров: ${cartCount}`}
          >
            <span>Корзина</span> <ShoppingBag size={18} strokeWidth={1.7} />
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <p className="eyebrow">Litops Atelier</p>
            <h2>
              Носите то,<br />
              <em>что откликается</em>
            </h2>
          </div>
          <Link className="footer-circle" href="/catalog">
            <ArrowDown size={26} strokeWidth={1.2} />
            <span>В каталог</span>
          </Link>
        </div>
        <div className="footer-grid">
          <div>
            <Link
              className="brand-logo brand-logo-footer"
              href="/"
              aria-label="Litops Atelier — главная"
            >
              <img
                src={withBasePath("/images/litops-logo-transparent.png")}
                alt="Litops Atelier"
                width="184"
                height="160"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p>
              Браслеты ручной работы
              <br />из натуральных камней.
            </p>
          </div>
          <nav aria-label="Навигация в подвале">
            <span>Навигация</span>
            <Link href="/catalog">Каталог</Link>
            <Link href="/#story">О бренде</Link>
            <Link href="/custom">Индивидуальный заказ</Link>
          </nav>
          <nav aria-label="Покупателям">
            <span>Покупателям</span>
            <Link href="/contact">Контакты</Link>
            <Link href="/legal?document=delivery-and-returns">Доставка и возврат</Link>
            <Link href="/#faq">Уход за украшениями</Link>
            <Link href="/admin">Управление магазином</Link>
          </nav>
          <nav aria-label="Правовая информация">
            <span>Документы</span>
            <Link href="/legal?document=privacy">Обработка персональных данных</Link>
            <Link href="/legal?document=personal-data-consent">Согласие на обработку данных</Link>
            <Link href="/legal?document=offer">Публичная оферта</Link>
            <Link href="/legal?document=cookies">Cookie и локальное хранение</Link>
            <Link href="/legal?document=seller-details">Сведения о продавце</Link>
          </nav>
          <div className="footer-location">
            <span>Магазин</span>
            <p>Создано в Москве</p>
            <a
              href="https://www.wildberries.ru/seller/4489837"
              target="_blank"
              rel="noreferrer"
            >
              Wildberries <ArrowRight size={15} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Litops Atelier</span>
          <span>Натуральные материалы · Ручная сборка</span>
        </div>
      </footer>

      <div
        className={`menu-overlay ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="menu-brand" aria-hidden="true">
          <img
            src={withBasePath("/images/litops-logo-transparent.png")}
            alt=""
            width="88"
            height="76"
            decoding="async"
          />
        </div>
        <button
          className="round-close"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Закрыть меню"
        >
          <X size={22} />
        </button>
        <nav aria-label="Основная навигация">
          {navigation.map(([number, label, href], index) => (
            <Link
              href={href}
              key={label}
              onClick={() => setMenuOpen(false)}
              style={{ "--menu-delay": `${180 + index * 42}ms` } as React.CSSProperties}
            >
              <span>{number}</span>
              {label}
              <ArrowRight size={24} strokeWidth={1.2} />
            </Link>
          ))}
        </nav>
        <div className="menu-foot">
          <span>2026</span>
        </div>
      </div>

      <div
        className={`search-overlay ${searchOpen ? "is-open" : ""}`}
        aria-hidden={!searchOpen}
        inert={!searchOpen}
      >
        <button
          className="search-backdrop"
          type="button"
          onClick={() => setSearchOpen(false)}
          aria-label="Закрыть поиск"
        />
        <form className="search-panel" onSubmit={submitSearch}>
          <Search size={21} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Название камня или браслета"
            aria-label="Поиск"
          />
          <button type="button" onClick={() => setSearchOpen(false)} aria-label="Закрыть">
            <X size={19} />
          </button>
        </form>
      </div>

      <aside
        className={`cart-drawer ${cartOpen ? "is-open" : ""}`}
        aria-hidden={!cartOpen}
        inert={!cartOpen}
      >
        <div className="cart-head">
          <div>
            <p className="eyebrow">Ваш выбор</p>
            <h2>
              Корзина <small>{cartCount}</small>
            </h2>
          </div>
          <button type="button" onClick={() => setCartOpen(false)} aria-label="Закрыть корзину">
            <X size={22} />
          </button>
        </div>
        {cartRows.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={35} strokeWidth={1.1} />
            <h3>Здесь пока тихо</h3>
            <p>Добавьте браслет из каталога — выбор сохранится на этом устройстве.</p>
            <Link className="pill pill-dark" href="/catalog" onClick={() => setCartOpen(false)}>
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {cartRows.map(({ item, product }) =>
                product ? (
                  <article className="cart-line" key={item.key}>
                    <ProductImage src={product.images[0]} alt="" />
                    <div>
                      <div className="cart-line-title">
                        <div>
                          <h3>{product.name}</h3>
                          <p>
                            {item.material} · {item.size} см
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.key)}
                          aria-label="Удалить товар"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <strong>{rub(product.price * item.quantity)}</strong>
                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                          aria-label="Уменьшить"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                          aria-label="Увеличить"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                ) : null,
              )}
            </div>
            <div className="cart-summary">
              <div className="promo-row">
                <input
                  value={promo}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPromo(value);
                    try {
                      window.localStorage.setItem("litops-promo-v1", value);
                    } catch {
                      // The cart remains usable without persistent promo state.
                    }
                  }}
                  placeholder="Промокод LITOPS10"
                  aria-label="Промокод"
                />
                <span>{discount > 0 ? `−${rub(discount)}` : ""}</span>
              </div>
              <dl className="cart-totals">
                <div>
                  <dt>Товары</dt>
                  <dd>{rub(cartSubtotal)}</dd>
                </div>
                <div>
                  <dt>Доставка</dt>
                  <dd>{delivery ? rub(delivery) : "Бесплатно"}</dd>
                </div>
                <div className="cart-totals-total">
                  <dt>Итого</dt>
                  <dd>{rub(total)}</dd>
                </div>
              </dl>
              <p>
                <Check size={15} /> Подарочная упаковка включена
              </p>
              <Link className="pill pill-dark" href="/checkout" onClick={() => setCartOpen(false)}>
                Перейти к оформлению <ArrowRight size={17} />
              </Link>
            </div>
          </>
        )}
      </aside>
      <button
        className={`backdrop ${cartOpen ? "is-visible" : ""}`}
        type="button"
        onClick={() => setCartOpen(false)}
        aria-label="Закрыть корзину"
      />
      <div className={`toast ${toast ? "is-visible" : ""}`} role="status">
        <Check size={16} /> {toast?.message}
      </div>
    </div>
  );
}
