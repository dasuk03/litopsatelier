"use client";

import { ArrowRight, Check, Clock3, MapPin, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  readLocal,
  writeLocal,
  type ContactMessageRecord,
} from "../lib/storage";

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
};

const initialForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  consent: false,
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const update = (field: keyof ContactForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Укажите имя";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Проверьте email";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Укажите телефон";
    if (!form.subject.trim()) next.subject = "Укажите тему";
    if (form.message.trim().length < 10) next.message = "Опишите вопрос подробнее";
    if (!form.consent) next.consent = "Требуется согласие";
    setErrors(next);
    if (Object.keys(next).length) return;

    const messages = readLocal<ContactMessageRecord[]>("litops-contact-messages-v1", []);
    const message: ContactMessageRecord = {
      id: `MSG-${String(Date.now()).slice(-7)}`,
      createdAt: new Date().toISOString(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message,
    };
    writeLocal("litops-contact-messages-v1", [message, ...messages]);
    setForm(initialForm);
    setSuccess(true);
  };

  const input = (
    field: keyof ContactForm,
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <label className={errors[field] ? "field-error" : ""}>
      <span>{label}</span>
      <input
        type={type}
        value={String(form[field])}
        placeholder={placeholder}
        onChange={(event) => update(field, event.target.value)}
      />
      {errors[field] && <small>{errors[field]}</small>}
    </label>
  );

  return (
    <div className="inner-page contact-page">
      <header className="inner-hero contact-hero">
        <div>
          <p className="eyebrow">Контакты</p>
          <h1>Давайте обсудим украшение</h1>
        </div>
        <p>
          Напишите по готовому товару, индивидуальному заказу, доставке или
          сотрудничеству. Сообщение сохранится в панели управления магазина.
        </p>
      </header>

      <div className="contact-layout">
        <section className="contact-info">
          <article>
            <MapPin size={22} />
            <div>
              <h2>Мастерская</h2>
              <p>Москва. Встречи и примерка — по предварительному согласованию.</p>
            </div>
          </article>
          <article>
            <Clock3 size={22} />
            <div>
              <h2>Время ответа</h2>
              <p>Ежедневно с 10:00 до 20:00. Обычно отвечаем в течение рабочего дня.</p>
            </div>
          </article>
          <article>
            <MessageCircle size={22} />
            <div>
              <h2>Готовые изделия</h2>
              <p>Актуальные карточки и отзывы покупателей доступны на Wildberries.</p>
              <a
                href="https://www.wildberries.ru/seller/4489837"
                target="_blank"
                rel="noreferrer"
              >
                Открыть магазин <ArrowRight size={15} />
              </a>
            </div>
          </article>
          <div className="contact-map" aria-hidden="true">
            <span>Москва</span>
            <strong>Litops Atelier</strong>
            <i />
          </div>
          <Link className="contact-custom-link" href="/custom">
            <span>
              <small>Нужна особенная работа?</small>
              Оформить индивидуальную заявку
            </span>
            <ArrowRight size={22} />
          </Link>
        </section>

        <form className="contact-form" onSubmit={submit} noValidate>
          <p className="eyebrow">Обратная связь</p>
          <h2>Отправить сообщение</h2>
          {input("name", "Имя", "Как к вам обращаться")}
          {input("phone", "Телефон", "+7 999 000-00-00", "tel")}
          {input("email", "Email — необязательно", "name@example.com", "email")}
          {input("subject", "Тема", "Готовый браслет, доставка, сотрудничество…")}
          <label className={`wide ${errors.message ? "field-error" : ""}`}>
            <span>Сообщение</span>
            <textarea
              rows={7}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              placeholder="Опишите ваш вопрос"
            />
            {errors.message && <small>{errors.message}</small>}
          </label>
          <label className={`consent-row wide ${errors.consent ? "field-error" : ""}`}>
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => update("consent", event.target.checked)}
            />
            <span>Согласен на обработку данных для ответа на сообщение.</span>
            {errors.consent && <small>{errors.consent}</small>}
          </label>
          <button className="pill pill-dark wide" type="submit">
            <Send size={17} /> Отправить сообщение
          </button>
          {success && (
            <div className="contact-success wide" role="status">
              <Check size={17} /> Сообщение сохранено. Спасибо!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
