"use client";

import { ArrowRight, Check, ImagePlus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  readLocal,
  writeLocal,
  type CustomRequestRecord,
} from "../lib/storage";

type CustomForm = {
  jewelryType: string;
  material: string;
  stone: string;
  size: string;
  tone: string;
  budget: string;
  deadline: string;
  idea: string;
  name: string;
  phone: string;
  email: string;
  contactMethod: string;
  consent: boolean;
};

const initialForm: CustomForm = {
  jewelryType: "Браслет",
  material: "Нержавеющая сталь",
  stone: "",
  size: "",
  tone: "",
  budget: "",
  deadline: "",
  idea: "",
  name: "",
  phone: "",
  email: "",
  contactMethod: "Telegram",
  consent: false,
};

export default function CustomPage() {
  const [form, setForm] = useState<CustomForm>(initialForm);
  const [references, setReferences] = useState<Array<{ name: string; url: string }>>([]);
  const referencesRef = useRef<Array<{ name: string; url: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setForm((current) => ({
      ...current,
      size: params.get("size") ?? current.size,
      tone: params.get("tone") ?? current.tone,
      material: params.get("material") ?? current.material,
    }));
  }, []);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);

  useEffect(
    () => () => referencesRef.current.forEach((item) => URL.revokeObjectURL(item.url)),
    [],
  );

  const update = (field: keyof CustomForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files)
      .filter((file) => file.type.startsWith("image/") && file.size <= 4 * 1024 * 1024)
      .slice(0, Math.max(0, 3 - references.length));
    setReferences((current) => [
      ...current,
      ...accepted.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    ]);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.stone.trim()) next.stone = "Укажите камень или желаемый оттенок";
    if (!form.size.trim()) next.size = "Укажите размер";
    if (!form.budget.trim()) next.budget = "Укажите ориентировочный бюджет";
    if (form.idea.trim().length < 10) next.idea = "Опишите идею чуть подробнее";
    if (!form.name.trim()) next.name = "Укажите имя";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Укажите телефон";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Проверьте email";
    if (!form.consent) next.consent = "Требуется согласие";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const requests = readLocal<CustomRequestRecord[]>("litops-custom-requests-v1", []);
    const request: CustomRequestRecord = {
      id: `CUSTOM-${String(Date.now()).slice(-7)}`,
      createdAt: new Date().toISOString(),
      status: "Новая",
      jewelryType: form.jewelryType,
      material: form.material,
      stone: form.stone,
      size: form.size,
      tone: form.tone,
      budget: form.budget,
      deadline: form.deadline,
      idea: form.idea,
      referenceNames: references.map((item) => item.name),
      name: form.name,
      phone: form.phone,
      email: form.email,
      contactMethod: form.contactMethod,
    };
    writeLocal("litops-custom-requests-v1", [request, ...requests]);
    setSuccess(true);
  };

  const field = (
    key: keyof CustomForm,
    label: string,
    placeholder = "",
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

  if (success) {
    return (
      <div className="inner-page order-success">
        <span className="success-icon">
          <Sparkles size={34} />
        </span>
        <p className="eyebrow">Индивидуальный заказ</p>
        <h1>Идея сохранена</h1>
        <p>
          Заявка появилась в панели управления. Мастер сможет увидеть выбранные
          параметры и связаться с вами удобным способом для согласования камней,
          посадки и финальной стоимости.
        </p>
        <div className="success-actions">
          <Link className="pill pill-dark" href="/catalog">
            Посмотреть готовые модели
          </Link>
          <button className="pill pill-outline" type="button" onClick={() => setSuccess(false)}>
            Изменить заявку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-page">
      <section className="custom-hero">
        <div>
          <p className="eyebrow">Индивидуальный заказ</p>
          <h1>
            Браслет,
            <br />созданный для вас
          </h1>
          <p>
            Опишите идею, выберите материалы и прикрепите референсы. Мы начнём
            с диалога и соберём сочетание без готового шаблона.
          </p>
        </div>
      </section>

      <section className="custom-form-layout inner-page">
        <form className="custom-form" onSubmit={submit} noValidate>
          <div className="form-section-head">
            <span>01</span>
            <div>
              <p className="eyebrow">Основа</p>
              <h2>Параметры изделия</h2>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>Тип украшения</span>
              <select
                value={form.jewelryType}
                onChange={(event) => update("jewelryType", event.target.value)}
              >
                <option>Браслет</option>
                <option>Парный комплект</option>
                <option>Подарочный набор</option>
              </select>
            </label>
            <label>
              <span>Материал фурнитуры</span>
              <select
                value={form.material}
                onChange={(event) => update("material", event.target.value)}
              >
                <option>Нержавеющая сталь</option>
                <option>Чёрная нержавеющая сталь</option>
                <option>Позолоченная нержавеющая сталь</option>
                <option>Без металла</option>
              </select>
            </label>
            {field("stone", "Камень или сочетание", "Лабрадорит, ларимар, голубые камни…")}
            {field("size", "Размер запястья", "Например, 17 см")}
            {field("tone", "Палитра", "Графит, молочный, земля…")}
            {field("budget", "Бюджет", "Например, до 8 000 ₽")}
            {field("deadline", "Желаемый срок", "", "date")}
            <label className={`wide ${errors.idea ? "field-error" : ""}`}>
              <span>Описание идеи</span>
              <textarea
                rows={6}
                value={form.idea}
                onChange={(event) => update("idea", event.target.value)}
                placeholder="Расскажите о стиле, цветах, символах и назначении украшения"
              />
              {errors.idea && <small>{errors.idea}</small>}
            </label>
          </div>

          <div className="form-section-head">
            <span>02</span>
            <div>
              <p className="eyebrow">Визуальное направление</p>
              <h2>Референсы</h2>
            </div>
          </div>
          <div className="references-upload">
            <label className="upload-zone">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleFiles(event.target.files)}
                disabled={references.length >= 3}
              />
              <ImagePlus size={30} />
              <strong>Добавьте до трёх изображений</strong>
              <p>JPG, PNG или WebP до 4 МБ. Файлы используются только для предпросмотра.</p>
            </label>
            {references.length > 0 && (
              <div className="reference-grid">
                {references.map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <img src={item.url} alt={`Референс ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(item.url);
                        setReferences((current) => current.filter((_, itemIndex) => itemIndex !== index));
                      }}
                      aria-label="Удалить референс"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section-head">
            <span>03</span>
            <div>
              <p className="eyebrow">Для обратной связи</p>
              <h2>Контакты</h2>
            </div>
          </div>
          <div className="form-grid">
            {field("name", "Имя", "Как к вам обращаться")}
            {field("phone", "Телефон", "+7 999 000-00-00", "tel")}
            {field("email", "Email — необязательно", "name@example.com", "email")}
            <label>
              <span>Способ связи</span>
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
          <label className={`consent-row ${errors.consent ? "field-error" : ""}`}>
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => update("consent", event.target.checked)}
            />
            <span>Согласен на обработку данных для связи по этой заявке.</span>
            {errors.consent && <small>{errors.consent}</small>}
          </label>
          <button className="pill pill-dark custom-submit" type="submit">
            Отправить заявку <ArrowRight size={16} />
          </button>
        </form>

        <aside className="custom-aside">
          <div>
            <p className="eyebrow">Как это работает</p>
            <h2>От идеи до личного украшения</h2>
          </div>
          <ol>
            {[
              ["01", "Заявка", "Вы описываете задачу и прикладываете референсы."],
              ["02", "Согласование", "Уточняем камни, посадку, фурнитуру и бюджет."],
              ["03", "Сборка", "Изделие собирается вручную и проходит проверку."],
              ["04", "Доставка", "Браслет отправляется в фирменной упаковке."],
            ].map(([number, title, text]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="aside-note">
            <Check size={18} />
            <p>Предварительное обсуждение не обязывает оформлять заказ.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
