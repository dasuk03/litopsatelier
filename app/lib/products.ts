export type ProductCategory =
  | "Браслеты"
  | "Парные браслеты"
  | "Минимализм"
  | "Подарочные наборы";

export type ProductMaterial =
  | "Нержавеющая сталь"
  | "Чёрная нержавеющая сталь"
  | "Позолоченная нержавеющая сталь"
  | "Без металла";

export type Product = {
  id: string;
  name: string;
  stone: string;
  category: ProductCategory;
  collection: string;
  material: ProductMaterial;
  colors: string[];
  sizes: number[];
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  isPopular?: boolean;
  isNew?: boolean;
  clasp: boolean;
  stoneOrigin: string;
  madeIn: string;
  description: string;
  shortDescription: string;
  images: string[];
  package: string[];
  care: string[];
  tags: string[];
};

export type CartItem = {
  key: string;
  productId: string;
  material: ProductMaterial;
  size: number;
  quantity: number;
};

const sizes = [15, 16, 17, 18, 19, 20, 21];
const packageBase = [
  "Браслет",
  "Фирменная бирка",
  "Мешочек для хранения",
  "Подарочная упаковка",
];
const care = [
  "Снимайте изделие перед душем, бассейном и тренировкой.",
  "Храните отдельно от других украшений.",
  "Протирайте камни сухой мягкой салфеткой.",
];

