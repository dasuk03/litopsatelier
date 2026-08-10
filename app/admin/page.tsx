"use client";

import {
  Check,
  Download,
  FileText,
  FileUp,
  LogIn,
  LogOut,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  deleteProduct as deleteCmsProduct,
  isCurrentUserAdmin,
  loadAdminProducts,
  loadContactMessages,
  loadCustomRequests,
  loadLegalDocuments,
  loadOrders,
  readableCmsError,
  saveLegalDocument,
  saveProduct,
  saveProducts,
  setCustomRequestStatus,
  setOrderStatus,
  uploadProductImages,
} from "../lib/cms";
import { defaultLegalDocuments, type LegalDocument } from "../lib/legal-documents";
import { withBasePath } from "../lib/paths";
import { defaultProducts, rub, type Product } from "../lib/products";
import {
  type ContactMessageRecord,
  type CustomRequestRecord,
  type OrderRecord,
} from "../lib/storage";
import { isCmsConfigured, supabase } from "../lib/supabase";
import { useShop } from "../shop";
import { createBlankProduct, ProductEditor } from "./product-editor";

const tabs = [
  ["products", "Товары", Package],
  ["documents", "Документы", FileText],
  ["orders", "Заказы", ShoppingBag],
  ["custom", "Индивидуальные", Sparkles],
  ["messages", "Сообщения", MessageSquare],
] as const;

type TabId = (typeof tabs)[number][0];
type AuthState = "checking" | "unconfigured" | "signed-out" | "unauthorized" | "ready";

