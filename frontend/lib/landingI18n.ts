import type { Language } from "@/lib/i18n";

export type LandingCopy = {
  hero: {
    group1: [string, string];
    group2: [string, string, string];
    descPrimary: string;
    descAccent: string;
    ctaExplore: string;
    ctaCreate: string;
    ctaCatalog: string;
  };
  problem: {
    eyebrow: string;
    title: string;
    titleLine2: string;
    body: string;
    cards: { title: string; description: string }[];
  };
  features: {
    eyebrow: string;
    title: string;
    items: { title: string; description: string }[];
  };
  gallery: { eyebrow: string; title: string };
  buyer: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    steps: { title: string; description: string }[];
  };
  seller: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    steps: { title: string; description: string }[];
  };
  dual: {
    eyebrow: string;
    title: string;
    titleLine2: string;
    buyerCaption: string;
    sellerCaption: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: { name: string; role: string; text: string }[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  cta: {
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
  };
  footer: {
    tagline: string;
    buyersTitle: string;
    sellersTitle: string;
    companyTitle: string;
    links: {
      postRequest: string;
      browseCatalog: string;
      howItWorks: string;
      register: string;
      requestBoard: string;
      newListing: string;
      home: string;
      login: string;
    };
    copyright: string;
    educationalNote: string;
  };
  nav: {
    links: {
      home: string;
      problem: string;
      features: string;
      buyers: string;
      sellers: string;
      faq: string;
    };
    cta: string;
    login: string;
    signup: string;
    progress: Record<string, string>;
  };
};

const en: LandingCopy = {
  hero: {
    group1: ["WATCH SELLERS COMPETE", "POST YOUR NEEDS"],
    group2: ["DEMAND", "MEETS", "SUPPLY"],
    descPrimary: "The demand-first marketplace",
    descAccent: "where buyers post requests and sellers compete to fulfill them.",
    ctaExplore: "EXPLORE THE CONCEPT",
    ctaCreate: "Create a Request",
    ctaCatalog: "Browse Catalog",
  },
  problem: {
    eyebrow: "The Problem",
    title: "Traditional Marketplaces",
    titleLine2: "Force Guessing",
    body: "Sellers stock products hoping someone buys. Buyers scroll through hundreds of listings to find what they need. No negotiation, no transparency, no connection.",
    cards: [
      {
        title: "Sellers Stock Without Demand",
        description:
          "You invest in inventory, pay for storage, and pray the right buyer finds your listing.",
      },
      {
        title: "Buyers Search Endlessly",
        description:
          "Dozens of tabs, countless stores, and still no guarantee you found the best deal.",
      },
      {
        title: "No Negotiation Layer",
        description:
          "Fixed prices mean zero flexibility. You either accept or walk away — no conversation.",
      },
    ],
  },
  features: {
    eyebrow: "How It Works",
    title: "Three Ways to Trade",
    items: [
      {
        title: "Buy Now",
        description:
          "Browse catalog, add to cart, checkout instantly. Classic marketplace for ready-made products.",
      },
      {
        title: "Request & Receive",
        description:
          "Post what you need. Sellers see live demand and send competing offers directly to you.",
      },
      {
        title: "Negotiate & Deal",
        description:
          "Compare offers, chat with sellers, agree on terms — all inside one transparent platform.",
      },
    ],
  },
  gallery: {
    eyebrow: "Live Categories",
    title: "From Electronics to Services",
  },
  buyer: {
    eyebrow: "For Buyers",
    title: "How It Works For Buyers",
    body: "Don't search for products — describe your task and let sellers compete to win your business. Four simple steps to get exactly what you need.",
    cta: "Post a Request",
    steps: [
      {
        title: "Describe Your Request",
        description:
          "Choose a category, set your budget, specify quantity, and detail exactly what you need.",
      },
      {
        title: "Receive Seller Offers",
        description:
          "Sellers see your request in real-time and send competitive offers with their best prices and conditions.",
      },
      {
        title: "Choose & Chat",
        description:
          "Compare all offers side by side, pick the best one, and open a chat to clarify details and negotiate.",
      },
      {
        title: "Place Order & Track",
        description:
          "Confirm the deal, place your order, and track delivery status from processing to your doorstep.",
      },
    ],
  },
  seller: {
    eyebrow: "For Sellers",
    title: "How It Works For Sellers",
    body: "Sell what people already want, not what sits in your warehouse. See live demand and respond with your best offers.",
    cta: "Open Request Board",
    steps: [
      {
        title: "View Live Requests",
        description:
          "Browse buyer requests filtered by your category, location, and expertise. See demand as it happens.",
      },
      {
        title: "Send Competitive Offers",
        description:
          "Respond to requests with your best price, delivery terms, and any value-adds that set you apart.",
      },
      {
        title: "Negotiate in Chat",
        description:
          "When a buyer shows interest, chat opens for real-time negotiation — clarify specs, adjust pricing, close the deal.",
      },
      {
        title: "List Products in Catalog",
        description:
          'Add ready-made products with price and stock to your storefront for instant "buy now" purchases.',
      },
    ],
  },
  dual: {
    eyebrow: "Dual Account",
    title: "One Account.",
    titleLine2: "Two Modes.",
    buyerCaption: "Buyer Mode — Requests, Catalog, Cart, Orders, Chat",
    sellerCaption: "Seller Mode — Listings, Request Board, Offers, Analytics",
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "What Our Users Say",
    items: [
      {
        name: "Daniyar K.",
        role: "Buyer",
        text: "Mollmart is built around demand, not endless catalog browsing. I post what I need, sellers respond with offers, and everything stays in one place — from the request to chat and orders.",
      },
      {
        name: "Abdurahman S.",
        role: "Seller",
        text: "I open the request board, see live buyer demand, and respond with an offer or join a reverse auction. It feels like a marketplace that actually starts from the buyer's need.",
      },
      {
        name: "Yerlan S.",
        role: "Buyer & Seller",
        text: "One account with buyer and seller workspaces is the main idea for me. I can post a request, switch mode, and manage listings and offers without juggling separate accounts.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common Questions",
    items: [
      {
        q: "How is Mollmart different from Amazon or eBay?",
        a: "Traditional marketplaces are catalog-first — sellers list products and buyers search. Mollmart is demand-first — buyers post requests and sellers come to them. We also offer a catalog mode for instant purchases, giving you both worlds.",
      },
      {
        q: "Can I use Mollmart only as a buyer?",
        a: "Absolutely. Buyer mode is completely free. Post requests, receive offers, negotiate, and place orders — no subscription required.",
      },
      {
        q: "How does the pricing model work?",
        a: "Buyers use the platform for free. Sellers pay a small commission on completed deals. No listing fees, no monthly charges — you only pay when you make money.",
      },
      {
        q: "Are payments secure?",
        a: "We provide a secure deal flow with order tracking and payment status monitoring. All transactions are verified and recorded in your order history.",
      },
      {
        q: "What categories are supported?",
        a: "Electronics, Home & Garden, Fashion, Industrial Equipment, Services, Food & Beverage, Sports, Automotive, and more. New categories are added based on user demand.",
      },
      {
        q: "Is there a mobile app?",
        a: "Our platform is fully responsive and works great on mobile browsers. Native iOS and Android apps are coming in Q3 2026.",
      },
    ],
  },
  cta: {
    title: "Start With One Request or One Product",
    subtitle: "Join 4,000+ sellers and buyers already trading smarter.",
    primary: "Get Started Free",
    secondary: "Browse Catalog",
  },
  footer: {
    tagline: "The demand-first marketplace for modern businesses.",
    buyersTitle: "For Buyers",
    sellersTitle: "For Sellers",
    companyTitle: "Company",
    links: {
      postRequest: "Post a Request",
      browseCatalog: "Browse Catalog",
      howItWorks: "How It Works",
      register: "Register",
      requestBoard: "View Request Board",
      newListing: "New Listing",
      home: "Home",
      login: "Login",
    },
    copyright: "© {year} Mollmart. Educational diploma project — not a commercial service.",
    educationalNote: "Demo metrics and testimonials are illustrative.",
  },
  nav: {
    links: {
      home: "Home",
      problem: "Problem",
      features: "How It Works",
      buyers: "For Buyers",
      sellers: "For Sellers",
      faq: "FAQ",
    },
    cta: "Explore Concept",
    login: "Log in",
    signup: "Sign up",
    progress: {
      hero: "Hero",
      problem: "Problem",
      features: "Features",
      gallery: "Gallery",
      buyers: "Buyers",
      sellers: "Sellers",
      dual: "Dual",
      testimonials: "Reviews",
      faq: "FAQ",
      cta: "Start",
    },
  },
};

const ru: LandingCopy = {
  hero: {
    group1: ["СМОТРИТЕ КОНКУРЕНЦИЮ ПРОДАВЦОВ", "ОПИШИТЕ ПОТРЕБНОСТЬ"],
    group2: ["СПРОС", "ВСТРЕЧАЕТ", "ПРЕДЛОЖЕНИЕ"],
    descPrimary: "Маркетплейс, где сначала спрос",
    descAccent: "покупатели публикуют заявки, продавцы конкурируют за сделку.",
    ctaExplore: "ИЗУЧИТЬ КОНЦЕПТ",
    ctaCreate: "Создать заявку",
    ctaCatalog: "Каталог",
  },
  problem: {
    eyebrow: "Проблема",
    title: "Классические маркетплейсы",
    titleLine2: "заставляют угадывать",
    body: "Продавцы закупают товар в надежде, что кто-то купит. Покупатели листают сотни объявлений. Нет переговоров, прозрачности и связи.",
    cards: [
      {
        title: "Склад без спроса",
        description: "Вы вкладываетесь в остатки и платите за хранение, надеясь, что покупатель найдёт лот.",
      },
      {
        title: "Бесконечный поиск",
        description: "Десятки вкладок и магазинов — и всё равно нет уверенности, что нашли лучшее.",
      },
      {
        title: "Нет переговоров",
        description: "Фиксированная цена: либо соглашаетесь, либо уходите — без диалога.",
      },
    ],
  },
  features: {
    eyebrow: "Как это работает",
    title: "Три способа торговать",
    items: [
      {
        title: "Купить сейчас",
        description: "Каталог, корзина, оформление — классический маркетплейс готовых товаров.",
      },
      {
        title: "Заявка и офферы",
        description: "Опишите потребность — продавцы видят спрос и присылают конкурирующие предложения.",
      },
      {
        title: "Переговоры и сделка",
        description: "Сравните офферы, общайтесь в чате и договоритесь на одной платформе.",
      },
    ],
  },
  gallery: {
    eyebrow: "Живые категории",
    title: "От электроники до услуг",
  },
  buyer: {
    eyebrow: "Для покупателей",
    title: "Как это работает для покупателя",
    body: "Не ищите товар — опишите задачу и дайте продавцам конкурировать. Четыре шага до нужного результата.",
    cta: "Создать заявку",
    steps: [
      {
        title: "Опишите заявку",
        description: "Категория, бюджет, количество и детали — всё в одной форме.",
      },
      {
        title: "Получите офферы",
        description: "Продавцы видят заявку в реальном времени и предлагают лучшие условия.",
      },
      {
        title: "Выберите и обсудите",
        description: "Сравните предложения, откройте чат и уточните детали.",
      },
      {
        title: "Заказ и трекинг",
        description: "Подтвердите сделку, оформите заказ и следите за доставкой.",
      },
    ],
  },
  seller: {
    eyebrow: "Для продавцов",
    title: "Как это работает для продавца",
    body: "Продавайте то, что уже ищут, а не то, что пылится на складе. Видьте спрос и отвечайте лучшим оффером.",
    cta: "Доска заявок",
    steps: [
      {
        title: "Живые заявки",
        description: "Лента запросов по вашей категории, региону и экспертизе.",
      },
      {
        title: "Конкурентные офферы",
        description: "Отвечайте ценой, сроками и преимуществами, которые выделяют вас.",
      },
      {
        title: "Переговоры в чате",
        description: "Уточняйте спецификацию, корректируйте цену и закрывайте сделку.",
      },
      {
        title: "Каталог товаров",
        description: "Добавляйте готовые позиции с ценой и остатком для мгновенной покупки.",
      },
    ],
  },
  dual: {
    eyebrow: "Двойной аккаунт",
    title: "Один аккаунт.",
    titleLine2: "Два режима.",
    buyerCaption: "Покупатель — заявки, каталог, корзина, заказы, чат",
    sellerCaption: "Продавец — витрина, доска заявок, офферы, аналитика",
  },
  testimonials: {
    eyebrow: "Отзывы",
    title: "Что говорят пользователи",
    items: [
      {
        name: "Daniyar K.",
        role: "Покупатель",
        text: "Mollmart строится вокруг спроса, а не бесконечного листания каталога. Я публикую заявку, продавцы откликаются офферами — от запроса до чата и заказа всё в одном месте.",
      },
      {
        name: "Abdurahman S.",
        role: "Продавец",
        text: "Открываю доску заявок, вижу реальный спрос и отвечаю оффером или подключаюсь к reverse auction. Платформа начинается с потребности покупателя — это и есть её суть.",
      },
      {
        name: "Yerlan S.",
        role: "Покупатель и продавец",
        text: "Один аккаунт с двумя рабочими пространствами — главная фишка. Могу опубликовать заявку, переключить режим и вести витрину с офферами без отдельных аккаунтов.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Частые вопросы",
    items: [
      {
        q: "Чем Mollmart отличается от Amazon или eBay?",
        a: "Классика — каталог и поиск. Mollmart — сначала заявка покупателя, затем отклики продавцов. Есть и каталог для мгновенных покупок.",
      },
      {
        q: "Можно только покупать?",
        a: "Да. Режим покупателя бесплатен: заявки, офферы, чат и заказы без подписки.",
      },
      {
        q: "Как устроена оплата?",
        a: "Для покупателей бесплатно. Продавцы платят небольшую комиссию с завершённых сделок — без абонплаты.",
      },
      {
        q: "Безопасны ли платежи?",
        a: "В прототипе — отслеживание заказа и статусов. Все действия фиксируются в истории (учебный проект).",
      },
      {
        q: "Какие категории есть?",
        a: "Электроника, дом и сад, мода, промышленность, услуги, еда, спорт, авто и другие.",
      },
      {
        q: "Есть мобильное приложение?",
        a: "Сайт адаптивен в браузере. Нативные приложения — в планах концепта.",
      },
    ],
  },
  cta: {
    title: "Начните с одной заявки или одного товара",
    subtitle: "Присоединяйтесь к тысячам участников концепта.",
    primary: "Начать бесплатно",
    secondary: "Каталог",
  },
  footer: {
    tagline: "Маркетплейс «сначала спрос» для современного бизнеса.",
    buyersTitle: "Покупателям",
    sellersTitle: "Продавцам",
    companyTitle: "Компания",
    links: {
      postRequest: "Создать заявку",
      browseCatalog: "Каталог",
      howItWorks: "Как это работает",
      register: "Регистрация",
      requestBoard: "Доска заявок",
      newListing: "Новый товар",
      home: "Главная",
      login: "Войти",
    },
    copyright: "© {year} Mollmart. Учебный дипломный проект — не коммерческий сервис.",
    educationalNote: "Цифры и отзывы на сайте — демонстрационные.",
  },
  nav: {
    links: {
      home: "Главная",
      problem: "Проблема",
      features: "Как работает",
      buyers: "Покупателям",
      sellers: "Продавцам",
      faq: "FAQ",
    },
    cta: "Смотреть концепт",
    login: "Войти",
    signup: "Регистрация",
    progress: {
      hero: "Hero",
      problem: "Проблема",
      features: "Как",
      gallery: "Категории",
      buyers: "Покупатель",
      sellers: "Продавец",
      dual: "Режимы",
      testimonials: "Отзывы",
      faq: "FAQ",
      cta: "Старт",
    },
  },
};

const kk: LandingCopy = {
  hero: {
    group1: ["САТУШЫЛАРДЫҢ БАЙЛАУЫН КӨРІҢІЗ", "ҚАЖЕТТІЛІГІҢІЗДІ ЖАЗЫҢЫЗ"],
    group2: ["СҰРАНЫС", "КЕЗДЕСЕДІ", "ҰСЫНЫС"],
    descPrimary: "Алдымен сұраныс — маркетплейс",
    descAccent: "сатып алушы сұрау жариялайды, сатушылар бәсекелеседі.",
    ctaExplore: "ТҰЖЫРИЯМДЫ ҚАРАУ",
    ctaCreate: "Сұрау жасау",
    ctaCatalog: "Каталог",
  },
  problem: {
    eyebrow: "Мәселе",
    title: "Дәстүрлі маркетплейстер",
    titleLine2: "болжамға мәжбүрлейді",
    body: "Сатушылар сатылады деп үміттеніп қор жинайды. Сатып алушы жүздеген жарнаманы айналып өтеді. Келіссөз жоқ.",
    cards: [
      {
        title: "Сұраныссыз қор",
        description: "Қоймаға инвестиция — дұрыс сатып алушы табылады деп үміт.",
      },
      {
        title: "Шексіз іздеу",
        description: "Көп қойынды, көп дүкен — ең жақсысын таптың ба, белгісіз.",
      },
      {
        title: "Келіссөз жоқ",
        description: "Бекітілген баға: қабылдау немесе кету.",
      },
    ],
  },
  features: {
    eyebrow: "Қалай жұмыс істейді",
    title: "Сауда жасаудың үш жолы",
    items: [
      {
        title: "Қазір сатып алу",
        description: "Каталог, себет, төлем — дайын тауарлар үшін классикалық маркетплейс.",
      },
      {
        title: "Сұрау және ұсыныс",
        description: "Қажеттілікті жазыңыз — сатушылар нақты сұранысты көріп, ұсыныс жібереді.",
      },
      {
        title: "Келіссөз және мәміле",
        description: "Ұсыныстарды салыстырыңыз, чатта келісіңіз.",
      },
    ],
  },
  gallery: {
    eyebrow: "Тірі санаттар",
    title: "Электроникадан қызметке дейін",
  },
  buyer: {
    eyebrow: "Сатып алушыларға",
    title: "Сатып алушыға қалай жұмыс істейді",
    body: "Тауар іздемеңіз — тапсырманы сипаттаңыз, сатушылар бәсекелессін. Төрт қадам.",
    cta: "Сұрау жасау",
    steps: [
      {
        title: "Сұрауды сипаттаңыз",
        description: "Санат, бюджет, саны және мәліметтер.",
      },
      {
        title: "Ұсыныстарды алыңыз",
        description: "Сатушылар нақты уақытта жауап береді.",
      },
      {
        title: "Таңдаңыз және чат",
        description: "Ұсыныстарды салыстырып, чатта нақтылаңыз.",
      },
      {
        title: "Тапсырыс және бақылау",
        description: "Мәмілені растап, жеткізуді қадағалаңыз.",
      },
    ],
  },
  seller: {
    eyebrow: "Сатушыларға",
    title: "Сатушыға қалай жұмыс істейді",
    body: "Қоймада жатқанды емес, ізделетінді сатыңыз. Нақты сұранысқа жауап беріңіз.",
    cta: "Сұраулар тақтасы",
    steps: [
      {
        title: "Тірі сұраулар",
        description: "Санатыңыз бен аймағыңыз бойынша сұраулар.",
      },
      {
        title: "Бәсекелес ұсыныс",
        description: "Баға, мерзім және артықшылықпен жауап беріңіз.",
      },
      {
        title: "Чатта келіссөз",
        description: "Техникалық мәліметтерді нақтылап, мәміле жабыңыз.",
      },
      {
        title: "Каталогтағы тауар",
        description: "Дайын позицияларды баға мен қалдықпен қосыңыз.",
      },
    ],
  },
  dual: {
    eyebrow: "Қос режим",
    title: "Бір аккаунт.",
    titleLine2: "Екі режим.",
    buyerCaption: "Сатып алушы — сұраулар, каталог, себет, тапсырыстар, чат",
    sellerCaption: "Сатушы — витрина, тақта, ұсыныстар, аналитика",
  },
  testimonials: {
    eyebrow: "Пікірлер",
    title: "Пайдаланушылар не дейді",
    items: [
      {
        name: "Daniyar K.",
        role: "Сатып алушы",
        text: "Mollmart сұранысқа негізделген — каталогты шексіз листеу емес. Мен сұрау жариялаймын, сатушылар ұсыныс береді; сұраудан чат пен тапсырысқа дейін бәрі бір жерде.",
      },
      {
        name: "Abdurahman S.",
        role: "Сатушы",
        text: "Сұраулар тақтасын ашамын, нақты сұранысты көремін және ұсыныс жіберемін немесе кері аукционға қосыламын. Платформа сатып алушы қажеттілігінен басталады.",
      },
      {
        name: "Yerlan S.",
        role: "Сатып алушы және сатушы",
        text: "Бір аккаунтта екі workspace — басты идея. Сұрау жариялап, режимді ауыстырып, витрина мен ұсыныстарды бөлек аккаунтсыз басқара аламын.",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Жиі қойылатын сұрақтар",
    items: [
      {
        q: "Mollmart Amazon/eBay-ден қалай өзгеше?",
        a: "Классика — каталог және іздеу. Mollmart — алдымен сатып алушы сұрауы, кейін сатушы жауаптары. Каталог режимі де бар.",
      },
      {
        q: "Тек сатып алушы болуға бола ма?",
        a: "Иә. Сатып алушы режимі тегін: сұрау, ұсыныс, чат, тапсырыс.",
      },
      {
        q: "Баға моделі қалай?",
        a: "Сатып алушыларға тегін. Сатушылар аяқталған мәміледен аз комиссия төлейді.",
      },
      {
        q: "Төлем қауіпсіз бе?",
        a: "Прототипте — тапсырыс күйін бақылау (оқу жобасы).",
      },
      {
        q: "Қандай санаттар бар?",
        a: "Электроника, үй, сән, өнеркәсіп, қызметтер, тамақ, спорт, авто және т.б.",
      },
      {
        q: "Мобильді қосымша бар ма?",
        a: "Браузерде толық бейімделген. Натив қосымшалар — концепт жоспарында.",
      },
    ],
  },
  cta: {
    title: "Бір сұраудан немесе бір тауардан бастаңыз",
    subtitle: "Концептке қосылыңыз.",
    primary: "Тегін бастау",
    secondary: "Каталог",
  },
  footer: {
    tagline: "Заманауи бизнес үшін «алдымен сұраныс» маркетплейсі.",
    buyersTitle: "Сатып алушыларға",
    sellersTitle: "Сатушыларға",
    companyTitle: "Компания",
    links: {
      postRequest: "Сұрау жасау",
      browseCatalog: "Каталог",
      howItWorks: "Қалай жұмыс істейді",
      register: "Тіркелу",
      requestBoard: "Сұраулар тақтасы",
      newListing: "Жаңа тауар",
      home: "Басты бет",
      login: "Кіру",
    },
    copyright: "© {year} Mollmart. Оқу диплом жобасы — коммерциялық емес.",
    educationalNote: "Сандар мен пікірлер — демонстрациялық.",
  },
  nav: {
    links: {
      home: "Басты бет",
      problem: "Мәселе",
      features: "Қалай жұмыс істейді",
      buyers: "Сатып алушыларға",
      sellers: "Сатушыларға",
      faq: "FAQ",
    },
    cta: "Концептті көру",
    login: "Кіру",
    signup: "Тіркелу",
    progress: {
      hero: "Hero",
      problem: "Мәселе",
      features: "Қалай",
      gallery: "Санат",
      buyers: "Сатып алушы",
      sellers: "Сатушы",
      dual: "Режим",
      testimonials: "Пікір",
      faq: "FAQ",
      cta: "Бастау",
    },
  },
};

const copies: Record<Language, LandingCopy> = { en, ru, kk };

export function getLandingCopy(language: Language): LandingCopy {
  return copies[language] ?? en;
}