export const defaultProducts: Product[] = [
  {
    id: "larimar-sky",
    name: "Ларимар Sky",
    stone: "Ларимар",
    category: "Браслеты",
    collection: "Океан",
    material: "Нержавеющая сталь",
    colors: ["голубой", "белый"],
    sizes,
    price: 6290,
    oldPrice: 6990,
    rating: 5,
    reviews: 95,
    stock: 6,
    isPopular: true,
    clasp: true,
    stoneOrigin: "Доминиканская Республика",
    madeIn: "Россия",
    description:
      "Небесно-голубой ларимар с естественным облачным рисунком. Холодный блеск стали подчёркивает чистый оттенок камня, не споря с его природной фактурой.",
    shortDescription: "Ларимар с рисунком морской волны и холодной сталью.",
    images: [
      "/images/bracelet-larimar.webp",
      "/images/products/larimar.webp",
      "/images/bracelet-labradorite.webp",
    ],
    package: packageBase,
    care,
    tags: ["светлые", "лето", "подарок", "редкий камень"],
  },
  {
    id: "labrador-night",
    name: "Лабрадор Night",
    stone: "Лабрадорит",
    category: "Браслеты",
    collection: "Ночь",
    material: "Чёрная нержавеющая сталь",
    colors: ["графитовый", "синий", "зелёный"],
    sizes: [16, 17, 18, 19, 20, 21, 22],
    price: 6790,
    oldPrice: 7490,
    rating: 4.9,
    reviews: 138,
    stock: 10,
    isPopular: true,
    clasp: true,
    stoneOrigin: "Мадагаскар",
    madeIn: "Россия",
    description:
      "Тёмный лабрадорит с синими и зелёными вспышками. Графитовая фурнитура делает модель собранной, выразительной и универсальной.",
    shortDescription: "Тёмный лабрадорит с глубокими синими переливами.",
    images: [
      "/images/bracelet-labradorite.webp",
      "/images/products/labradorite.webp",
      "/images/bracelet-charoite.webp",
    ],
    package: packageBase,
    care,
    tags: ["тёмные", "бестселлер", "унисекс"],
  },
  {
    id: "charoite-violet",
    name: "Чароит Violet",
    stone: "Чароит",
    category: "Браслеты",
    collection: "Сибирь",
    material: "Нержавеющая сталь",
    colors: ["фиолетовый", "серебристый"],
    sizes: [15, 16, 17, 18, 19, 20],
    price: 5990,
    rating: 4.9,
    reviews: 67,
    stock: 6,
    isPopular: true,
    clasp: false,
    stoneOrigin: "Якутия, Россия",
    madeIn: "Россия",
    description:
      "Насыщенный чароит с природной волокнистой текстурой и мягким шелковистым блеском. Каждый браслет получает уникальный рисунок сиреневых завихрений.",
    shortDescription: "Редкий российский чароит с живой текстурой.",
    images: [
      "/images/bracelet-charoite.webp",
      "/images/products/charoite.webp",
      "/images/bracelet-labradorite.webp",
    ],
    package: packageBase,
    care,
    tags: ["фиолетовые", "редкий камень", "российский камень"],
  },
  {
    id: "quartz-golden-thread",
    name: "Кварц Golden Thread",
    stone: "Рутиловый кварц",
    category: "Браслеты",
    collection: "Золотая нить",
    material: "Позолоченная нержавеющая сталь",
    colors: ["золотистый", "прозрачный"],
    sizes: [16, 17, 18, 19, 20, 21],
    price: 5190,
    oldPrice: 5690,
    rating: 4.9,
    reviews: 74,
    stock: 7,
    isPopular: true,
    clasp: false,
    stoneOrigin: "Бразилия",
    madeIn: "Россия",
    description:
      "Прозрачный кварц с естественными золотистыми иглами рутила. Внутренний рисунок каждого камня невозможно повторить.",
    shortDescription: "Прозрачный кварц с золотистыми включениями.",
    images: [
      "/images/bracelet-rutilated-quartz.jpeg",
      "/images/products/rutilated-quartz.webp",
      "/images/bracelet-tourmaline.jpeg",
    ],
    package: packageBase,
    care,
    tags: ["золотистые", "редкий камень", "подарок"],
  },
  {
    id: "tourmaline-spectrum",
    name: "Турмалин Spectrum",
    stone: "Турмалин",
    category: "Браслеты",
    collection: "Спектр",
    material: "Нержавеющая сталь",
    colors: ["мультиколор", "розовый", "зелёный"],
    sizes: [15, 16, 17, 18, 19, 20],
    price: 4990,
    rating: 4.9,
    reviews: 112,
    stock: 12,
    isNew: true,
    clasp: true,
    stoneOrigin: "Бразилия",
    madeIn: "Россия",
    description:
      "Разноцветный турмалин собран в спокойную, но выразительную палитру. Последовательность оттенков у каждого экземпляра своя.",
    shortDescription: "Живой мультиколор из натурального турмалина.",
    images: [
      "/images/bracelet-tourmaline.jpeg",
      "/images/products/tourmaline.webp",
      "/images/bracelet-rutilated-quartz.jpeg",
    ],
    package: packageBase,
    care,
    tags: ["яркие", "новинка", "подарок"],
  },
  {
    id: "fluorite-forest",
    name: "Флюорит Forest",
    stone: "Зелёный флюорит",
    category: "Минимализм",
    collection: "Лес",
    material: "Нержавеющая сталь",
    colors: ["зелёный", "прозрачный"],
    sizes,
    price: 4590,
    rating: 4.8,
    reviews: 46,
    stock: 8,
    isNew: true,
    clasp: false,
    stoneOrigin: "Монголия",
    madeIn: "Россия",
    description:
      "Полупрозрачный флюорит в оттенках хвои и мха. Лаконичная сборка сохраняет акцент на глубине природного цвета.",
    shortDescription: "Прозрачный зелёный флюорит в спокойной сборке.",
    images: [
      "/images/bracelet-green-fluorite.jpeg",
      "/images/products/prehnite.webp",
      "/images/bracelet-larimar.webp",
    ],
    package: packageBase,
    care,
    tags: ["зелёные", "минимализм", "унисекс"],
  },
  {
    id: "prehnite-air",
    name: "Пренит Air",
    stone: "Пренит",
    category: "Минимализм",
    collection: "Свет",
    material: "Нержавеющая сталь",
    colors: ["зелёный", "прозрачный"],
    sizes,
    price: 5490,
    oldPrice: 6290,
    rating: 4.9,
    reviews: 86,
    stock: 8,
    isPopular: true,
    clasp: true,
    stoneOrigin: "ЮАР",
    madeIn: "Россия",
    description:
      "Воздушный браслет из полупрозрачного пренита с мягким фисташковым оттенком и минималистичной стальной застёжкой.",
    shortDescription: "Полупрозрачный пренит и чистая стальная фурнитура.",
    images: [
      "/images/products/prehnite.webp",
      "/images/bracelet-green-fluorite.jpeg",
      "/images/bracelet-larimar.webp",
    ],
    package: packageBase,
    care,
    tags: ["светлые", "подарок", "минимализм"],
  },
  {
    id: "onyx-graphite",
    name: "Оникс Graphite",
    stone: "Оникс",
    category: "Браслеты",
    collection: "Графит",
    material: "Чёрная нержавеющая сталь",
    colors: ["чёрный", "графитовый"],
    sizes: [17, 18, 19, 20, 21, 22],
    price: 5190,
    rating: 4.8,
    reviews: 81,
    stock: 11,
    clasp: true,
    stoneOrigin: "Бразилия",
    madeIn: "Россия",
    description:
      "Монохромный браслет из чёрного оникса с графитовой стальной фурнитурой. Строгая модель для ежедневной носки.",
    shortDescription: "Монохромный оникс и графитовая сталь.",
    images: [
      "/images/product-onyx.webp",
      "/images/bracelet-labradorite.webp",
      "/images/products/labradorite.webp",
    ],
    package: packageBase,
    care,
    tags: ["чёрные", "мужские", "минимализм"],
  },
  {
    id: "moonstone-mist",
    name: "Лунный камень Mist",
    stone: "Лунный камень",
    category: "Минимализм",
    collection: "Свет",
    material: "Нержавеющая сталь",
    colors: ["белый", "голубой"],
    sizes: [15, 16, 17, 18, 19, 20],
    price: 5790,
    rating: 4.7,
    reviews: 39,
    stock: 5,
    isNew: true,
    clasp: false,
    stoneOrigin: "Индия",
    madeIn: "Россия",
    description:
      "Светлый браслет с мягким голубым свечением и компактными стальными вставками. Лёгкий вариант для многослойных сочетаний.",
    shortDescription: "Светлый камень с мягким голубым свечением.",
    images: [
      "/images/product-moonstone.webp",
      "/images/bracelet-larimar.webp",
      "/images/products/prehnite.webp",
    ],
    package: packageBase,
    care,
    tags: ["светлые", "минимализм", "новинка"],
  },
  {
    id: "ocean-pair",
    name: "Ocean Pair",
    stone: "Ларимар и лабрадорит",
    category: "Парные браслеты",
    collection: "Вместе",
    material: "Нержавеющая сталь",
    colors: ["голубой", "графитовый"],
    sizes: [16, 17, 18, 19, 20, 21, 22],
    price: 10490,
    rating: 4.9,
    reviews: 28,
    stock: 3,
    isNew: true,
    clasp: true,
    stoneOrigin: "Доминиканская Республика и Мадагаскар",
    madeIn: "Россия",
    description:
      "Парный комплект на контрасте светлого ларимара и глубокого лабрадорита. Размер каждого браслета подбирается отдельно.",
    shortDescription: "Два характера камня в одном парном комплекте.",
    images: [
      "/images/bracelet-larimar.webp",
      "/images/bracelet-labradorite.webp",
      "/images/products/larimar.webp",
    ],
    package: [...packageBase, "Два браслета"],
    care,
    tags: ["парные", "подарок", "голубые", "тёмные"],
  },
  {
    id: "earth-signature",
    name: "Earth Signature",
    stone: "Агат и рутиловый кварц",
    category: "Подарочные наборы",
    collection: "Земля",
    material: "Позолоченная нержавеющая сталь",
    colors: ["коричневый", "золотистый", "серый"],
    sizes: [16, 17, 18, 19, 20, 21],
    price: 8990,
    oldPrice: 9990,
    rating: 5,
    reviews: 18,
    stock: 2,
    isPopular: true,
    clasp: true,
    stoneOrigin: "Ботсвана и Бразилия",
    madeIn: "Россия",
    description:
      "Подарочный комплект в природной палитре с расширенной упаковкой и карточками о происхождении минералов.",
    shortDescription: "Тёплая природная палитра в подарочной упаковке.",
    images: [
      "/images/product-terra.webp",
      "/images/bracelet-rutilated-quartz.jpeg",
      "/images/products/rutilated-quartz.webp",
    ],
    package: [...packageBase, "Карточки о камнях", "Подарочная лента"],
    care,
    tags: ["подарочный набор", "земляные оттенки", "signature"],
  },
];

export const productCategories = [
  "Все",
  "Браслеты",
  "Парные браслеты",
  "Минимализм",
  "Подарочные наборы",
] as const;

export const productMaterials = [
  "Все",
  "Нержавеющая сталь",
  "Чёрная нержавеющая сталь",
  "Позолоченная нержавеющая сталь",
  "Без металла",
] as const;

export const productSizes = [15, 16, 17, 18, 19, 20, 21, 22];

export const rub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
