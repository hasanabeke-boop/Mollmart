/**
 * Ground-truth FAQ for Mollmart Assistant — matches real product flows in the app.
 * Used for local FAQ matching and injected into Gemini/OpenAI system context.
 */

export type FaqIntent =
  | 'buyer_request'
  | 'buyer_offers'
  | 'seller_board'
  | 'seller_offer'
  | 'chat'
  | 'profile'
  | 'notifications'
  | 'catalog'
  | 'auction'
  | 'orders'
  | 'account'
  | 'admin'
  | 'platform_limits'
  | 'greeting'
  | 'fallback';

export type FaqEntry = {
  id: string;
  intent: FaqIntent;
  /** Optional role filter — empty means all roles */
  roles?: Array<'buyer' | 'seller' | 'admin'>;
  keywords: string[];
  question: string;
  answer: string;
  answerRu: string;
  answerKk: string;
  route?: string;
  suggestions: string[];
  actions: string[];
};

export const MOLLMART_PLATFORM_OVERVIEW = [
  'Mollmart is a buyer-request marketplace: buyers post what they need; sellers browse requests and submit offers.',
  'A buyer request starts as a draft, then is published from My Requests. Sellers see it on Buyer Requests.',
  'Each seller can send one active offer per request. The buyer compares offers and accepts one.',
  'After acceptance, Messages opens for that buyer–seller pair. They can send counter price proposals and agree a total.',
  'The buyer can run demo payment in chat (simulated — no real card charge). That creates a request-deal order in Order history.',
  'Sellers can also list products in My showcase; buyers browse Catalog, use Cart, and checkout separately.',
  'Buyers may enable auction on a request: reverse auction where sellers compete by lowering price after enough sellers join.',
  'Users with both buyer and seller access switch modes with the Buyer/Seller toggle in the header or mobile bar.',
  'Notifications cover offers, accepted offers, messages, orders, and moderation. Admins manage users, categories, moderation, and orders.',
  'Not supported: real card payments, escrow, shipping labels, carrier APIs, or refunds — only demo payment and manual tracking status.'
].join(' ');

