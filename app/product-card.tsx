"use client";

import { Heart, Plus } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { rub, type Product } from "./lib/products";
import { ProductImage } from "./product-image";
import { useShop } from "./shop";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { favorites, toggleFavorite, addToCart } = useShop();
  const favorite = favorites.includes(product.id);
  const badge = product.isNew
    ? "Новинка"
    : product.isPopular
      ? "Популярное"
      : product.oldPrice
        ? "Специальная цена"
        : undefined;
  const productHref = `/product?id=${encodeURIComponent(product.id)}`;

  return (
    <article
      className="product-card"
      data-reveal
      style={{ "--delay": `${index * 70}ms` } as CSSProperties}
    >
      <div className="product-image">
        <Link href={productHref} aria-label={`Открыть ${product.name}`}>
          <ProductImage src={product.images[0]} alt={`Браслет ${product.name}`} />
        </Link>
        {badge && <span className="badge">{badge}</span>}
        <button
          className={`favorite ${favorite ? "is-active" : ""}`}
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
        >
          <Heart size={18} strokeWidth={1.5} />
        </button>
        <button className="quick-add" type="button" onClick={() => addToCart(product.id)}>
          Добавить в корзину <Plus size={17} />
        </button>
      </div>
      <div className="product-meta">
        <div>
          <Link href={productHref}>
            <h3>{product.name}</h3>
          </Link>
          <p>
            {product.stone} · {product.material}
          </p>
        </div>
        <strong>
          {rub(product.price)}
          {product.oldPrice && <del>{rub(product.oldPrice)}</del>}
        </strong>
      </div>
    </article>
  );
}
