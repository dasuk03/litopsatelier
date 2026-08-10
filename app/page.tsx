"use client";

import {
  ArrowDown,
  ArrowRight,
  Gem,
  Hand,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { withBasePath } from "./lib/paths";
import { ProductCard } from "./product-card";
import { useShop } from "./shop";

const homeFilters = ["Все", "Браслеты", "Парные", "Минимализм"] as const;

const materials = [
  {
    name: "Ларимар",
    note: "Мягкий оттенок Карибского моря",
    text: "Небесно-голубые бусины с молочными облаками и неповторимым природным рисунком. Для одной нити подбираем камни близкой глубины тона.",
    origin: "Доминиканская Республика",
    hardness: "4.5–5",
    image: "/images/bracelet-larimar.webp",
  },
  {
    name: "Лабрадорит",
    note: "Северное сияние внутри камня",
    text: "Сдержанная серая основа оживает синими, бирюзовыми и золотистыми вспышками. Перелив меняется вместе с углом света и движением руки.",
    origin: "Канада · Мадагаскар",
    hardness: "6–6.5",
    image: "/images/bracelet-labradorite.webp",
  },
  {
    name: "Чароит",
    note: "Живой фиолетовый рисунок",
    text: "Волокнистая структура создаёт сиреневые завихрения и мягкий шелковистый блеск. Двух одинаковых бусин чароита не бывает.",
    origin: "Якутия, Россия",
    hardness: "5–6",
    image: "/images/bracelet-charoite.webp",
  },
] as const;

const faqs = [
  [
    "Как определить размер?",
    "Измерьте запястье сантиметровой лентой без запаса. Для свободной посадки мы добавим 0,5–1 см при сборке.",
  ],
  [
    "Камни действительно натуральные?",
    "Да. Мы работаем с природными минералами, поэтому оттенок, рисунок и прозрачность каждой бусины могут немного отличаться.",
  ],
  [
    "Можно изменить готовую модель?",
    "Да. Можно скорректировать размер, заменить фурнитуру или собрать близкое сочетание в другой палитре.",
  ],
  [
    "Как упакован заказ?",
    "Браслет приходит в мягком мешочке и фирменной коробке, готовой для подарка.",
  ],
] as const;

export default function Home() {
  const { products, productsLoading } = useShop();
  const [activeFilter, setActiveFilter] = useState<(typeof homeFilters)[number]>("Все");
  const [activeMaterial, setActiveMaterial] = useState(0);
  const [wristSize, setWristSize] = useState("17 см");
  const [palette, setPalette] = useState("Графит");
  const [metal, setMetal] = useState("Нержавеющая сталь");
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const story = document.querySelector<HTMLElement>("[data-story]");
      if (story) {
        const rect = story.getBoundingClientRect();
        const range = Math.max(1, story.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / range));
        document.documentElement.style.setProperty("--story-progress", `${progress}`);
        document.documentElement.style.setProperty(
          "--story-radius",
          `${12 + progress * 96}%`,
        );
      }
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
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shownProducts = useMemo(() => {
    const list =
      activeFilter === "Все"
        ? products
        : activeFilter === "Парные"
          ? products.filter((product) => product.category === "Парные браслеты")
          : products.filter((product) => product.category === activeFilter);
    return list.slice(0, 6);
  }, [activeFilter, products]);

  const customHref = `/custom?size=${encodeURIComponent(wristSize)}&tone=${encodeURIComponent(palette)}&material=${encodeURIComponent(metal)}`;

  return (
    <>
      <section className="hero" id="top">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-orbits" aria-hidden="true">
          <i />
          <i />
        </div>
        <div className="hero-content">
          <p className="eyebrow">Натуральные камни · Ручная работа</p>
          <h1>
            Украшения,
            <br />
            <em>созданные природой</em>
          </h1>
          <p className="hero-copy">
            Собираем браслеты вручную — внимательно к оттенку каждого камня,
            тактильности и вашему личному ритму.
          </p>
          <div className="hero-actions">
            <Link className="pill pill-light" href="/catalog">
              Открыть каталог <ArrowRight size={17} strokeWidth={1.6} />
            </Link>
            <a className="hero-text-link" href="#story">
              Узнать о мастерской <ArrowDown size={15} />
            </a>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true">
          <span>01</span>
          <i />
          <span>25</span>
        </div>
      </section>

      <section className="ticker" aria-label="Преимущества">
        <div className="ticker-track">
          {[0, 1].map((loop) => (
            <div className="ticker-group" key={loop} aria-hidden={loop === 1}>
              {[
                "Натуральные материалы",
                "Собрано вручную",
                "Подарочная упаковка",
                "Доставка по России",
                "Подгонка по размеру",
              ].map((item) => (
                <span className="ticker-item" key={item}>
                  <b>{item}</b>
                  <Sparkles size={17} strokeWidth={1.2} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="collection shell" id="collection">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">Коллекция 2026</p>
            <h2>Найти свой камень</h2>
          </div>
          <p>
            Выверенные сочетания природных фактур — от воздушного ларимара до
            глубоких переливов лабрадорита и чароита.
          </p>
        </div>
        <div className="catalog-toolbar" data-reveal>
          <div className="filters" role="group" aria-label="Фильтр каталога">
            {homeFilters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={activeFilter === filter ? "is-active" : ""}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
              </button>
            ))}
          </div>
          <span>{shownProducts.length} моделей</span>
        </div>
        <div className="product-grid" aria-live="polite" aria-busy={productsLoading}>
          {shownProducts.map((product, index) => (
            <ProductCard product={product} index={index} key={product.id} />
          ))}
        </div>
        {!productsLoading && shownProducts.length === 0 && (
          <div className="collection-empty" role="status">
            <p>В этой категории пока нет опубликованных моделей.</p>
            <Link href="/catalog">Открыть весь каталог</Link>
          </div>
        )}
        <div className="collection-foot" data-reveal>
          <p>Каждый браслет можно собрать в вашем размере.</p>
          <Link href="/catalog">
            Смотреть весь каталог <ArrowRight size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      <section className="story-scene" id="story" data-story>
        <div className="story-sticky">
          <div className="story-intro" aria-hidden="true">
            <span>Не повторить дважды</span>
            <span>Не спутать с другим</span>
          </div>
          <h2 className="story-title">
            У каждого камня
            <br />
            <em>свой характер</em>
          </h2>
          <div className="story-aperture" aria-hidden="true">
            <img src={withBasePath("/images/bracelet-labradorite.webp")} alt="" />
          </div>
          <div className="story-finale">
            <p className="eyebrow">Философия Litops</p>
            <h3>Мы не прячем природную неповторимость.</h3>
            <p>
              Небольшая прожилка, облако внутри кварца или разница в оттенке —
              не дефект, а подпись природы. Ручная сборка помогает ей прозвучать
              точнее.
            </p>
          </div>
          <div className="story-meter" aria-hidden="true">
            <span>0</span>
            <i />
            <span>100</span>
          </div>
        </div>
      </section>

      <section className="materials shell" id="materials">
        <div className="materials-head" data-reveal>
          <p className="eyebrow">Материалы</p>
          <h2>
            Природа —
            <br />
            <em>главный автор</em>
          </h2>
          <p>
            Тактильность, рисунок и свет минерала важнее трендов. Каждый камень
            мы рассматриваем вживую до начала сборки.
          </p>
        </div>
        <div className="material-stage" data-reveal>
          <div className="material-tabs" role="tablist" aria-label="Натуральные камни">
            {materials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={activeMaterial === index}
                className={activeMaterial === index ? "is-active" : ""}
                onClick={() => setActiveMaterial(index)}
              >
                <span>0{index + 1}</span>
                <b>{item.name}</b>
                <ArrowRight size={19} strokeWidth={1.3} />
              </button>
            ))}
          </div>
          <div className="material-image" key={materials[activeMaterial].name}>
            <img
              src={withBasePath(materials[activeMaterial].image)}
              alt={materials[activeMaterial].name}
            />
            <span>Натуральный камень</span>
          </div>
          <article className="material-copy" key={`${materials[activeMaterial].name}-copy`}>
            <p className="eyebrow">{materials[activeMaterial].note}</p>
            <h3>{materials[activeMaterial].name}</h3>
            <p>{materials[activeMaterial].text}</p>
            <dl>
              <div>
                <dt>Происхождение</dt>
                <dd>{materials[activeMaterial].origin}</dd>
              </div>
              <div>
                <dt>Твёрдость по Моосу</dt>
                <dd>{materials[activeMaterial].hardness}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className="craft shell">
        <div className="craft-heading" data-reveal>
          <p className="eyebrow">Сделано внимательно</p>
          <h2>
            От россыпи камней
            <br />до личного украшения
          </h2>
        </div>
        <div className="craft-grid">
          {[
            {
              Icon: Gem,
              number: "01",
              title: "Подбор",
              text: "Сверяем оттенок, размер и рисунок каждой бусины, чтобы браслет звучал цельно.",
            },
            {
              Icon: Hand,
              number: "02",
              title: "Ручная сборка",
              text: "Собираем без поточной спешки и проверяем ритм камней с нескольких ракурсов.",
            },
            {
              Icon: Ruler,
              number: "03",
              title: "Точная посадка",
              text: "Подгоняем длину под запястье, сохраняя задуманный рисунок и комфорт.",
            },
            {
              Icon: ShieldCheck,
              number: "04",
              title: "Контроль",
              text: "Проверяем соединения, очищаем камни и упаковываем изделие вручную.",
            },
          ].map(({ Icon, number, title, text }, index) => (
            <article
              className="craft-card"
              data-reveal
              style={{ "--delay": `${index * 80}ms` } as CSSProperties}
              key={title}
            >
              <div>
                <Icon size={23} strokeWidth={1.2} />
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="individual" id="individual">
        <div className="individual-copy" data-reveal>
          <p className="eyebrow">Только ваш</p>
          <h2>
            Соберите
            <br />
            <em>личное сочетание</em>
          </h2>
          <p>
            Выберите основу будущего браслета. Затем мастер уточнит камни,
            посадку и финальные детали.
          </p>
          <div className="individual-note">
            <span>01</span>
            <p>
              Каждая индивидуальная работа начинается с короткого диалога, а
              не с готового шаблона.
            </p>
          </div>
        </div>
        <div className="configurator" data-reveal>
          <div className="config-step">
            <div className="config-label">
              <span>01</span>
              <h3>Размер запястья</h3>
            </div>
            <div className="choice-row">
              {["15 см", "16 см", "17 см", "18 см", "19 см", "20 см"].map((size) => (
                <button
                  type="button"
                  key={size}
                  className={wristSize === size ? "is-active" : ""}
                  onClick={() => setWristSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="config-step">
            <div className="config-label">
              <span>02</span>
              <h3>Палитра</h3>
            </div>
            <div className="choice-row palette-row">
              {["Графит", "Молочный", "Земля", "Смешанный"].map((tone) => (
                <button
                  type="button"
                  key={tone}
                  className={palette === tone ? "is-active" : ""}
                  onClick={() => setPalette(tone)}
                >
                  <i data-tone={tone} />
                  {tone}
                </button>
              ))}
            </div>
          </div>
          <div className="config-step">
            <div className="config-label">
              <span>03</span>
              <h3>Фурнитура</h3>
            </div>
            <div className="choice-row">
              {["Нержавеющая сталь", "Позолоченная сталь", "Без металла"].map((choice) => (
                <button
                  type="button"
                  key={choice}
                  className={metal === choice ? "is-active" : ""}
                  onClick={() => setMetal(choice)}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          <div className="config-total">
            <div>
              <span>Индивидуальная сборка</span>
              <strong>от 5 900 ₽</strong>
            </div>
            <Link className="pill pill-light" href={customHref}>
              Продолжить заявку <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="voices shell" id="faq">
        <div className="voice-feature" data-reveal>
          <p className="eyebrow">Отзывы</p>
          <blockquote>
            «Вживую камни оказались ещё глубже, чем на фото. Браслет ощущается
            очень личным — будто собирали именно для меня».
          </blockquote>
          <footer>
            <span>Анна, Москва</span>
            <span>Браслет Larimar</span>
          </footer>
        </div>
        <div className="faq" data-reveal>
          <p className="eyebrow">Частые вопросы</p>
          {faqs.map(([question, answer], index) => (
            <article className={openFaq === index ? "is-open" : ""} key={question}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                aria-expanded={openFaq === index}
              >
                <span>{question}</span>
                <ArrowDown size={18} strokeWidth={1.4} />
              </button>
              <div>
                <p>{answer}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
