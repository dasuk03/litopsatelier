"use client";

import { ImagePlus, Save, Trash2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  type Product,
  type ProductCategory,
  type ProductMaterial,
} from "../lib/products";
import { ProductImage } from "../product-image";

const categories: ProductCategory[] = [
  "Браслеты",
  "Парные браслеты",
  "Минимализм",
  "Подарочные наборы",
];

const materials: ProductMaterial[] = [
  "Нержавеющая сталь",
  "Чёрная нержавеющая сталь",
  "Позолоченная нержавеющая сталь",
  "Без металла",
];

export function createBlankProduct(): Product {
  return {
    id: `bracelet-${Date.now()}`,
    name: "Новый браслет",
    stone: "",
    category: "Браслеты",
    collection: "Основная коллекция",
    material: "Нержавеющая сталь",
    colors: [],
    sizes: [15, 16, 17, 18, 19, 20, 21],
    price: 0,
    rating: 5,
    reviews: 0,
    stock: 1,
    isNew: true,
    published: true,
    clasp: false,
    stoneOrigin: "",
    madeIn: "Россия",
    description: "",
    shortDescription: "",
    images: [],
    package: ["Браслет", "Фирменная бирка", "Мешочек для хранения", "Подарочная упаковка"],
    care: [
      "Снимайте изделие перед душем, бассейном и тренировкой.",
      "Храните отдельно от других украшений.",
      "Протирайте камни сухой мягкой салфеткой.",
    ],
    tags: [],
  };
}

type PendingImage = { file: File; preview: string };

