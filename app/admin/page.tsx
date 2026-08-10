"use client";

import {
  ArchiveRestore,
  Check,
  Download,
  FileUp,
  MessageSquare,
  Package,
  Settings2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { withBasePath } from "../lib/paths";
import { rub, type Product } from "../lib/products";
import {
  readLocal,
  writeLocal,
  type ContactMessageRecord,
  type CustomRequestRecord,
  type OrderRecord,
} from "../lib/storage";
import { useShop } from "../shop";

const tabs = [
  ["products", "Товары", Package],
  ["orders", "Заказы", ShoppingBag],
  ["custom", "Индивидуальные", Sparkles],
  ["messages", "Сообщения", MessageSquare],
] as const;

export default function AdminPage() {
  const { products, setProducts, resetProducts, showToast } = useShop();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("products");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [requests, setRequests] = useState<CustomRequestRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrders(readLocal("litops-orders-v1", []));
    setRequests(readLocal("litops-custom-requests-v1", []));
    setMessages(readLocal("litops-contact-messages-v1", []));
  }, []);

  const patchProduct = (id: string, patch: Partial<Product>) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, ...patch } : product)));
  };

  const updateOrderStatus = (id: string, status: OrderRecord["status"]) => {
    const next = orders.map((order) => (order.id === id ? { ...order, status } : order));
    setOrders(next);
    writeLocal("litops-orders-v1", next);
  };

  const updateRequestStatus = (
    id: string,
    status: CustomRequestRecord["status"],
  ) => {
    const next = requests.map((request) =>
      request.id === id ? { ...request, status } : request,
    );
    setRequests(next);
    writeLocal("litops-custom-requests-v1", next);
  };

  const exportData = () => {
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), products, orders, requests, messages },
      null,
      2,
    );
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
      const data = JSON.parse(await file.text()) as {
        products?: Product[];
        orders?: OrderRecord[];
        requests?: CustomRequestRecord[];
        messages?: ContactMessageRecord[];
      };
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        writeLocal("litops-orders-v1", data.orders);
      }
      if (Array.isArray(data.requests)) {
        setRequests(data.requests);
        writeLocal("litops-custom-requests-v1", data.requests);
      }
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
        writeLocal("litops-contact-messages-v1", data.messages);
      }
      showToast("Данные импортированы");
    } catch {
      showToast("Файл не удалось прочитать");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <div className="inner-page admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Управление Litops Atelier</p>
          <h1>Панель магазина</h1>
          <p>
            Данные этой демонстрационной панели хранятся только в текущем
            браузере. Экспортируйте резервную копию перед сменой устройства.
          </p>
        </div>
        <div className="admin-actions">
          <button className="pill pill-outline" type="button" onClick={exportData}>
            <Download size={16} /> Экспорт JSON
          </button>
          <button className="pill pill-dark" type="button" onClick={() => importRef.current?.click()}>
            <FileUp size={16} /> Импорт
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => importData(event.target.files?.[0])}
          />
        </div>
      </header>

      <div className="admin-stats">
        <article>
          <Package size={19} />
          <span>Товаров</span>
          <strong>{products.length}</strong>
        </article>
        <article>
          <ShoppingBag size={19} />
          <span>Новых заказов</span>
          <strong>{orders.filter((order) => order.status === "Новый").length}</strong>
        </article>
        <article>
          <Sparkles size={19} />
          <span>Индивидуальных заявок</span>
          <strong>{requests.length}</strong>
        </article>
        <article>
          <MessageSquare size={19} />
          <span>Сообщений</span>
          <strong>{messages.length}</strong>
        </article>
      </div>

      <div className="admin-tabs" role="tablist">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? "is-active" : ""}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Каталог</p>
              <h2>Цены и остатки</h2>
            </div>
            <button className="text-button" type="button" onClick={resetProducts}>
              <ArchiveRestore size={16} /> Восстановить каталог
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Изделие</th>
                  <th>Цена</th>
                  <th>Старая цена</th>
                  <th>Остаток</th>
                  <th>Популярное</th>
                  <th>Новинка</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-cell">
                        <img src={withBasePath(product.images[0])} alt="" />
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.stone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={product.price}
                        onChange={(event) => patchProduct(product.id, { price: Number(event.target.value) })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={product.oldPrice ?? ""}
                        placeholder="—"
                        onChange={(event) =>
                          patchProduct(product.id, {
                            oldPrice: event.target.value ? Number(event.target.value) : undefined,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={(event) => patchProduct(product.id, { stock: Number(event.target.value) })}
                      />
                    </td>
                    <td>
                      <label className="admin-check">
                        <input
                          type="checkbox"
                          checked={Boolean(product.isPopular)}
                          onChange={(event) => patchProduct(product.id, { isPopular: event.target.checked })}
                        />
                        <span><Check size={13} /></span>
                      </label>
                    </td>
                    <td>
                      <label className="admin-check">
                        <input
                          type="checkbox"
                          checked={Boolean(product.isNew)}
                          onChange={(event) => patchProduct(product.id, { isNew: event.target.checked })}
                        />
                        <span><Check size={13} /></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Заявки из корзины</p>
              <h2>Заказы</h2>
            </div>
          </div>
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} text="Оформленных заказов пока нет" />
          ) : (
            <div className="record-list">
              {orders.map((order) => (
                <article className="record-card" key={order.id}>
                  <div className="record-card-head">
                    <div>
                      <span>{order.id}</span>
                      <h3>{order.customer.name}</h3>
                      <p>{new Date(order.createdAt).toLocaleString("ru-RU")}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value as OrderRecord["status"])
                      }
                    >
                      <option>Новый</option>
                      <option>Подтверждён</option>
                      <option>В работе</option>
                      <option>Завершён</option>
                    </select>
                  </div>
                  <dl>
                    <div><dt>Контакт</dt><dd>{order.customer.phone}<br />{order.customer.contactMethod}</dd></div>
                    <div><dt>Доставка</dt><dd>{order.delivery.city}, {order.delivery.address}<br />{order.delivery.method}</dd></div>
                    <div><dt>Состав</dt><dd>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(", ")}</dd></div>
                    <div><dt>Сумма</dt><dd>{rub(order.total)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "custom" && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Работа на заказ</p>
              <h2>Индивидуальные заявки</h2>
            </div>
          </div>
          {requests.length === 0 ? (
            <EmptyState icon={Sparkles} text="Индивидуальных заявок пока нет" />
          ) : (
            <div className="record-list">
              {requests.map((request) => (
                <article className="record-card" key={request.id}>
                  <div className="record-card-head">
                    <div>
                      <span>{request.id}</span>
                      <h3>{request.name}</h3>
                      <p>{new Date(request.createdAt).toLocaleString("ru-RU")}</p>
                    </div>
                    <select
                      value={request.status}
                      onChange={(event) =>
                        updateRequestStatus(
                          request.id,
                          event.target.value as CustomRequestRecord["status"],
                        )
                      }
                    >
                      <option>Новая</option>
                      <option>В работе</option>
                      <option>Выполнена</option>
                      <option>Отменена</option>
                    </select>
                  </div>
                  <dl>
                    <div><dt>Изделие</dt><dd>{request.jewelryType}<br />{request.stone}</dd></div>
                    <div><dt>Параметры</dt><dd>{request.size}, {request.tone}<br />{request.material}</dd></div>
                    <div><dt>Бюджет</dt><dd>{request.budget}</dd></div>
                    <div><dt>Контакт</dt><dd>{request.phone}<br />{request.contactMethod}</dd></div>
                  </dl>
                  <p className="record-description">{request.idea}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "messages" && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <p className="eyebrow">Обратная связь</p>
              <h2>Сообщения</h2>
            </div>
          </div>
          {messages.length === 0 ? (
            <EmptyState icon={MessageSquare} text="Сообщений пока нет" />
          ) : (
            <div className="record-list record-list-two">
              {messages.map((message) => (
                <article className="record-card" key={message.id}>
                  <div className="record-card-head">
                    <div>
                      <span>{message.id}</span>
                      <h3>{message.subject}</h3>
                      <p>{new Date(message.createdAt).toLocaleString("ru-RU")}</p>
                    </div>
                  </div>
                  <p className="record-description">{message.message}</p>
                  <div className="message-contact">
                    <strong>{message.name}</strong>
                    <span>{message.phone}</span>
                    {message.email && <span>{message.email}</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof Settings2;
  text: string;
}) {
  return (
    <div className="admin-empty">
      <Icon size={30} strokeWidth={1.2} />
      <p>{text}</p>
    </div>
  );
}
