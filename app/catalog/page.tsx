"use client";

import {
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  productCategories,
  productMaterials,
  productSizes,
} from "../lib/products";
import { ProductCard } from "../product-card";
import { useShop } from "../shop";

type Filters = {
  query: string;
  category: string;
  material: string;
  size: number | null;
  minPrice: number;
  maxPrice: number;
  discountOnly: boolean;
};

function validCategory(value: string | null) {
  const normalized = value === "Парные" ? "Парные браслеты" : value;
  return normalized && productCategories.includes(normalized as (typeof productCategories)[number])
    ? normalized
    : "Все";
}

function validMaterial(value: string | null) {
  return value && productMaterials.includes(value as (typeof productMaterials)[number])
    ? value
    : "Все";
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const { products, productsLoading, favorites, catalogView, setCatalogView } = useShop();
  const { catalogMin, catalogMax } = useMemo(() => {
    if (!products.length) return { catalogMin: 0, catalogMax: 0 };
    const prices = products.map((item) => item.price);
    return {
      catalogMin: Math.min(...prices),
      catalogMax: Math.max(...prices),
    };
  }, [products]);
  const requestedQuery = searchParams.get("q") ?? "";
  const requestedCategory = validCategory(searchParams.get("category"));
  const requestedMaterial = validMaterial(searchParams.get("material"));
  const requestedFavorites = searchParams.get("favorites") === "1";
  const [filters, setFilters] = useState<Filters>({
    query: requestedQuery,
    category: requestedCategory,
    material: requestedMaterial,
    size: null,
    minPrice: catalogMin,
    maxPrice: catalogMax,
    discountOnly: false,
  });
  const [sort, setSort] = useState("popular");
  const [visibleCount, setVisibleCount] = useState(9);
  const [filterOpen, setFilterOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(requestedFavorites);
  const previousPriceBounds = useRef({ min: catalogMin, max: catalogMax });

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      query: requestedQuery,
      category: requestedCategory,
      material: requestedMaterial,
    }));
    setFavoritesOnly(requestedFavorites);
    setVisibleCount(9);
    setFilterOpen(false);
  }, [requestedCategory, requestedFavorites, requestedMaterial, requestedQuery]);

  useEffect(() => {
    const previous = previousPriceBounds.current;
    setFilters((current) => {
      if (!products.length) {
        return current.minPrice === 0 && current.maxPrice === 0
          ? current
          : { ...current, minPrice: 0, maxPrice: 0 };
      }

      const minPrice =
        !Number.isFinite(current.minPrice) || current.minPrice <= previous.min
          ? catalogMin
          : Math.min(Math.max(current.minPrice, catalogMin), catalogMax);
      const maxPrice =
        !Number.isFinite(current.maxPrice) || current.maxPrice >= previous.max
          ? catalogMax
          : Math.min(Math.max(current.maxPrice, catalogMin), catalogMax);
      if (minPrice === current.minPrice && maxPrice === current.maxPrice) return current;
      return { ...current, minPrice, maxPrice: Math.max(minPrice, maxPrice) };
    });
    previousPriceBounds.current = { min: catalogMin, max: catalogMax };
  }, [catalogMax, catalogMin, products.length]);

  useEffect(() => {
    document.documentElement.classList.toggle("catalog-filter-open", filterOpen);
    return () => {
      document.documentElement.classList.remove("catalog-filter-open");
    };
  }, [filterOpen]);

  const filtered = useMemo(() => {
    const list = products.filter((product) => {
      const query = filters.query.trim().toLocaleLowerCase("ru");
      const matchesQuery =
        !query ||
        `${product.name} ${product.stone} ${product.collection} ${product.tags.join(" ")}`
          .toLocaleLowerCase("ru")
          .includes(query);
      const matchesCategory =
        filters.category === "Все" || product.category === filters.category;
      const matchesMaterial =
        filters.material === "Все" || product.material === filters.material;
      const matchesSize = filters.size === null || product.sizes.includes(filters.size);
      const matchesPrice =
        product.price >= filters.minPrice && product.price <= filters.maxPrice;
      const matchesDiscount = !filters.discountOnly || Boolean(product.oldPrice);
      const matchesFavorite = !favoritesOnly || favorites.includes(product.id);
      return (
        matchesQuery &&
        matchesCategory &&
        matchesMaterial &&
        matchesSize &&
        matchesPrice &&
        matchesDiscount &&
        matchesFavorite
      );
    });

    return [...list].sort((a, b) => {
      if (sort === "new") return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)) || b.rating - a.rating;
    });
  }, [products, filters, sort, favoritesOnly, favorites]);

  const resetFilters = () => {
    setFilters({
      query: "",
      category: "Все",
      material: "Все",
      size: null,
      minPrice: catalogMin,
      maxPrice: catalogMax,
      discountOnly: false,
    });
    setFavoritesOnly(false);
    setVisibleCount(9);
  };

  const activeLabels = [
    filters.query && `Поиск: ${filters.query}`,
    filters.category !== "Все" && filters.category,
    filters.material !== "Все" && filters.material,
    filters.size !== null && `${filters.size} см`,
    filters.discountOnly && "Только со скидкой",
    favoritesOnly && "Избранное",
  ].filter(Boolean) as string[];

  const filterContent = (
    <div className="catalog-filter-form">
      <div className="filter-group">
        <h3>Категория</h3>
        <div className="filter-list">
          {productCategories.map((category) => (
            <label key={category}>
              <input
                type="radio"
                name="category"
                checked={filters.category === category}
                onChange={() => setFilters((current) => ({ ...current, category }))}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <h3>Материал фурнитуры</h3>
        <div className="filter-list">
          {productMaterials.map((material) => (
            <label key={material}>
              <input
                type="radio"
                name="material"
                checked={filters.material === material}
                onChange={() => setFilters((current) => ({ ...current, material }))}
              />
              <span>{material}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="filter-group">
        <h3>Размер</h3>
        <div className="size-filter">
          <button
            type="button"
            className={filters.size === null ? "is-active" : ""}
            onClick={() => setFilters((current) => ({ ...current, size: null }))}
          >
            Все
          </button>
          {productSizes.map((size) => (
            <button
              type="button"
              className={filters.size === size ? "is-active" : ""}
              onClick={() => setFilters((current) => ({ ...current, size }))}
              key={size}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      {products.length > 0 && (
        <div className="filter-group">
          <h3>Цена до {filters.maxPrice.toLocaleString("ru-RU")} ₽</h3>
          <input
            className="range-single"
            type="range"
            data-lenis-prevent="true"
            min={catalogMin}
            max={catalogMax}
            step="100"
            value={filters.maxPrice}
            aria-label="Максимальная цена"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                maxPrice: Number(event.target.value),
              }))
            }
          />
        </div>
      )}
      <div className="filter-group filter-switches">
        <label className="switch-row">
          <input
            type="checkbox"
            checked={filters.discountOnly}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                discountOnly: event.target.checked,
              }))
            }
          />
          <span>Только товары со скидкой</span>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => setFavoritesOnly(event.target.checked)}
          />
          <span>Только избранное</span>
        </label>
      </div>
      <button className="text-button filter-reset" type="button" onClick={resetFilters}>
        Сбросить фильтры
      </button>
    </div>
  );

  return (
    <div className="inner-page catalog-page">
      <header className="inner-hero catalog-hero">
        <div>
          <p className="eyebrow">Каталог Litops Atelier</p>
          <h1>Браслеты из натуральных камней</h1>
        </div>
        <p>
          Найдите модель по камню, материалу, размеру и цене. Избранное и
          корзина сохраняются на этом устройстве.
        </p>
      </header>

      <div className="catalog-controls">
        <label className="catalog-search">
          <Search size={18} />
          <input
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({ ...current, query: event.target.value }))
            }
            placeholder="Название, камень или коллекция"
          />
        </label>
        <button className="mobile-filter-button" type="button" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal size={18} /> Фильтры
        </button>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Сортировка">
          <option value="popular">По популярности</option>
          <option value="new">Сначала новые</option>
          <option value="rating">По рейтингу</option>
          <option value="price-asc">Цена по возрастанию</option>
          <option value="price-desc">Цена по убыванию</option>
        </select>
        <div className="view-switcher" aria-label="Количество колонок">
          <button
            type="button"
            className={catalogView === 2 ? "is-active" : ""}
            onClick={() => setCatalogView(2)}
            aria-label="Две колонки"
          >
            <Grid2X2 size={18} />
          </button>
          <button
            type="button"
            className={catalogView === 3 ? "is-active" : ""}
            onClick={() => setCatalogView(3)}
            aria-label="Три колонки"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className={catalogView === 4 ? "is-active" : ""}
            onClick={() => setCatalogView(4)}
            aria-label="Четыре колонки"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </div>

      {activeLabels.length > 0 && (
        <div className="active-filter-chips">
          {activeLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
          <button type="button" onClick={resetFilters}>
            Очистить <X size={14} />
          </button>
        </div>
      )}

      <div className="catalog-layout">
        <aside className="catalog-sidebar">{filterContent}</aside>
        <section className="catalog-results" aria-busy={productsLoading}>
          <div className="catalog-result-line" aria-live="polite">
            <span>Найдено: {filtered.length}</span>
          </div>
          <div className={`catalog-grid catalog-grid--${catalogView}`}>
            {filtered.slice(0, visibleCount).map((product, index) => (
              <ProductCard product={product} index={index} key={product.id} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="catalog-empty">
              <h2>Ничего не найдено</h2>
              <p>Попробуйте изменить параметры или очистить фильтры.</p>
              <button className="pill pill-dark" type="button" onClick={resetFilters}>
                Сбросить фильтры
              </button>
            </div>
          )}
          {visibleCount < filtered.length && (
            <button
              className="show-more-button"
              type="button"
              onClick={() => setVisibleCount((count) => count + 6)}
            >
              Показать ещё
            </button>
          )}
        </section>
      </div>

      <div
        className={`filter-bottom-sheet ${filterOpen ? "is-open" : ""}`}
        aria-hidden={!filterOpen}
        inert={!filterOpen}
      >
        <button
          className="filter-sheet-backdrop"
          type="button"
          onClick={() => setFilterOpen(false)}
          aria-label="Закрыть фильтры"
        />
        <div className="filter-bottom-sheet-panel" data-lenis-prevent="true">
          <div className="filter-bottom-sheet-head">
            <h2>Фильтры</h2>
            <button type="button" onClick={() => setFilterOpen(false)} aria-label="Закрыть">
              <X size={21} />
            </button>
          </div>
          <div className="filter-bottom-sheet-body">{filterContent}</div>
          <button className="pill pill-dark" type="button" onClick={() => setFilterOpen(false)}>
            Показать {filtered.length} товаров
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={(
        <div className="inner-page catalog-page">
          <div className="catalog-loading" role="status">Загружаем каталог…</div>
        </div>
      )}
    >
      <CatalogContent />
    </Suspense>
  );
}
