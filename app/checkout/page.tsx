"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "../lib/paths";
import { rub } from "../lib/products";
import { readLocal, writeLocal, type OrderRecord } from "../lib/storage";
import { useShop } from "../shop";

type FormState = {
  name: string;
  phone: string;
  email: string;
  contactMethod: string;
  city: string;
  address: string;
  deliveryMethod: string;
  comment: string;
  consent: boolean;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  contactMethod: "Telegram",
  city: "",
  address: "",
  deliveryMethod: "Пункт выдачи",
  comment: "",
  consent: false,
};

export default function CheckoutPage() {
  const { products, cart, cartSubtotal, clearCart } = useShop();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderId, setOrderId] = useState("");
  const [promo, setPromo] = useState("");

  useEffect(() => {
    try {
      setPromo(window.localStorage.getItem("litops-promo-v1") ?? "");
    } catch {
      // Promo remains optional when storage is unavailable.
    }
  }, []);

  const rows = useMemo(
    () =>
      cart
        .map((item) => ({
          item,
          product: products.find((product) => product.id === item.productId),
        }))
        .filter((row) => row.product),
    [cart, products],
  );
  const delivery = cartSubtotal >= 7000 || cartSubtotal === 0 ? 0 : 490;
  const discount = promo.trim().toUpperCase() === "LITOPS10"
    ? Math.round(cartSubtotal * 0.1)
    : 0;
  const total = Math.max(0, cartSubtotal + delivery - discount);

  const update = (field: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateStep = () => {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) next.name = "Укажите имя";
      if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Укажите телефон";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Проверьте email";
    }
    if (step === 1) {
      if (!form.city.trim()) next.city = "Укажите город";
      if (!form.address.trim()) next.address = "Укажите адрес или пункт выдачи";
    }
    if (step === 2 && !form.consent) next.consent = "Подтвердите согласие";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((value) => Math.min(2, value + 1));
  };

  const placeOrder = () => {
    if (!validateStep() || rows.length === 0) return;
    const id = `LA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const order: OrderRecord = {
      id,
      createdAt: new Date().toISOString(),
      status: "Новый",
      customer: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        contactMethod: form.contactMethod,
      },
      delivery: {
        city: form.city,
        address: form.address,
        method: form.deliveryMethod,
        comment: form.comment,
      },
      items: rows.flatMap(({ item, product }) =>
        product
          ? [
              {
                productId: product.id,
                name: product.name,
                material: item.material,
                size: item.size,
                quantity: item.quantity,
                price: product.price,
              },
            ]
          : [],
      ),
      total,
    };
    const orders = readLocal<OrderRecord[]>("litops-orders-v1", []);
    writeLocal("litops-orders-v1", [order, ...orders]);
    setOrderId(id);
    clearCart();
  };

  const field = (
    key: keyof FormState,
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <label className={errors[key] ? "field-error" : ""}>
      <span>{label}</span>
      <input
        type={type}
        value={String(form[key])}
        placeholder={placeholder}
        onChange={(event) => update(key, event.target.value)}
      />
      {errors[key] && <small>{errors[key]}</small>}
    </label>
  );

  if (orderId) {
    return (
      <div className="inner-page order-success">
        <span className="success-icon">
          <Check size={34} />
        </span>
        <p className="eyebrow">Заявка принята</p>
        <h1>Спасибо за ваш выбор</h1>
        <p>
          Номер заявки <strong>{orderId}</strong>. Данные сохранены в панели
          управления этого сайта. Перед оплатой мастер свяжется с вами и
          подтвердит наличие, размер и доставку.
        </p>
        <div className="success-actions">
          <Link className="pill pill-dark" href="/catalog">
            Вернуться в каталог
          </Link>
          <a
            className="pill pill-outline"
            href="https://www.wildberries.ru/seller/4489837"
            target="_blank"
            rel="noreferrer"
          >
            Магазин на Wildberries
          </a>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="inner-page checkout-empty">
        <ShoppingBag size={42} strokeWidth={1.1} />
        <h1>Корзина пока пуста</h1>
        <p>Сначала выберите браслет и нужный размер.</p>
        <Link className="pill pill-dark" href="/catalog">
          Открыть каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="inner-page checkout-page">
      <header className="checkout-header">
        <p className="eyebrow">Оформление заказа</p>
        <h1>Последние детали</h1>
      </header>
      <div className="checkout-progress" aria-label={`Шаг ${step + 1} из 3`}>
        {[
          ["01", "Контакты"],
          ["02", "Доставка"],
          ["03", "Проверка"],
        ].map(([number, label], index) => (
          <div className={index <= step ? "is-active" : ""} key={number}>
            <span>{number}</span>
            <b>{label}</b>
          </div>
        ))}
      </div>

      <div className="checkout-layout">
        <section className="checkout-form-card">
          {step === 0 && (
            <div className="checkout-step">
              <div className="checkout-step-title">
                <ShieldCheck size={22} />
                <div>
                  <p className="eyebrow">Шаг 1</p>
                  <h2>Как с вами связаться</h2>
                </div>
              </div>
              <div className="form-grid">
                {field("name", "Имя", "Как к вам обращаться")}
                {field("phone", "Телефон", "+7 999 000-00-00", "tel")}
                {field("email", "Email — необязательно", "name@example.com", "email")}
                <label>
                  <span>Предпочтительный способ связи</span>
                  <select
                    value={form.contactMethod}
                    onChange={(event) => update("contactMethod", event.target.value)}
                  >
                    <option>Telegram</option>
                    <option>Телефон</option>
                    <option>Email</option>
                    <option>VK</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="checkout-step">
              <div className="checkout-step-title">
                <MapPin size={22} />
                <div>
                  <p className="eyebrow">Шаг 2</p>
                  <h2>Куда доставить</h2>
                </div>
              </div>
              <div className="form-grid">
                {field("city", "Город", "Москва")}
                <label>
                  <span>Способ доставки</span>
                  <select
                    value={form.deliveryMethod}
                    onChange={(event) => update("deliveryMethod", event.target.value)}
                  >
                    <option>Пункт выдачи</option>
                    <option>Курьерская доставка</option>
                    <option>Самовывоз по согласованию</option>
                  </select>
                </label>
                <label className={`wide ${errors.address ? "field-error" : ""}`}>
                  <span>Адрес или пункт выдачи</span>
                  <input
                    value={form.address}
                    placeholder="Улица, дом или адрес ПВЗ"
                    onChange={(event) => update("address", event.target.value)}
                  />
                  {errors.address && <small>{errors.address}</small>}
                </label>
                <label className="wide">
                  <span>Комментарий — необязательно</span>
                  <textarea
                    rows={4}
                    value={form.comment}
                    placeholder="Пожелания по размеру, упаковке или доставке"
                    onChange={(event) => update("comment", event.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-step checkout-confirm">
              <div className="checkout-step-title">
                <PackageCheck size={22} />
                <div>
                  <p className="eyebrow">Шаг 3</p>
                  <h2>Проверьте данные</h2>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Получатель</dt>
                  <dd>
                    {form.name}
                    <br />
                    {form.phone}
                    {form.email && (
                      <>
                        <br />{form.email}
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Доставка</dt>
                  <dd>
                    {form.city}, {form.address}
                    <br />{form.deliveryMethod}
                  </dd>
                </div>
                <div>
                  <dt>Оплата</dt>
                  <dd>После подтверждения заказа мастером</dd>
                </div>
              </dl>
              <label className={`consent-row ${errors.consent ? "field-error" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                />
                <span>
                  Согласен на обработку данных для связи и оформления заказа.
                </span>
                {errors.consent && <small>{errors.consent}</small>}
              </label>
            </div>
          )}

          <div className="checkout-nav">
            {step > 0 ? (
              <button className="pill pill-outline" type="button" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Назад
              </button>
            ) : (
              <Link className="text-button" href="/catalog">
                Продолжить выбор
              </Link>
            )}
            {step < 2 ? (
              <button className="pill pill-dark" type="button" onClick={nextStep}>
                Продолжить <ArrowRight size={16} />
              </button>
            ) : (
              <button className="pill pill-dark" type="button" onClick={placeOrder}>
                Оформить заявку <Check size={16} />
              </button>
            )}
          </div>
        </section>

        <aside className="checkout-summary">
          <div className="checkout-summary-head">
            <h2>Ваш заказ</h2>
            <span>{rows.length}</span>
          </div>
          {rows.map(({ item, product }) =>
            product ? (
              <article key={item.key}>
                <img src={withBasePath(product.images[0])} alt="" />
                <div>
                  <h3>{product.name}</h3>
                  <p>
                    {item.material} · {item.size} см
                  </p>
                  <small>
                    {item.quantity} × {rub(product.price)}
                  </small>
                </div>
                <strong>{rub(product.price * item.quantity)}</strong>
              </article>
            ) : null,
          )}
          <dl>
            <div>
              <dt>Товары</dt>
              <dd>{rub(cartSubtotal)}</dd>
            </div>
            <div>
              <dt>Доставка</dt>
              <dd>{delivery === 0 ? "Бесплатно" : rub(delivery)}</dd>
            </div>
            {discount > 0 && (
              <div>
                <dt>Промокод LITOPS10</dt>
                <dd>−{rub(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Итого</dt>
              <dd>{rub(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
