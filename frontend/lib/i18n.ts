export type AppLanguage = "en" | "ru" | "kk";

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "kk", label: "Kazakh", nativeLabel: "Қазақша" },
];

export const LANGUAGE_STORAGE_KEY = "mollmart_language";

type Dictionary = Record<string, Partial<Record<AppLanguage, string>>>;

export const dictionary: Dictionary = {
  "Search...": { ru: "Поиск...", kk: "Іздеу..." },
  "Search…": { ru: "Поиск...", kk: "Іздеу..." },
  "Requests": { ru: "Заявки", kk: "Сұраныстар" },
  "Browse": { ru: "Обзор", kk: "Шолу" },
  "Showcase": { ru: "Витрина", kk: "Витрина" },
  "Orders": { ru: "Заказы", kk: "Тапсырыстар" },
  "Sell": { ru: "Продажи", kk: "Сату" },
  "Post": { ru: "Создать", kk: "Жариялау" },
  "New listing": { ru: "Новый товар", kk: "Жаңа тауар" },
  "+ Listing": { ru: "+ Товар", kk: "+ Тауар" },
  "Order history": { ru: "История заказов", kk: "Тапсырыс тарихы" },
  "Profile": { ru: "Профиль", kk: "Профиль" },
  "My Requests": { ru: "Мои заявки", kk: "Менің сұраныстарым" },
  "Seller Dashboard": { ru: "Панель продавца", kk: "Сатушы панелі" },
  "My showcase": { ru: "Моя витрина", kk: "Менің витринам" },
  "New showcase listing": { ru: "Новая позиция витрины", kk: "Витринаға жаңа тауар" },
  "Sign Out": { ru: "Выйти", kk: "Шығу" },
  "Log In": { ru: "Войти", kk: "Кіру" },
  "Sign Up": { ru: "Регистрация", kk: "Тіркелу" },
  "Assistant chat": { ru: "Чат-помощник", kk: "Көмекші чат" },
  "Buyer": { ru: "Покупатель", kk: "Сатып алушы" },
  "Seller": { ru: "Продавец", kk: "Сатушы" },
  "Cart": { ru: "Корзина", kk: "Себет" },
  "Review items before checkout.": { ru: "Проверьте товары перед оформлением.", kk: "Төлем алдында тауарларды тексеріңіз." },
  "Continue shopping": { ru: "Продолжить покупки", kk: "Сауданы жалғастыру" },
  "Your cart is empty.": { ru: "Корзина пуста.", kk: "Себет бос." },
  "Browse products": { ru: "Смотреть товары", kk: "Тауарларды көру" },
  "Seller:": { ru: "Продавец:", kk: "Сатушы:" },
  "Remove": { ru: "Удалить", kk: "Жою" },
  "Summary": { ru: "Итого", kk: "Қорытынды" },
  "Subtotal": { ru: "Промежуточный итог", kk: "Аралық жиынтық" },
  "Shipping is demo-only and currently free.": { ru: "Доставка демонстрационная и сейчас бесплатная.", kk: "Жеткізу демо түрінде және қазір тегін." },
  "Checkout": { ru: "Оформить заказ", kk: "Тапсырысты рәсімдеу" },
  "Loading...": { ru: "Загрузка...", kk: "Жүктелуде..." },
  "Loading…": { ru: "Загрузка...", kk: "Жүктелуде..." },
  "Checkout failed": { ru: "Ошибка оформления заказа", kk: "Тапсырысты рәсімдеу қатесі" },
  "Failed to load cart": { ru: "Не удалось загрузить корзину", kk: "Себетті жүктеу мүмкін болмады" },
  "Failed to update cart": { ru: "Не удалось обновить корзину", kk: "Себетті жаңарту мүмкін болмады" },
  "Failed to remove item": { ru: "Не удалось удалить товар", kk: "Тауарды жою мүмкін болмады" },
  "Demo checkout creates orders and reserves stock.": { ru: "Демо-оформление создаёт заказы и резервирует остатки.", kk: "Демо рәсімдеу тапсырыс жасап, қорды резервтейді." },
  "Shipping details": { ru: "Данные доставки", kk: "Жеткізу деректері" },
  "Name": { ru: "Имя", kk: "Аты" },
  "Phone": { ru: "Телефон", kk: "Телефон" },
  "Address": { ru: "Адрес", kk: "Мекенжай" },
  "Checkout currency": { ru: "Валюта оплаты", kk: "Төлем валютасы" },
  "Order summary": { ru: "Состав заказа", kk: "Тапсырыс құрамы" },
  "Place demo order": { ru: "Оформить демо-заказ", kk: "Демо тапсырыс беру" },
  "Placing order...": { ru: "Оформляем заказ...", kk: "Тапсырыс рәсімделуде..." },
  "Seller showcase": { ru: "Витрина продавцов", kk: "Сатушылар витринасы" },
  "Recommendations": { ru: "Рекомендации", kk: "Ұсынымдар" },
  "All categories": { ru: "Все категории", kk: "Барлық санаттар" },
  "Browse seller listings, add available products to cart, or create a buyer request when you want sellers to compete.": {
    ru: "Просматривайте товары продавцов, добавляйте доступные позиции в корзину или создавайте заявку, чтобы продавцы конкурировали.",
    kk: "Сатушылардың тауарларын қарап, қолжетімділерін себетке қосыңыз немесе сатушылар бәсекелесуі үшін сұраныс жасаңыз.",
  },
  "Filters": { ru: "Фильтры", kk: "Сүзгілер" },
  "Search": { ru: "Поиск", kk: "Іздеу" },
  "View": { ru: "Открыть", kk: "Көру" },
  "Price": { ru: "Цена", kk: "Баға" },
  "Out of stock": { ru: "Нет в наличии", kk: "Қоймада жоқ" },
  "Add to cart": { ru: "В корзину", kk: "Себетке қосу" },
  "Adding...": { ru: "Добавляем...", kk: "Қосылуда..." },
  "Added to cart.": { ru: "Добавлено в корзину.", kk: "Себетке қосылды." },
  "View cart": { ru: "Открыть корзину", kk: "Себетті көру" },
  "Request something like this": { ru: "Запросить похожее", kk: "Осыған ұқсасын сұрау" },
  "This is your listing.": { ru: "Это ваша позиция.", kk: "Бұл сіздің тауарыңыз." },
  "Home": { ru: "Главная", kk: "Басты бет" },
  "Back to showcase": { ru: "Назад к витрине", kk: "Витринаға оралу" },
  "Listing not found.": { ru: "Позиция не найдена.", kk: "Тауар табылмады." },
  "Listing unavailable.": { ru: "Позиция недоступна.", kk: "Тауар қолжетімсіз." },
  "No image": { ru: "Нет изображения", kk: "Сурет жоқ" },
  "More showcase": { ru: "Больше витрины", kk: "Көбірек витрина" },
  "My orders": { ru: "Мои заказы", kk: "Менің тапсырыстарым" },
  "Orders after you pay from chat — track delivery and details here.": {
    ru: "Заказы после оплаты из чата — отслеживайте доставку и детали здесь.",
    kk: "Чаттан төлегеннен кейінгі тапсырыстар — жеткізу мен мәліметтерді осы жерден бақылаңыз.",
  },
  "All orders": { ru: "Все заказы", kk: "Барлық тапсырыстар" },
  "Processing": { ru: "В обработке", kk: "Өңделуде" },
  "Shipped": { ru: "Отправлен", kk: "Жіберілді" },
  "Delivered": { ru: "Доставлен", kk: "Жеткізілді" },
  "Cancelled": { ru: "Отменён", kk: "Бас тартылды" },
  "Item": { ru: "Товар", kk: "Тауар" },
  "Order": { ru: "Заказ", kk: "Тапсырыс" },
  "Date": { ru: "Дата", kk: "Күні" },
  "Status": { ru: "Статус", kk: "Күйі" },
  "Total": { ru: "Итого", kk: "Барлығы" },
  "Action": { ru: "Действие", kk: "Әрекет" },
  "Details": { ru: "Детали", kk: "Мәліметтер" },
  "Track": { ru: "Отследить", kk: "Бақылау" },
  "No orders yet.": { ru: "Заказов пока нет.", kk: "Әзірге тапсырыс жоқ." },
  "Browse showcase": { ru: "Смотреть витрину", kk: "Витринаны көру" },
  "Page": { ru: "Страница", kk: "Бет" },
  "of": { ru: "из", kk: "/" },
  "orders": { ru: "заказов", kk: "тапсырыс" },
  "Create a request": { ru: "Создать заявку", kk: "Сұраныс жасау" },
  "Profile settings": { ru: "Настройки профиля", kk: "Профиль баптаулары" },
  "Sign in": { ru: "Войти", kk: "Кіру" },
  "Previous": { ru: "Назад", kk: "Артқа" },
  "Next": { ru: "Далее", kk: "Келесі" },
  "Language": { ru: "Язык", kk: "Тіл" },
};