export const MOLLMART_FAQ: FaqEntry[] = [
  {
    id: 'buyer-create-request',
    intent: 'buyer_request',
    roles: ['buyer'],
    keywords: ['create request', 'post request', 'new request', 'publish request', 'draft', 'strong request'],
    question: 'How do I create and publish a buyer request?',
    answer:
      'Go to Post request (/create-product-request). Add a clear title, category, quantity, budget per unit, optional deadline and location, and details sellers need. Save as draft, then open My Requests and press Publish when ready. Sellers will see it on Buyer Requests.',
    answerRu:
      'Откройте Создать запрос (/create-product-request). Укажите название, категорию, количество, бюджет за единицу, при необходимости срок и локацию, а также детали для продавцов. Сохраните черновик и опубликуйте из Моих запросов. Продавцы увидят его в Заявках покупателей.',
    answerKk:
      'Сұраныс жасау бетін ашыңыз. Атау, санат, саны, бірлік бюджеті, қажет болса мерзім мен орны және сатушыларға керек мәліметтерді енгізіңіз. Черновикті сақтап, Менің сұраныстарымнан жариялаңыз.',
    route: '/create-product-request',
    suggestions: ['How do I compare offers?', 'Can I enable auction on my request?', 'What should I write in a request?'],
    actions: ['Open Post request', 'Fill title, category, budget, details', 'Publish from My Requests']
  },
  {
    id: 'buyer-edit-request',
    intent: 'buyer_request',
    roles: ['buyer'],
    keywords: ['edit request', 'change request', 'update request', 'modify request'],
    question: 'Can I edit my request after publishing?',
    answer:
      'Yes from My Requests. If sellers already sent offers, you can usually only update deadline, location, and negotiable flag. Without offers you can edit title, category, quantity, price, and description.',
    answerRu:
      'Да, из Моих запросов. Если уже есть предложения, обычно можно менять только срок, локацию и флаг «открыт к другим суммам». Без предложений доступно полное редактирование.',
    answerKk:
      'Иә, Менің сұраныстарымнан. Ұсыныстар болса, көбіне тек мерзім, орын және келісімге ашық белгісін өзгертуге болады.',
    route: '/my-requests',
    suggestions: ['How do I accept an offer?', 'Why do I see no offers?'],
    actions: ['Open My Requests', 'Click Edit on the request', 'Save changes']
  },
  {
    id: 'buyer-no-offers',
    intent: 'buyer_offers',
    roles: ['buyer'],
    keywords: ['no offers', 'zero offers', 'why no offer', 'not getting offers', 'see offers'],
    question: 'Why does my request have no offers?',
    answer:
      'Check that the request is published (not draft), status is active, and details/budget are clear. New requests need time for sellers to respond. Try a realistic budget, a specific category, and a clear description. Browse similar requests as a seller would to see if your request is competitive.',
    answerRu:
      'Проверьте, что запрос опубликован (не черновик), статус активен, а бюджет и описание понятны. Новым запросам нужно время. Уточните категорию, сделайте бюджет реалистичным и описание конкретным.',
    answerKk:
      'Сұраныс жарияланғанын, белсенді екенін және бюджет пен сипатаманың анық екенін тексеріңіз. Жаңа сұраныстарға уақыт керек.',
    route: '/my-requests',
    suggestions: ['How do I publish a draft?', 'How do I accept an offer?'],
    actions: ['Open My Requests', 'Confirm status is published', 'Improve title, budget, and details']
  },
  {
    id: 'buyer-accept-offer',
    intent: 'buyer_offers',
    roles: ['buyer'],
    keywords: ['accept offer', 'accept offers', 'choose offer', 'pick offer', 'compare offers'],
    question: 'How do I accept a seller offer?',
    answer:
      'Open My Requests, expand Offers on your published request, review price per unit and order total, then press Accept offer. That starts Messages with that seller. Only one offer can be accepted per request.',
    answerRu:
      'Откройте Мои запросы, раскройте Предложения у опубликованного запроса, сравните цену за единицу и итог заказа, затем нажмите Принять предложение. Откроется чат с этим продавцом. На запрос принимается только одно предложение.',
    answerKk:
      'Менің сұраныстарымды ашып, жарияланған сұраныстағы Ұсыныстарды қараңыз, бірлік бағасы мен жалпы соманы салыстырып, Ұсынысты қабылдау батырмасын басыңыз.',
    route: '/my-requests',
    suggestions: ['How does chat work?', 'What happens after accepting an offer?'],
    actions: ['Open My Requests', 'Review seller offers', 'Accept the best offer']
  },
  {
    id: 'seller-find-requests',
    intent: 'seller_board',
    roles: ['seller'],
    keywords: ['find requests', 'buyer requests', 'browse requests', 'request board', 'find customer', 'find buyers'],
    question: 'How do sellers find buyer requests?',
    answer:
      'Open Buyer Requests (/browse-buyer-requests) or Seller Dashboard. Search and filter by category, offers, or keywords. Open a matching request and send an offer with unit price, message, and timing.',
    answerRu:
      'Откройте Заявки покупателей или Панель продавца. Ищите и фильтруйте по категории и ключевым словам. Откройте подходящий запрос и отправьте предложение с ценой, сообщением и сроком.',
    answerKk:
      'Сатып алушы сұраныстарын немесе Сатушы панелін ашыңыз. Санат және кілт сөз бойынша іздеңіз, сәйкес сұранысты ашып ұсыныс жіберіңіз.',
    route: '/browse-buyer-requests',
    suggestions: ['How do I send a strong offer?', 'Why can I not send two offers?'],
    actions: ['Open Buyer Requests', 'Filter active requests', 'Open a match and send offer']
  },
  {
    id: 'seller-one-offer',
    intent: 'seller_offer',
    roles: ['seller'],
    keywords: ['two offers', 'second offer', 'another offer', 'already offered', 'one offer', 'cannot send offer'],
    question: 'Why can a seller send only one offer per request?',
    answer:
      'Mollmart allows one active offer per seller per request to keep bidding fair. If you already offered, update your approach by improving your message or price in a new request cycle — you cannot stack multiple active offers on the same request.',
    answerRu:
      'На один запрос у продавца может быть только одно активное предложение. Если вы уже отправили предложение, повторно активное второе отправить нельзя — дождитесь ответа покупателя или выберите другой запрос.',
    answerKk:
      'Бір сұранысқа сатушының тек бір белсенді ұсынысы болады. Екінші белсенді ұсыныс жіберуге болмайды — сатып алушының жауабын күтіңіз немесе басқа сұранысты таңдаңыз.',
    route: '/browse-buyer-requests',
    suggestions: ['How do I send a strong offer?', 'How do I find buyer requests?'],
    actions: ['Check your existing offer on the request', 'Wait for buyer response', 'Browse other requests']
  },
  {
    id: 'seller-strong-offer',
    intent: 'seller_offer',
    roles: ['seller'],
    keywords: ['strong offer', 'good offer', 'send offer', 'make offer', 'submit offer', 'offer message'],
    question: 'How do I send a strong seller offer?',
    answer:
      'Open the buyer request, enter a realistic unit price in the request currency, explain what you deliver and when, and keep the message short and specific. Buyers compare total order price (unit price × quantity) and your credibility in profile.',
    answerRu:
      'Откройте запрос покупателя, укажите реалистичную цену за единицу в валюте запроса, кратко опишите что и когда поставите. Покупатель сравнивает итог заказа (цена × количество) и ваш профиль.',
    answerKk:
      'Сатып алушы сұранысын ашып, нақты бірлік бағасын енгізіңіз, не және қашан жеткізетінді қысқаша жазыңыз.',
    route: '/browse-buyer-requests',
    suggestions: ['Where is seller dashboard?', 'How do auctions work?'],
    actions: ['Open a buyer request', 'Enter unit price and message', 'Send offer']
  },
  {
    id: 'chat-no-conversation',
    intent: 'chat',
    keywords: ['no chat', 'no conversation', 'no messages', 'empty chat', 'why no chat', 'messages empty'],
    question: 'Why do I have no conversations in Messages?',
    answer:
      'Messages are created only after a buyer accepts a seller offer. If you are the buyer, accept an offer from My Requests first. If you are the seller, wait until a buyer accepts your offer. Closed or cancelled requests will not open new chats.',
    answerRu:
      'Сообщения появляются только после того, как покупатель принимает предложение продавца. Покупателю: примите предложение в Моих запросах. Продавцу: дождитесь принятия вашего предложения.',
    answerKk:
      'Хабарламалар сатып алушы сатушы ұсынысын қабылдағаннан кейін ғана пайда болады.',
    route: '/chat',
    suggestions: ['How do I accept an offer?', 'How does demo payment work?'],
    actions: ['Accept an offer first (buyer)', 'Wait for acceptance (seller)', 'Open Messages']
  },
  {
    id: 'chat-negotiate-pay',
    intent: 'chat',
    keywords: ['chat work', 'negotiate', 'counter offer', 'price proposal', 'demo payment', 'pay in chat', 'agree price'],
    question: 'How do chat, price agreement, and demo payment work?',
    answer:
      'After offer acceptance, use Messages to discuss details. Either side can send order-total price proposals; the other side can accept to lock the agreed price. The buyer then sees Pay now (demo) — simulated payment that creates a request-deal order. No real card is charged.',
    answerRu:
      'После принятия предложения используйте Сообщения. Стороны отправляют встречные предложения по итоговой сумме заказа; при согласии покупатель видит демо-оплату. Это создаёт заказ по сделке. Реальная карта не списывается.',
    answerKk:
      'Ұсыныс қабылданғаннан кейін Хабарламаларды қолданыңыз. Тараптар жалпы сома ұсынады; келісілгеннен кейін сатып алушы демо төлемді көреді — нақты карта емес.',
    route: '/chat',
    suggestions: ['Where is my order history?', 'What happens after demo payment?'],
    actions: ['Open Messages', 'Send or accept price proposals', 'Buyer runs demo payment']
  },
  {
    id: 'orders-tracking',
    intent: 'orders',
    keywords: ['order history', 'my orders', 'tracking', 'track order', 'delivery status', 'carrier', 'shipment'],
    question: 'Where are orders and how does tracking work?',
    answer:
      'Order history (/orders) lists request-deal orders after demo payment and catalog checkout orders. Open an order for status updates. Admins or sellers may set carrier and tracking number for the diploma tracking flow — this is status display, not a live carrier API.',
    answerRu:
      'История заказов показывает сделки после демо-оплаты и заказы из каталога. Откройте заказ для статуса. Админ или продавец может указать перевозчика и трек-номер — это отображение статуса, не интеграция с перевозчиком.',
    answerKk:
      'Тапсырыс тарихы демо төлемнен кейінгі мәмілелер мен каталог тапсырыстарын көрсетеді. Статус үшін тапсырысты ашыңыз.',
    route: '/orders',
    suggestions: ['How does demo payment work?', 'How does chat work?'],
    actions: ['Open Order history', 'Select your order', 'Check status and tracking fields']
  },
  {
    id: 'catalog-showcase',
    intent: 'catalog',
    keywords: ['catalog', 'showcase', 'product listing', 'my listings', 'cart', 'checkout', 'shop products'],
    question: 'How do catalog, showcase, and cart work?',
    answer:
      'Sellers add products via New showcase listing (/seller/products/new) and manage them in My showcase. Buyers browse Catalog (/products), add items to Cart, and checkout. This is separate from the buyer-request offer flow.',
    answerRu:
      'Продавцы добавляют товары через Новый товар в витрине и управляют ими в Моей витрине. Покупатели открывают Каталог, добавляют в Корзину и оформляют заказ. Это отдельно от потока запросов и предложений.',
    answerKk:
      'Сатушылар витринаға тауар қосады, сатып алушылар Каталогтан себетке қосып тапсырыс береді. Бұл сұраныс/ұсыныс процесінен бөлек.',
    route: '/products',
    suggestions: ['How do buyer requests work?', 'Where is cart?'],
    actions: ['Sellers: My showcase → new listing', 'Buyers: Catalog → Cart → checkout']
  },
  {
    id: 'auction-reverse',
    intent: 'auction',
    keywords: ['auction', 'auctions', 'reverse auction', 'join auction', 'bid', 'lower price', 'floor price'],
    question: 'How do reverse auctions work on Mollmart?',
    answer:
      'A buyer can enable auction when creating a request. Sellers join from Buyer Requests. After enough sellers register, trading starts: sellers compete by lowering price each round down to their floor. The lowest bid when trading ends wins. Buyers watch in the auction room; sellers manage active auctions from Seller → Active auctions.',
    answerRu:
      'Покупатель может включить аукцион при создании запроса. Продавцы присоединяются с доски заявок. После набора участников торги начинаются: продавцы снижают цену по раундам до своего минимума. Побеждает наименьшая ставка. Покупатель смотрит в комнате аукциона.',
    answerKk:
      'Сатып алушы сұраныс жасау кезінде аукционды қоса алады. Сатушылар тақтадан қосылады, бағаны төмендете отырып бәсекелеседі. Соңғы ең төмен баға жеңеді.',
    route: '/seller/auctions',
    suggestions: ['How do I join an auction?', 'How do I create a request with auction?'],
    actions: ['Buyer: enable auction on request', 'Sellers: join from Buyer Requests', 'Track in auction room']
  },
  {
    id: 'workspace-toggle',
    intent: 'account',
    keywords: ['buyer seller', 'switch role', 'workspace', 'toggle', 'dual account', 'seller mode', 'buyer mode'],
    question: 'How do I switch between buyer and seller mode?',
    answer:
      'If your account has both buyer and seller access, use the Buyer/Seller toggle in the top header (desktop) or mobile workspace bar. Buyer mode shows My requests, Catalog, Cart. Seller mode shows Dashboard, Buyer Requests, My showcase, and Active auctions.',
    answerRu:
      'Если у аккаунта есть доступ и покупателя, и продавца, переключайте режим кнопкой Buyer/Seller в шапке или мобильной панели. Режим покупателя: Мои запросы, Каталог. Режим продавца: Панель, Заявки покупателей, Витрина.',
    answerKk:
      'Екі рөл болса, жоғарғы панельдегі Buyer/Seller ауыстырғышын қолданыңыз.',
    route: '/profile',
    suggestions: ['How do I find buyer requests?', 'How do I create a request?'],
    actions: ['Use Buyer/Seller toggle in header', 'Buyer: My requests & Catalog', 'Seller: Dashboard & Buyer Requests']
  },
  {
    id: 'notifications',
    intent: 'notifications',
    keywords: ['notification', 'notifications', 'alert', 'unread', 'notify'],
    question: 'What do notifications cover?',
    answer:
      'Notifications include new seller offers, accepted offers, new messages, demo payment events, order status changes, moderation actions, and account updates. Open Notifications from the bell icon in the header.',
    answerRu:
      'Уведомления: новые предложения, принятие предложений, сообщения, демо-оплата, статус заказов, модерация и аккаунт. Откройте через колокольчик в шапке.',
    answerKk:
      'Хабарландырулар: жаңа ұсыныстар, қабылдау, хабарлар, демо төлем, тапсырыс статусы. Қоңырау белгішесінен ашыңыз.',
    route: '/notifications',
    suggestions: ['How do message notifications work?', 'Why no notification appears?'],
    actions: ['Open Notifications', 'Review unread items', 'Open linked request or chat']
  },
  {
    id: 'admin-basics',
    intent: 'admin',
    roles: ['admin'],
    keywords: ['admin', 'moderation', 'block user', 'categories', 'manage users', 'admin orders'],
    question: 'What can admins do in Mollmart?',
    answer:
      'Admins open /admin for user management, category management, content moderation, and request-deal order oversight. They can update order carrier/tracking, review flagged content, and manage user status. Admin routes are separate from normal buyer/seller screens.',
    answerRu:
      'Админ открывает /admin: пользователи, категории, модерация, заказы по сделкам. Можно обновить перевозчика и трекинг заказа, проверить жалобы и статус пользователей.',
    answerKk:
      'Админ /admin арқылы пайдаланушылар, санаттар, модерация және тапсырыстарды басқарады.',
    route: '/admin',
    suggestions: ['How does moderation work?', 'Where are request-deal orders?'],
    actions: ['Open Admin', 'Review users and categories', 'Check moderation queue']
  },
  {
    id: 'platform-limits',
    intent: 'platform_limits',
    keywords: ['real payment', 'credit card', 'escrow', 'refund', 'shipping label', 'stripe', 'paypal', 'invoice'],
    question: 'What payments and shipping features does Mollmart support?',
    answer:
      'Mollmart supports demo (simulated) payment after price agreement in chat. That creates a trackable request-deal order. There is no real card processing, escrow, automatic shipping labels, carrier API integration, or refund workflow in the current app.',
    answerRu:
      'Поддерживается только демо-оплата после согласования цены в чате. Реальные карты, escrow, автоматические этикетки доставки и возвраты в текущей версии не реализованы.',
    answerKk:
      'Чатта келісілгеннен кейін тек демо төлем қолданылады. Нақты карта, escrow және қайтарым жоқ.',
    route: '/help',
    suggestions: ['How does demo payment work?', 'Where is my order history?'],
    actions: ['Use demo Pay now in chat', 'Track order in Order history', 'Agree price in Messages first']
  },
  {
    id: 'register-login',
    intent: 'account',
    keywords: ['register', 'sign up', 'login', 'log in', 'password', 'forgot password', 'verify email'],
    question: 'How do I register and log in?',
    answer:
      'Use Sign Up (/register) to create an account with email and password. Log In (/login) for returning users. If email verification is enabled on the server, confirm your email before full access. Reset password flows use the forgot-password pages if configured.',
    answerRu:
      'Регистрация — /register, вход — /login. Если на сервере включена верификация email, подтвердите почту. Сброс пароля — через страницу восстановления, если настроено.',
    answerKk:
      'Тіркелу — /register, кіру — /login. Email растау серверде қосылған болса, растаңыз.',
    route: '/register',
    suggestions: ['Why login fails?', 'How do I edit profile?'],
    actions: ['Open Register or Login', 'Confirm email if required', 'Complete profile after login']
  },
  {
    id: 'after-accept-offer',
    intent: 'buyer_offers',
    keywords: ['after accept', 'accepted offer', 'what happens next', 'then what', 'after accepting'],
    question: 'What happens after I accept an offer?',
    answer:
      'Accepting an offer opens Messages with that seller, marks the offer accepted, and closes competing offers for that request. You negotiate the final order total in chat, then the buyer runs demo payment to create an order in Order history.',
    answerRu:
      'Принятие предложения открывает Сообщения с продавцом, фиксирует принятие и закрывает другие предложения по запросу. Далее согласуйте итог в чате и проведите демо-оплату.',
    answerKk:
      'Ұсынысты қабылдау сол сатушымен Хабарламаларды ашады, басқа ұсыныстар жабылады. Содан кейін чатта келісіп, демо төлем жасалады.',
    route: '/chat',
    suggestions: ['How does demo payment work?', 'Where is my order history?'],
    actions: ['Open Messages', 'Agree final total', 'Buyer: Pay now (demo)']
  }
];

