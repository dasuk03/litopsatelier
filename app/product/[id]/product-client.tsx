"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  X,
  ZoomIn,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "../../lib/paths";
import { rub, type ProductMaterial } from "../../lib/products";
import { ProductCard } from "../../product-card";
import { useShop } from "../../shop";

const materialChoices: ProductMaterial[] = [
  "Нержавеющая сталь",
  "Чёрная нержавеющая сталь",
  "Позолоченная нержавеющая сталь",
  "Без металла",
];

export function ProductClient({ id }: { id: string }) {
  const router = useRouter();
  const { products, favorites, toggleFavorite, addToCart } = useShop();
  const product = products.find((item) => item.id === id);
  const [activeImage, setActiveImage] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [material, setMaterial] = useState<ProductMaterial>("Нержавеющая сталь");
  const [size, setSize] = useState(17);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState("specs");

  useEffect(() => {
    if (!product) return;
    setMaterial(product.material);
    setSize(product.sizes[0]);
    setActiveImage(0);
  }, [product]);

  useEffect(() => {
    document.body.style.overflow = viewerOpen ? "hidden" : "";
    return () => {
      if (viewerOpen) document.body.style.overflow = "";
    };
  }, [viewerOpen]);

  const related = useMemo(
    () =>
      products
        .filter(
          (item) =>
            item.id !== product?.id &&
            (item.stone === product?.stone || item.category === product?.category),
        )
        .slice(0, 3),
    [products, product],
  );

  if (!product) {
    return (
      <div className="inner-page not-found-page">
        <p className="eyebrow">Ошибка 404</p>
        <h1>Такой браслет не найден</h1>
        <Link className="pill pill-dark" href="/catalog">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const favorite = favorites.includes(product.id);
  const addCurrent = () => addToCart(product.id, { material, size, quantity });
  const buyNow = () => {
    addCurrent();
    router.push("/checkout");
  };

  const accordions = [
    {
      id: "specs",
      label: "Характеристики",
      content: (
        <dl className="product-spec-list">
          <div>
            <dt>Камень</dt>
            <dd>{product.stone}</dd>
          </div>
          <div>
            <dt>Происхождение</dt>
            <dd>{product.stoneOrigin}</dd>
          </div>
          <div>
            <dt>Изготовлено</dt>
            <dd>{product.madeIn}</dd>
          </div>
          <div>
            <dt>Замок</dt>
            <dd>{product.clasp ? "Есть" : "Нет"}</dd>
          </div>
          <div>
            <dt>Комплектация</dt>
            <dd>{product.package.join(", ")}</dd>
          </div>
        </dl>
      ),
    },
    {
      id: "delivery",
      label: "Доставка и получение",
      content: (
        <p>
          Доставка по России рассчитывается при оформлении. Для заказов от
          7 000 ₽ доставка включена в стоимость. Готовые модели также доступны
          в магазине Litops Atelier на Wildberries.
        </p>
      ),
    },
    {
      id: "care",
      label: "Уход за изделием",
      content: (
        <ul>
          {product.care.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="inner-page product-page">
      <nav className="breadcrumbs" aria-label="Хлебные крошки">
        <Link href="/catalog">
          <ArrowLeft size={15} /> Каталог
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-gallery-thumbs">
            {product.images.map((image, index) => (
              <button
                type="button"
                className={index === activeImage ? "is-active" : ""}
                key={`${image}-${index}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={withBasePath(image)} alt={`${product.name}, вид ${index + 1}`} />
              </button>
            ))}
          </div>
          <button
            className="product-gallery-main"
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label="Открыть изображение на весь экран"
          >
            <img src={withBasePath(product.images[activeImage])} alt={product.name} />
            <span>
              <ZoomIn size={17} /> Увеличить
            </span>
          </button>
        </div>

        <div className="product-info">
          <div className="product-info-head">
            <div>
              <p className="eyebrow">
                {product.category} · коллекция {product.collection}
              </p>
              <h1>{product.name}</h1>
            </div>
            <button
              className={`favorite favorite-large ${favorite ? "is-active" : ""}`}
              type="button"
              onClick={() => toggleFavorite(product.id)}
              aria-label="Добавить в избранное"
            >
              <Heart size={22} strokeWidth={1.4} />
            </button>
          </div>

          <div className="product-rating">
            <span>
              <Star size={15} fill="currentColor" /> {product.rating.toFixed(1)}
            </span>
            <span>{product.reviews} отзывов</span>
          </div>
          <div className="product-price">
            <strong>{rub(product.price)}</strong>
            {product.oldPrice && <del>{rub(product.oldPrice)}</del>}
          </div>
          <p className="product-description">{product.description}</p>

          <div className="product-option">
            <div className="product-option-head">
              <span>Фурнитура</span>
              <strong>{material}</strong>
            </div>
            <div className="option-chips">
              {materialChoices.map((choice) => (
                <button
                  type="button"
                  className={material === choice ? "is-active" : ""}
                  onClick={() => setMaterial(choice)}
                  key={choice}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="product-option">
            <div className="product-option-head">
              <span>Размер</span>
              <strong>{size} см</strong>
            </div>
            <div className="option-chips option-chips-sizes">
              {product.sizes.map((choice) => (
                <button
                  type="button"
                  className={size === choice ? "is-active" : ""}
                  onClick={() => setSize(choice)}
                  key={choice}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="product-stock">
            <span /> В наличии: {product.stock} шт.
          </div>

          <div className="product-buy-row">
            <div className="quantity quantity-large">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Уменьшить количество"
              >
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Увеличить количество"
              >
                <Plus size={16} />
              </button>
            </div>
            <button className="pill pill-dark" type="button" onClick={addCurrent}>
              <ShoppingBag size={17} /> В корзину
            </button>
            <button className="pill pill-outline" type="button" onClick={buyNow}>
              Купить сейчас
            </button>
          </div>

          <div className="product-assurances">
            <span>
              <Check size={15} /> Натуральные камни
            </span>
            <span>
              <Check size={15} /> Подгонка по размеру
            </span>
            <span>
              <Check size={15} /> Подарочная упаковка
            </span>
          </div>

          <div className="product-accordions">
            {accordions.map((item) => (
              <article className={openAccordion === item.id ? "is-open" : ""} key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === item.id ? "" : item.id)}
                  aria-expanded={openAccordion === item.id}
                >
                  {item.label} <ChevronDown size={18} />
                </button>
                <div>
                  <div>{item.content}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="related-products">
          <div className="section-heading compact-heading" data-reveal>
            <div>
              <p className="eyebrow">Продолжить выбор</p>
              <h2>Похожие изделия</h2>
            </div>
          </div>
          <div className="product-grid">
            {related.map((item, index) => (
              <ProductCard product={item} index={index} key={item.id} />
            ))}
          </div>
        </section>
      )}

      <div className={`image-viewer ${viewerOpen ? "is-open" : ""}`} aria-hidden={!viewerOpen}>
        <button
          className="image-viewer-close"
          type="button"
          onClick={() => setViewerOpen(false)}
          aria-label="Закрыть изображение"
        >
          <X size={23} />
        </button>
        <button className="image-viewer-backdrop" type="button" onClick={() => setViewerOpen(false)} />
        <img src={withBasePath(product.images[activeImage])} alt={product.name} />
      </div>
    </div>
  );
}