const regexRules: Array<{
  pattern: RegExp;
  replace: Partial<Record<AppLanguage, (...matches: string[]) => string>>;
}> = [
  {
    pattern: /^(\d+) in stock$/,
    replace: {
      ru: (n) => `${n} в наличии`,
      kk: (n) => `${n} қоймада`,
    },
  },
  {
    pattern: /^Showing (\d+) of (\d+) examples$/,
    replace: {
      ru: (shown, total) => `Показано ${shown} из ${total} примеров`,
      kk: (shown, total) => `${shown}/${total} мысал көрсетілді`,
    },
  },
  {
    pattern: /^Page (\d+) of (\d+)$/,
    replace: {
      ru: (page, total) => `Страница ${page} из ${total}`,
      kk: (page, total) => `${page}/${total} бет`,
    },
  },
  {
    pattern: /^Listed as (.+)$/,
    replace: {
      ru: (price) => `Указано как ${price}`,
      kk: (price) => `Көрсетілгені ${price}`,
    },
  },
  {
    pattern: /^Seller: (.+)$/,
    replace: {
      ru: (seller) => `Продавец: ${seller}`,
      kk: (seller) => `Сатушы: ${seller}`,
    },
  },
];

export function normalizeLanguage(value: unknown): AppLanguage {
  return value === "ru" || value === "kk" || value === "en" ? value : "en";
}

export function translateText(text: string, language: AppLanguage): string {
  if (language === "en") return text;
  const direct = dictionary[text]?.[language];
  if (direct) return direct;
  for (const rule of regexRules) {
    const match = text.match(rule.pattern);
    const replacer = rule.replace[language];
    if (match && replacer) return replacer(...match.slice(1));
  }
  return text;
}