export default function AdminPage() {
  const { products, setProducts, showToast } = useShop();
  const [authState, setAuthState] = useState<AuthState>(isCmsConfigured ? "checking" : "unconfigured");
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("products");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [requests, setRequests] = useState<CustomRequestRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>(defaultLegalDocuments);
  const [documentDraft, setDocumentDraft] = useState<LegalDocument>(defaultLegalDocuments[0]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingDocument, setSavingDocument] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");
  const [remoteCatalogEmpty, setRemoteCatalogEmpty] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const verifyAccess = useCallback(async () => {
    if (!supabase) return setAuthState("unconfigured");
    const { data } = await supabase.auth.getSession();
    if (!data.session) return setAuthState("signed-out");
    setAccountEmail(data.session.user.email ?? "Администратор");
    try {
      const allowed = await isCurrentUserAdmin();
      setAuthState(allowed ? "ready" : "unauthorized");
    } catch (error) {
      setAuthError(readableCmsError(error));
      setAuthState("unauthorized");
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void verifyAccess();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setAuthState("signed-out");
        setAccountEmail("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [verifyAccess]);

  useEffect(() => {
    if (authState !== "ready") return;
    let active = true;
    setLoadingData(true);
    setDataError("");
    void Promise.all([
      loadAdminProducts(),
      loadLegalDocuments({ admin: true }),
      loadOrders(),
      loadCustomRequests(),
      loadContactMessages(),
    ])
      .then(([remoteProducts, remoteDocuments, remoteOrders, remoteRequests, remoteMessages]) => {
        if (!active) return;
        setRemoteCatalogEmpty(remoteProducts.length === 0);
        setProducts(remoteProducts.length ? remoteProducts : defaultProducts);
        setDocuments(remoteDocuments);
        setDocumentDraft(remoteDocuments[0] ?? defaultLegalDocuments[0]);
        setOrders(remoteOrders);
        setRequests(remoteRequests);
        setMessages(remoteMessages);
      })
      .catch((error) => {
        if (active) setDataError(readableCmsError(error));
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [authState, setProducts]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setSigningIn(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAuthError(readableCmsError(error));
      setSigningIn(false);
      return;
    }
    await verifyAccess();
    setPassword("");
    setSigningIn(false);
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  const persistProduct = async (product: Product, files: File[]) => {
    setSavingProduct(true);
    try {
      const uploaded = files.length ? await uploadProductImages(files, product.id) : [];
      const existingIndex = products.findIndex((item) => item.id === product.id);
      const sortOrder = existingIndex >= 0 ? existingIndex : products.length;
      const saved = await saveProduct({ ...product, images: [...product.images, ...uploaded] }, sortOrder);
      const next = existingIndex >= 0
        ? products.map((item, index) => index === existingIndex ? saved : item)
        : [...products, saved];
      setProducts(next);
      setRemoteCatalogEmpty(false);
      setEditingProduct(null);
      showToast(existingIndex >= 0 ? "Карточка обновлена" : "Браслет добавлен в каталог");
    } catch (error) {
      showToast(`Ошибка: ${readableCmsError(error)}`);
    } finally {
      setSavingProduct(false);
    }
  };

  const removeProduct = async (product: Product) => {
    if (!window.confirm(`Удалить «${product.name}» из каталога?`)) return;
    try {
      await deleteCmsProduct(product.id);
      setProducts(products.filter((item) => item.id !== product.id));
      showToast("Товар удалён");
    } catch (error) {
      showToast(`Ошибка: ${readableCmsError(error)}`);
    }
  };

  const publishBaseCatalog = async () => {
    try {
      await saveProducts(defaultProducts);
      setProducts(defaultProducts);
      setRemoteCatalogEmpty(false);
      showToast("Базовый каталог опубликован");
    } catch (error) {
      showToast(`Ошибка: ${readableCmsError(error)}`);
    }
  };

  const persistDocument = async () => {
    setSavingDocument(true);
    try {
      const saved = await saveLegalDocument(documentDraft);
      setDocuments((current) => current.map((item) => item.slug === saved.slug ? saved : item));
      setDocumentDraft(saved);
      showToast("Документ опубликован");
    } catch (error) {
      showToast(`Ошибка: ${readableCmsError(error)}`);
    } finally {
      setSavingDocument(false);
    }
  };

  const updateOrder = async (id: string, status: OrderRecord["status"]) => {
    try {
      await setOrderStatus(id, status);
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    } catch (error) {
      showToast(`Ошибка: ${readableCmsError(error)}`);
    }
  };

  const updateRequest = async (id: string, status: CustomRequestRecord["status"]) => {
    try {
      await setCustomRequestStatus(id, status);
      setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    } catch (error) {
      showToast(`Ошибка: ${readableCmsError(error)}`);
    }
  };

  const exportData = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), products, documents, orders, requests, messages }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `litops-atelier-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Резервная копия подготовлена");
  };

  const importData = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as { products?: Product[]; documents?: LegalDocument[] };
      if (Array.isArray(data.products)) {
        await saveProducts(data.products);
        setProducts(data.products);
      }
      if (Array.isArray(data.documents)) {
        const saved = await Promise.all(data.documents.map(saveLegalDocument));
        setDocuments(saved);
        setDocumentDraft(saved[0] ?? defaultLegalDocuments[0]);
      }
      showToast("Данные импортированы и опубликованы");
    } catch (error) {
      showToast(`Импорт не выполнен: ${readableCmsError(error)}`);
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  if (authState === "checking") return <AdminStatus text="Проверяем доступ…" />;
  if (authState === "unconfigured") return <AdminSetupNotice />;
  if (authState === "signed-out") {
    return <AdminLogin email={email} password={password} error={authError} loading={signingIn} onEmail={setEmail} onPassword={setPassword} onSubmit={signIn} />;
  }
  if (authState === "unauthorized") {
    return (
      <div className="inner-page admin-gate">
        <div className="admin-gate-card">
          <Settings2 size={34} strokeWidth={1.2} />
          <p className="eyebrow">Доступ ограничен</p>
          <h1>Аккаунт не назначен администратором</h1>
          <p>{authError || "Добавьте пользователя в список администраторов проекта, затем войдите повторно."}</p>
          <button className="pill pill-dark" type="button" onClick={signOut}><LogOut size={16} /> Выйти</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inner-page admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Управление Litops Atelier</p>
          <h1>Панель магазина</h1>
          <p>Товары, фотографии, заявки и документы синхронизируются между устройствами. Вход выполнен как {accountEmail}.</p>
        </div>
        <div className="admin-actions">
          <button className="pill pill-outline" type="button" onClick={exportData}><Download size={16} /> Экспорт</button>
          <button className="pill pill-outline" type="button" onClick={() => importRef.current?.click()}><FileUp size={16} /> Импорт</button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => importData(event.target.files?.[0])} />
          <button className="pill pill-dark" type="button" onClick={signOut}><LogOut size={16} /> Выйти</button>
        </div>
      </header>

      {dataError && <div className="admin-alert" role="alert">{dataError}</div>}
      {remoteCatalogEmpty && (
        <div className="admin-alert admin-alert-action">
          <span>Общая база товаров пока пуста. Опубликуйте текущий каталог одним нажатием.</span>
          <button type="button" onClick={publishBaseCatalog}><UploadCloud size={16} /> Опубликовать каталог</button>
        </div>
      )}

      <div className="admin-stats">
        <article><Package size={19} /><span>Товаров</span><strong>{products.length}</strong></article>
        <article><ShoppingBag size={19} /><span>Новых заказов</span><strong>{orders.filter((order) => order.status === "Новый").length}</strong></article>
        <article><Sparkles size={19} /><span>Индивидуальных заявок</span><strong>{requests.filter((request) => request.status === "Новая").length}</strong></article>
        <article><MessageSquare size={19} /><span>Сообщений</span><strong>{messages.length}</strong></article>
      </div>

      <div className="admin-tabs" role="tablist">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      {loadingData ? <AdminStatus text="Загружаем данные магазина…" compact /> : (
        <>
          {activeTab === "products" && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <div><p className="eyebrow">Каталог</p><h2>Карточки товаров</h2></div>
                <button className="pill pill-dark" type="button" onClick={() => setEditingProduct(createBlankProduct())}><Plus size={16} /> Добавить браслет</button>
              </div>
              <div className="admin-product-list">
                {products.map((product) => (
                  <article key={product.id}>
                    <img src={withBasePath(product.images[0] ?? "/images/product-terra.webp")} alt="" />
                    <div className="admin-product-main">
                      <div><span>{product.category} · {product.stone}</span><h3>{product.name}</h3><p>{product.stoneOrigin}</p></div>
                      <div className="admin-product-price"><strong>{rub(product.price)}</strong>{product.oldPrice && <del>{rub(product.oldPrice)}</del>}<small>{product.stock} шт.</small></div>
                    </div>
                    <div className="admin-product-flags">
                      <span className={product.published === false ? "is-muted" : ""}>{product.published === false ? "Скрыт" : "Опубликован"}</span>
                      {product.isNew && <span>Новинка</span>}
                      {product.isPopular && <span>Популярное</span>}
                    </div>
                    <div className="admin-product-actions">
                      <button type="button" onClick={() => setEditingProduct(product)}><Pencil size={16} /> Редактировать</button>
                      <button className="is-danger" type="button" onClick={() => removeProduct(product)} aria-label={`Удалить ${product.name}`}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "documents" && (
            <section className="admin-panel admin-documents-panel">
              <div className="admin-panel-head"><div><p className="eyebrow">Правовая информация</p><h2>Документы сайта</h2></div></div>
              <div className="admin-documents-layout">
                <nav aria-label="Редактируемые документы">
                  {documents.map((document) => (
                    <button key={document.slug} type="button" className={documentDraft.slug === document.slug ? "is-active" : ""} onClick={() => setDocumentDraft(document)}>
                      <span>{document.title}</span><small>{document.published ? "Опубликован" : "Скрыт"}</small>
                    </button>
                  ))}
                </nav>
                <div className="admin-document-editor">
                  <label><span>Название</span><input value={documentDraft.title} onChange={(event) => setDocumentDraft({ ...documentDraft, title: event.target.value })} /></label>
                  <label><span>Краткое описание</span><input value={documentDraft.summary} onChange={(event) => setDocumentDraft({ ...documentDraft, summary: event.target.value })} /></label>
                  <label><span>Текст документа</span><textarea rows={24} value={documentDraft.body} onChange={(event) => setDocumentDraft({ ...documentDraft, body: event.target.value })} /></label>
                  <div className="admin-document-actions">
                    <label className="admin-inline-check"><input type="checkbox" checked={documentDraft.published} onChange={(event) => setDocumentDraft({ ...documentDraft, published: event.target.checked })} /><span><Check size={13} /></span> Показывать на сайте</label>
                    <button className="pill pill-dark" type="button" onClick={persistDocument} disabled={savingDocument}><Save size={16} /> {savingDocument ? "Сохраняем…" : "Сохранить документ"}</button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "orders" && <RecordsPanel title="Заказы" eyebrow="Заявки из корзины" empty="Оформленных заказов пока нет" icon={ShoppingBag}>{orders.map((order) => <OrderCard key={order.id} order={order} onStatus={updateOrder} />)}</RecordsPanel>}
          {activeTab === "custom" && <RecordsPanel title="Индивидуальные заявки" eyebrow="Работа на заказ" empty="Индивидуальных заявок пока нет" icon={Sparkles}>{requests.map((request) => <CustomCard key={request.id} request={request} onStatus={updateRequest} />)}</RecordsPanel>}
          {activeTab === "messages" && <RecordsPanel title="Сообщения" eyebrow="Обратная связь" empty="Сообщений пока нет" icon={MessageSquare} twoColumns>{messages.map((message) => <MessageCard key={message.id} message={message} />)}</RecordsPanel>}
        </>
      )}

      {editingProduct && <ProductEditor product={editingProduct} saving={savingProduct} onClose={() => setEditingProduct(null)} onSave={persistProduct} />}
    </div>
  );
}

function AdminLogin({ email, password, error, loading, onEmail, onPassword, onSubmit }: { email: string; password: string; error: string; loading: boolean; onEmail: (value: string) => void; onPassword: (value: string) => void; onSubmit: (event: FormEvent) => void }) {
  return (
    <div className="inner-page admin-gate">
      <form className="admin-login" onSubmit={onSubmit}>
        <div className="admin-login-mark"><LogIn size={26} /></div>
        <p className="eyebrow">Закрытый раздел</p>
        <h1>Вход в управление</h1>
        <p>Используйте учётную запись владельца Litops Atelier.</p>
        <label><span>Логин</span><input type="email" value={email} onChange={(event) => onEmail(event.target.value)} autoComplete="username" required /></label>
        <label><span>Пароль</span><input type="password" value={password} onChange={(event) => onPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <button className="pill pill-dark" type="submit" disabled={loading}>{loading ? "Проверяем…" : "Войти"} <LogIn size={16} /></button>
      </form>
    </div>
  );
}

function AdminSetupNotice() {
  return (
    <div className="inner-page admin-gate">
      <div className="admin-gate-card">
        <Settings2 size={34} strokeWidth={1.2} />
        <p className="eyebrow">Первичная настройка</p>
        <h1>Хранилище ещё не подключено</h1>
        <p>Интерфейс и защита готовы. Добавьте адрес проекта и публичный ключ хранилища в настройки сборки, затем создайте первую учётную запись администратора.</p>
      </div>
    </div>
  );
}

function AdminStatus({ text, compact = false }: { text: string; compact?: boolean }) {
  return <div className={`${compact ? "admin-status is-compact" : "inner-page admin-status"}`} role="status"><span className="admin-spinner" /><p>{text}</p></div>;
}

function RecordsPanel({ title, eyebrow, empty, icon: Icon, twoColumns, children }: { title: string; eyebrow: string; empty: string; icon: typeof Settings2; twoColumns?: boolean; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section className="admin-panel"><div className="admin-panel-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{hasChildren ? <div className={`record-list ${twoColumns ? "record-list-two" : ""}`}>{children}</div> : <div className="admin-empty"><Icon size={30} strokeWidth={1.2} /><p>{empty}</p></div>}</section>;
}

function OrderCard({ order, onStatus }: { order: OrderRecord; onStatus: (id: string, status: OrderRecord["status"]) => void }) {
  return <article className="record-card"><div className="record-card-head"><div><span>{order.id}</span><h3>{order.customer.name}</h3><p>{new Date(order.createdAt).toLocaleString("ru-RU")}</p></div><select value={order.status} onChange={(event) => onStatus(order.id, event.target.value as OrderRecord["status"])}><option>Новый</option><option>Подтверждён</option><option>В работе</option><option>Завершён</option></select></div><dl><div><dt>Контакт</dt><dd>{order.customer.phone}<br />{order.customer.contactMethod}</dd></div><div><dt>Доставка</dt><dd>{order.delivery.city}, {order.delivery.address}<br />{order.delivery.method}</dd></div><div><dt>Состав</dt><dd>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</dd></div><div><dt>Сумма</dt><dd>{rub(order.total)}</dd></div></dl></article>;
}

function CustomCard({ request, onStatus }: { request: CustomRequestRecord; onStatus: (id: string, status: CustomRequestRecord["status"]) => void }) {
  return <article className="record-card"><div className="record-card-head"><div><span>{request.id}</span><h3>{request.name}</h3><p>{new Date(request.createdAt).toLocaleString("ru-RU")}</p></div><select value={request.status} onChange={(event) => onStatus(request.id, event.target.value as CustomRequestRecord["status"])}><option>Новая</option><option>В работе</option><option>Выполнена</option><option>Отменена</option></select></div><dl><div><dt>Изделие</dt><dd>{request.jewelryType}<br />{request.stone}</dd></div><div><dt>Параметры</dt><dd>{request.size}, {request.tone}<br />{request.material}</dd></div><div><dt>Бюджет</dt><dd>{request.budget}</dd></div><div><dt>Контакт</dt><dd>{request.phone}<br />{request.contactMethod}</dd></div></dl><p className="record-description">{request.idea}</p></article>;
}

function MessageCard({ message }: { message: ContactMessageRecord }) {
  return <article className="record-card"><div className="record-card-head"><div><span>{message.id}</span><h3>{message.subject}</h3><p>{new Date(message.createdAt).toLocaleString("ru-RU")}</p></div></div><p className="record-description">{message.message}</p><div className="message-contact"><strong>{message.name}</strong><span>{message.phone}</span>{message.email && <span>{message.email}</span>}</div></article>;
}