function normalizeFaqText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function roleAllowed(entry: FaqEntry, role?: string): boolean {
  if (!entry.roles || entry.roles.length === 0) return true;
  if (!role) return true;
  return entry.roles.includes(role as 'buyer' | 'seller' | 'admin');
}

export type FaqMatch = {
  entry: FaqEntry;
  score: number;
};

function scoreFaqEntry(text: string, entry: FaqEntry): number {
  let score = 0;
  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalizeFaqText(keyword);
    if (normalizedKeyword.includes(' ')) {
      if (text.includes(normalizedKeyword)) score += 3;
    } else if (text.split(' ').includes(normalizedKeyword)) {
      score += 1.5;
    } else if (text.includes(normalizedKeyword)) {
      score += 1;
    }
  }

  const questionWords = normalizeFaqText(entry.question).split(' ').filter((w) => w.length > 3);
  const overlap = questionWords.filter((w) => text.includes(w)).length;
  score += overlap * 0.5;

  const answerWords = normalizeFaqText(entry.answer).split(' ').filter((w) => w.length > 4);
  const answerOverlap = answerWords.filter((w) => text.includes(w)).length;
  score += answerOverlap * 0.15;

  return score;
}

/** Rank FAQ entries by relevance score */
export function rankMollmartFaq(message: string, role?: string, limit = 3): FaqMatch[] {
  const text = normalizeFaqText(message);
  if (!text) return [];

  const scored: FaqMatch[] = [];
  for (const entry of MOLLMART_FAQ) {
    if (!roleAllowed(entry, role)) continue;
    const score = scoreFaqEntry(text, entry);
    if (score > 0) scored.push({ entry, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Best single FAQ match above threshold */
export function matchMollmartFaq(message: string, role?: string): FaqMatch | null {
  const best = rankMollmartFaq(message, role, 1)[0];
  return best && best.score >= 2.0 ? best : null;
}

export function faqAnswerForLanguage(
  entry: FaqEntry,
  language: 'en' | 'ru' | 'kk'
): string {
  if (language === 'ru') return entry.answerRu;
  if (language === 'kk') return entry.answerKk;
  return entry.answer;
}

/** Condensed FAQ for Gemini/OpenAI system prompt (ground truth) */
export function buildFaqSystemContext(maxEntries = 18): string {
  const lines = MOLLMART_FAQ.slice(0, maxEntries).map(
    (entry) => `Q: ${entry.question}\nA: ${entry.answer}`
  );
  return [
    '=== Mollmart FAQ (authoritative — do not contradict) ===',
    MOLLMART_PLATFORM_OVERVIEW,
    '',
    ...lines
  ].join('\n');
}

/** Suggested FAQ chips for a role (English keys — frontend translates) */
export function faqSuggestionsForRole(role?: string): string[] {
  const filtered = MOLLMART_FAQ.filter((e) => roleAllowed(e, role));
  const picks = [
    filtered.find((e) => e.id === 'buyer-create-request'),
    filtered.find((e) => e.id === 'seller-find-requests'),
    filtered.find((e) => e.id === 'chat-negotiate-pay'),
    filtered.find((e) => e.id === 'auction-reverse'),
    filtered.find((e) => e.id === 'orders-tracking'),
    filtered.find((e) => e.id === 'after-accept-offer')
  ].filter(Boolean) as FaqEntry[];

  const rolePicks =
    role === 'seller'
      ? picks.filter((e) => ['seller-find-requests', 'seller-strong-offer', 'auction-reverse', 'chat-negotiate-pay'].includes(e.id))
      : role === 'buyer'
        ? picks.filter((e) => ['buyer-create-request', 'buyer-accept-offer', 'chat-negotiate-pay', 'after-accept-offer'].includes(e.id))
        : role === 'admin'
          ? picks.filter((e) => e.intent === 'admin' || e.id === 'orders-tracking')
          : picks;

  const unique = [...new Set(rolePicks.map((e) => e.question))];
  return unique.slice(0, 4);
}