export function ProductEditor({
  product,
  saving,
  onClose,
  onSave,
}: {
  product: Product;
  saving: boolean;
  onClose: () => void;
  onSave: (product: Product, files: File[]) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const pendingRef = useRef<PendingImage[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(product);
    setError("");
  }, [product]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(
    () => () => pendingRef.current.forEach((item) => URL.revokeObjectURL(item.preview)),
    [],
  );

  const patch = <K extends keyof Product>(key: K, value: Product[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const addFiles = (files: File[]) => {
    const accepted = files.filter((file) => file.type.startsWith("image/") && file.size <= 8 * 1024 * 1024);
    if (accepted.length !== files.length) {
      setError("Можно загружать изображения JPG, PNG, WebP или HEIC размером до 8 МБ");
    }
    setPending((current) => [
      ...current,
      ...accepted.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ].slice(0, 10));
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const removePending = (index: number) => {
    setPending((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const submit = async () => {
    if (!draft.name.trim()) return setError("Укажите название браслета");
    if (!draft.stone.trim()) return setError("Укажите камень");
    if (!draft.stoneOrigin.trim()) return setError("Укажите происхождение камня");
    if (draft.price <= 0) return setError("Укажите актуальную цену");
    if (!draft.images.length && !pending.length) return setError("Добавьте хотя бы одну фотографию");
    await onSave(
      {
        ...draft,
        id: draft.id.trim().toLowerCase().replace(/\s+/g, "-"),
        name: draft.name.trim(),
        stone: draft.stone.trim(),
        stoneOrigin: draft.stoneOrigin.trim(),
      },
      pending.map((item) => item.file),
    );
  };

  return (
    <div className="admin-editor-overlay" role="dialog" aria-modal="true" aria-label="Редактор товара">
      <button className="admin-editor-backdrop" type="button" onClick={onClose} aria-label="Закрыть редактор" />
      <section className="admin-editor">
        <header>
          <div>
            <p className="eyebrow">Карточка товара</p>
            <h2>{product.images.length ? "Редактирование" : "Новый браслет"}</h2>
          </div>
          <button className="round-icon-button" type="button" onClick={onClose} aria-label="Закрыть">
            <X size={20} />
          </button>
        </header>

        <div className="admin-editor-body">
          <div className="admin-form-section">
            <div className="admin-form-section-title"><span>01</span><h3>Основная информация</h3></div>
            <div className="admin-form-grid">
              <label className="wide"><span>Название</span><input value={draft.name} onChange={(event) => patch("name", event.target.value)} /></label>
              <label><span>ID карточки</span><input value={draft.id} onChange={(event) => patch("id", event.target.value)} /></label>
              <label><span>Коллекция</span><input value={draft.collection} onChange={(event) => patch("collection", event.target.value)} /></label>
              <label><span>Камень</span><input value={draft.stone} onChange={(event) => patch("stone", event.target.value)} /></label>
              <label><span>Происхождение камня</span><input value={draft.stoneOrigin} onChange={(event) => patch("stoneOrigin", event.target.value)} placeholder="Например, Бразилия" /></label>
              <label><span>Категория</span><select value={draft.category} onChange={(event) => patch("category", event.target.value as ProductCategory)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Фурнитура</span><select value={draft.material} onChange={(event) => patch("material", event.target.value as ProductMaterial)}>{materials.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Изготовлено</span><input value={draft.madeIn} onChange={(event) => patch("madeIn", event.target.value)} /></label>
              <label><span>Размеры, через запятую</span><input value={draft.sizes.join(", ")} onChange={(event) => patch("sizes", event.target.value.split(",").map(Number).filter((value) => Number.isFinite(value) && value > 0))} /></label>
              <label><span>Цвета, через запятую</span><input value={draft.colors.join(", ")} onChange={(event) => patch("colors", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
              <label className="wide"><span>Краткое описание</span><input value={draft.shortDescription} onChange={(event) => patch("shortDescription", event.target.value)} /></label>
              <label className="wide"><span>Полное описание</span><textarea rows={5} value={draft.description} onChange={(event) => patch("description", event.target.value)} /></label>
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-section-title"><span>02</span><h3>Цена и наличие</h3></div>
            <div className="admin-form-grid admin-form-grid-four">
              <label><span>Новая цена, ₽</span><input type="number" min="0" value={draft.price} onChange={(event) => patch("price", Number(event.target.value))} /></label>
              <label><span>Старая цена, ₽</span><input type="number" min="0" value={draft.oldPrice ?? ""} onChange={(event) => patch("oldPrice", event.target.value ? Number(event.target.value) : undefined)} /></label>
              <label><span>Остаток</span><input type="number" min="0" value={draft.stock} onChange={(event) => patch("stock", Number(event.target.value))} /></label>
              <label><span>Отзывы</span><input type="number" min="0" value={draft.reviews} onChange={(event) => patch("reviews", Number(event.target.value))} /></label>
            </div>
            <div className="admin-toggle-row">
              {([
                ["published", "Показывать в каталоге"],
                ["isNew", "Новинка"],
                ["isPopular", "Популярное"],
                ["clasp", "Есть замок"],
              ] as const).map(([key, label]) => (
                <label key={key}><input type="checkbox" checked={Boolean(draft[key])} onChange={(event) => patch(key, event.target.checked)} /><span>{label}</span></label>
              ))}
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-section-title"><span>03</span><h3>Фотографии</h3></div>
            <label
              className={`admin-dropzone ${dragActive ? "is-active" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
            >
              <input type="file" accept="image/*" multiple onChange={(event) => addFiles(Array.from(event.target.files ?? []))} />
              <UploadCloud size={30} strokeWidth={1.3} />
              <strong>Перетащите фотографии сюда</strong>
              <span>или нажмите для выбора · до 12 МБ, фотографии будут сжаты автоматически</span>
            </label>
            <div className="admin-image-url">
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Или вставьте прямую ссылку на изображение" />
              <button type="button" onClick={() => { if (imageUrl.trim()) { patch("images", [...draft.images, imageUrl.trim()]); setImageUrl(""); } }}><ImagePlus size={17} /> Добавить</button>
            </div>
            <div className="admin-image-grid">
              {draft.images.map((image, index) => (
                <figure key={`${image}-${index}`}>
                  <ProductImage src={image} alt={`Фото ${index + 1}`} />
                  <button type="button" onClick={() => patch("images", draft.images.filter((_, imageIndex) => imageIndex !== index))} aria-label="Удалить фотографию"><Trash2 size={15} /></button>
                  {index === 0 && <figcaption>Главное фото</figcaption>}
                </figure>
              ))}
              {pending.map((image, index) => (
                <figure className="is-pending" key={image.preview}>
                  <img src={image.preview} alt={image.file.name} />
                  <button type="button" onClick={() => removePending(index)} aria-label="Убрать фотографию"><Trash2 size={15} /></button>
                  <figcaption>Будет загружено</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-section-title"><span>04</span><h3>Дополнительные данные</h3></div>
            <div className="admin-form-grid">
              <label className="wide"><span>Теги, через запятую</span><input value={draft.tags.join(", ")} onChange={(event) => patch("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></label>
              <label><span>Комплектация, по строке</span><textarea rows={5} value={draft.package.join("\n")} onChange={(event) => patch("package", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
              <label><span>Уход, по строке</span><textarea rows={5} value={draft.care.join("\n")} onChange={(event) => patch("care", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
            </div>
          </div>
        </div>

        <footer>
          <div>{error && <p role="alert">{error}</p>}</div>
          <button className="pill pill-outline" type="button" onClick={onClose}>Отмена</button>
          <button className="pill pill-dark" type="button" onClick={submit} disabled={saving}>
            <Save size={16} /> {saving ? "Сохраняем…" : "Сохранить товар"}
          </button>
        </footer>
      </section>
    </div>
  );
}
