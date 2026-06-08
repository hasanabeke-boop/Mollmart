import { ChatbotMessageInput, ChatbotReply } from '../types/chatbot';
import config from '../../../config/config';
import logger from '../../../middleware/logger';
import {
  buildFaqSystemContext,
  faqAnswerForLanguage,
  MOLLMART_FAQ,
  type FaqEntry,
  type FaqIntent
} from '../knowledge/mollmartFaq';
import {
  enrichReplyWithPageContext,
  expandUserQuery,
  intelligentFaqAnalysis,
  isVagueHelpRequest,
  buildProactivePageReply,
  pickContextualSuggestions,
  summarizeConversation,
  synthesizePartialFaqReply
} from '../knowledge/intelligentReply';
import { pageContextForPrompt, resolvePageContext } from '../knowledge/pageContext';

type ChatbotIntent =
  | 'greeting'
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
  | 'deployment'
  | 'account'
  | 'admin'
  | 'platform_limits'
  | 'assistant_setup'
  | 'fallback';

type ChatbotLanguage = NonNullable<ChatbotMessageInput['language']>;

const validIntents = [
  'greeting',
  'buyer_request',
  'buyer_offers',
  'seller_board',
  'seller_offer',
  'chat',
  'profile',
  'notifications',
  'catalog',
  'auction',
  'orders',
  'deployment',
  'account',
  'admin',
  'platform_limits',
  'assistant_setup',
  'fallback'
] as const;

const knownRoutes = new Set([
  '/register',
  '/login',
  '/profile',
  '/create-product-request',
  '/my-requests',
  '/browse-buyer-requests',
  '/chat',
  '/orders',
  '/chatbot',
  '/notifications',
  '/products',
  '/cart',
  '/seller/dashboard',
  '/seller/analytics',
  '/seller/showcase',
  '/seller/listings',
  '/seller/products/new',
  '/seller/auctions',
  '/help',
  '/admin',
  '/admin/categories',
  '/admin/moderation',
  '/admin/orders',
  '/admin/users'
]);

function defaultSuggestionsForRole(role?: ChatbotMessageInput['userRole']): string[] {
  if (role === 'seller') {
    return [
      'How do I find buyer requests?',
      'How do I send a strong offer?',
      'How do auctions work?'
    ];
  }
  if (role === 'buyer') {
    return [
      'How do I create a request?',
      'How do I accept an offer?',
      'How does chat work?'
    ];
  }
  if (role === 'admin') {
    return [
      'How do I manage users?',
      'How does moderation work?',
      'Where are request-deal orders?'
    ];
  }
  return [
    'How do I create a request?',
    'How do sellers send offers?',
    'How do I register on Mollmart?'
  ];
}

const routeByIntent: Partial<Record<ChatbotIntent, string>> = {
  buyer_request: '/create-product-request',
  buyer_offers: '/my-requests',
  seller_board: '/browse-buyer-requests',
  seller_offer: '/browse-buyer-requests',
  chat: '/chat',
  profile: '/profile',
  notifications: '/notifications',
  catalog: '/products',
  auction: '/seller/auctions',
  orders: '/orders',
  deployment: '/help',
  account: '/login',
  admin: '/admin',
  platform_limits: '/help',
  assistant_setup: '/chatbot'
};

const intentByRoute = new Map(
  Object.entries(routeByIntent).map(([intent, route]) => [route, intent as ChatbotIntent])
);

const actionsByIntent: Partial<Record<ChatbotIntent, string[]>> = {
  buyer_request: ['Open Post Request', 'Enter title, category, budget, and details', 'Save draft, then publish from My Requests'],
  buyer_offers: ['Open My Requests', 'Review offers under a published request', 'Accept the best offer to open chat'],
  seller_board: ['Open Buyer Requests', 'Filter or search active requests', 'Choose a request that matches your service'],
  seller_offer: ['Open a buyer request', 'Enter price, timeframe, and message', 'Send one clear offer'],
  chat: ['Accept an offer first', 'Open Messages', 'Agree on price, then use demo payment'],
  profile: ['Open Profile', 'Update base details', 'Save changes'],
  notifications: ['Open Notifications', 'Review unread items', 'Open the linked request or chat'],
  catalog: ['Open Catalog', 'Add items to cart', 'Checkout from cart when ready'],
  auction: ['Open buyer requests with auction enabled', 'Join auction as a seller', 'Track live bids in the auction room'],
  orders: ['Open Order history', 'Find the request-deal order', 'Check status and tracking updates'],
  deployment: ['Set production environment variables', 'Run Prisma migrations', 'Build frontend and backend images/services'],
  account: ['Check email and password', 'Confirm account status', 'Check email verification setting'],
  admin: ['Open Admin', 'Review users/categories/moderation/orders', 'Apply changes carefully'],
  platform_limits: ['Use chat for final price', 'Demo payment creates a request order', 'Real payment, escrow, and shipping labels are outside scope'],
  assistant_setup: ['Set GEMINI_API_KEY', 'Choose GEMINI_MODEL', 'Restart/rebuild backend']
};

const responses: Record<ChatbotIntent, Omit<ChatbotReply, 'intent' | 'source' | 'suggestedRoute' | 'actions' | 'confidence'>> = {
  greeting: {
    reply: 'I guide buyers, sellers, and admins through Mollmart: publish requests, send offers, chat after acceptance, agree a price, run demo payment, and track request-deal orders.',
    suggestions: defaultSuggestionsForRole()
  },
  buyer_request: {
    reply: 'Buyer flow: create a request with a clear title, category, budget, optional deadline/location, and useful details. It starts as a draft; publish it from My Requests when you are ready for sellers to send offers.',
    suggestions: ['What should I write in a request?', 'How do I publish a draft?', 'How do I compare offers?']
  },
  buyer_offers: {
    reply: 'To manage offers, open My Requests, choose your published request, then compare seller offers. Accepting an offer starts the conversation in Messages.',
    suggestions: ['How do I accept an offer?', 'Why do I see no offers?', 'Can I edit my request?']
  },
  seller_board: {
    reply: 'Seller flow: open Buyer Requests, search or filter active requests, then open the best match and send an offer. Buyers see your offer under their request.',
    suggestions: ['How do I find buyer requests?', 'How do I make a strong offer?', 'Where is seller dashboard?']
  },
  seller_offer: {
    reply: 'A strong seller offer includes a realistic price in the request currency, estimated availability, and a short message explaining what you can provide. The buyer can accept or decline it.',
    suggestions: ['Why can I not send two offers?', 'What should my offer message include?', 'Where are my seller metrics?']
  },
  chat: {
    reply: 'Messages are created after a buyer accepts a seller offer. In chat, both sides can agree on a final price; then the buyer can run a demo payment, which creates a request-deal order for tracking.',
    suggestions: ['Why do I have no conversations?', 'How does demo payment work?', 'Where is chat?']
  },
  profile: {
    reply: 'Profile is where users complete account details. Sellers should keep seller information clear so buyers trust their offers; buyers can use preferences to shape future requests.',
    suggestions: ['How do I edit profile?', 'What should seller profile include?', 'Where are preferences?']
  },
  notifications: {
    reply: 'Notifications surface important events such as new offers, accepted offers, messages, demo payments, order status changes, moderation changes, and account status updates.',
    suggestions: ['Where are notifications?', 'Why no notification appears?', 'How do message notifications work?']
  },
  catalog: {
    reply: 'The Catalog lets buyers browse seller showcase products, add items to the cart, and check out. Sellers manage listings from My showcase and can add a new product listing.',
    suggestions: ['Where is the catalog?', 'How do I add a showcase listing?', 'How does cart checkout work?']
  },
  auction: {
    reply: 'Auctions run on buyer requests with auction enabled. Sellers join from the request board; buyers can open the auction room to watch bids. Use Seller Dashboard analytics for auction activity.',
    suggestions: ['How do I join an auction?', 'Where are active auctions?', 'How do buyer auctions start?']
  },
  orders: {
    reply: 'Order history shows request-deal orders created after demo payment in chat, plus catalog orders from checkout. Open an order to see status, carrier, and tracking when available.',
    suggestions: ['Where is my order history?', 'What happens after demo payment?', 'How does tracking work?']
  },
  deployment: {
    reply: 'Minimum deployment needs production env values, PostgreSQL, backend hosting, frontend hosting, Prisma migrations, and secure JWT/OpenAI/SMTP secrets. Redis can usually be optional if the app is configured that way.',
    suggestions: ['Which env values are required?', 'How do I rebuild Docker?', 'Can Redis be disabled?']
  },
  account: {
    reply: 'For account issues, check the user email/password, whether the account is active, whether email verification is required, and whether JWT secrets/database connection are valid in the backend env.',
    suggestions: ['How do I disable email verification?', 'Why login fails?', 'How do I reset password?']
  },
  admin: {
    reply: 'Admin screens are for user management, categories, moderation, and request-deal orders. Admins can update order status, carrier, and tracking number for the diploma tracking flow.',
    suggestions: ['How do I manage categories?', 'How does moderation work?', 'Where are orders?']
  },
  platform_limits: {
    reply: 'Mollmart currently supports request matching, seller offers, accepted-offer chat, agreed-price demo payment, request-deal orders, and tracking status. The payment is simulated: no real card charge, escrow, shipping label, refund, or carrier integration is provided.',
    suggestions: ['What happens after accepting an offer?', 'How does demo payment work?', 'Where are orders?']
  },
  assistant_setup: {
    reply: 'The assistant uses GEMINI_API_KEY and GEMINI_MODEL on the backend. OpenAI is an optional fallback. If no AI key is set or the API fails, it falls back to local Mollmart guidance.',
    suggestions: ['Where do I put the API key?', 'Which model should I use?', 'How do I rebuild Docker?']
  },
  fallback: {
    reply: 'I can help with Mollmart: buyer requests, seller offers, chat, catalog, auctions, orders, profiles, and notifications. Tell me what you are trying to do on this screen.',
    suggestions: defaultSuggestionsForRole()
  }
};

const chatbotTranslations: Record<Exclude<ChatbotLanguage, 'en'>, Record<string, string>> = {
  ru: {
    'How do I create a request?': 'Как создать запрос?',
    'How do sellers send offers?': 'Как продавцы отправляют предложения?',
    'How does chat work?': 'Как работает чат?',
    'How do I register on Mollmart?': 'Как зарегистрироваться в Mollmart?',
    'How do I send a strong offer?': 'Как отправить сильное предложение?',
    'Can I enable auction on my request?': 'Можно ли включить аукцион в запросе?',
    'How do I create a request with auction?': 'Как создать запрос с аукционом?',
    'How do buyer requests work?': 'Как работают запросы покупателей?',
    'Where is cart?': 'Где корзина?',
    'Where is my order history?': 'Где история моих заказов?',
    'How do auctions work?': 'Как работают аукционы?',
    'Where are request-deal orders?': 'Где заказы по сделкам из запросов?',
    'Where is the catalog?': 'Где каталог?',
    'How do I add a showcase listing?': 'Как добавить товар в витрину?',
    'How does cart checkout work?': 'Как оформить заказ из корзины?',
    'How do I join an auction?': 'Как присоединиться к аукциону?',
    'Where are active auctions?': 'Где активные аукционы?',
    'How do buyer auctions start?': 'Как начинаются аукционы покупателя?',
    'What happens after demo payment?': 'Что происходит после демо-оплаты?',
    'How does tracking work?': 'Как работает отслеживание?',
    'Open Catalog': 'Открыть каталог',
    'Add items to cart': 'Добавить товары в корзину',
    'Checkout from cart when ready': 'Оформить заказ из корзины',
    'Open buyer requests with auction enabled': 'Открыть заявки с включённым аукционом',
    'Join auction as a seller': 'Присоединиться к аукциону как продавец',
    'Track live bids in the auction room': 'Следить за ставками в комнате аукциона',
    'Open Order history': 'Открыть историю заказов',
    'Find the request-deal order': 'Найти заказ по сделке из запроса',
    'Check status and tracking updates': 'Проверить статус и обновления трекинга',
    'What should I write in a request?': 'Что написать в запросе?',
    'How do I publish a draft?': 'Как опубликовать черновик?',
    'How do I compare offers?': 'Как сравнить предложения?',
    'How do I accept an offer?': 'Как принять предложение?',
    'Why do I see no offers?': 'Почему я не вижу предложений?',
    'Can I edit my request?': 'Можно ли редактировать запрос?',
    'How do I find buyer requests?': 'Как найти запросы покупателей?',
    'How do I make a strong offer?': 'Как сделать сильное предложение?',
    'Where is seller dashboard?': 'Где панель продавца?',
    'Why can I not send two offers?': 'Почему нельзя отправить два предложения?',
    'What should my offer message include?': 'Что должно быть в сообщении предложения?',
    'Where are my seller metrics?': 'Где мои метрики продавца?',
    'Why do I have no conversations?': 'Почему нет диалогов?',
    'How do unread messages work?': 'Как работают непрочитанные сообщения?',
    'Where is chat?': 'Где чат?',
    'How do I edit profile?': 'Как редактировать профиль?',
    'What should seller profile include?': 'Что должен содержать профиль продавца?',
    'Where are preferences?': 'Где настройки предпочтений?',
    'Where are notifications?': 'Где уведомления?',
    'Why no notification appears?': 'Почему уведомление не появляется?',
    'How do message notifications work?': 'Как работают уведомления сообщений?',
    'Which env values are required?': 'Какие env значения обязательны?',
    'How do I rebuild Docker?': 'Как пересобрать Docker?',
    'Can Redis be disabled?': 'Можно ли отключить Redis?',
    'How do I disable email verification?': 'Как отключить подтверждение email?',
    'Why login fails?': 'Почему вход не работает?',
    'How do I reset password?': 'Как сбросить пароль?',
    'How do I manage categories?': 'Как управлять категориями?',
    'How does moderation work?': 'Как работает модерация?',
    'Where are users?': 'Где пользователи?',
    'What happens after accepting an offer?': 'Что происходит после принятия предложения?',
    'Where do I put the API key?': 'Куда добавить API ключ?',
    'Which model should I use?': 'Какую модель использовать?',
    'Open Post Request': 'Открыть создание запроса',
    'Enter title, category, budget, and details': 'Укажите название, категорию, бюджет и детали',
    'Save draft, then publish from My Requests': 'Сохраните черновик и опубликуйте из Моих запросов',
    'Open My Requests': 'Открыть Мои запросы',
    'Review offers under a published request': 'Просмотрите предложения под опубликованным запросом',
    'Accept the best offer to open chat': 'Примите лучшее предложение, чтобы открыть чат',
    'Open Buyer Requests': 'Открыть запросы покупателей',
    'Filter or search active requests': 'Фильтруйте или ищите активные запросы',
    'Choose a request that matches your service': 'Выберите запрос, подходящий вашей услуге',
    'Open a buyer request': 'Откройте запрос покупателя',
    'Enter price, timeframe, and message': 'Введите цену, срок и сообщение',
    'Send one clear offer': 'Отправьте одно понятное предложение',
    'Accept an offer first': 'Сначала примите предложение',
    'Open Messages': 'Открыть сообщения',
    'Continue details directly with the other user': 'Продолжайте обсуждение напрямую с другим пользователем',
    'Open Profile': 'Открыть профиль',
    'Update base details': 'Обновите основные данные',
    'Save changes': 'Сохраните изменения',
    'Open Notifications': 'Открыть уведомления',
    'Review unread items': 'Просмотрите непрочитанные элементы',
    'Open the linked request or chat': 'Откройте связанный запрос или чат',
    'Set production environment variables': 'Настройте production env переменные',
    'Run Prisma migrations': 'Запустите миграции Prisma',
    'Build frontend and backend images/services': 'Соберите frontend и backend образы/сервисы',
    'Check email and password': 'Проверьте email и пароль',
    'Confirm account status': 'Проверьте статус аккаунта',
    'Check email verification setting': 'Проверьте настройку подтверждения email',
    'Open Admin': 'Открыть админ-панель',
    'Review users/categories/moderation': 'Проверьте пользователей, категории и модерацию',
    'Apply changes carefully': 'Применяйте изменения аккуратно',
    'Use chat for final details': 'Используйте чат для финальных деталей',
    'Add unsupported features only when you build them': 'Добавляйте неподдерживаемые функции только после реализации',
    'Set GEMINI_API_KEY': 'Установите GEMINI_API_KEY',
    'Choose GEMINI_MODEL': 'Выберите GEMINI_MODEL',
    'Restart/rebuild backend': 'Перезапустите или пересоберите backend'
  },
  kk: {
    'How do I create a request?': 'Сұранысты қалай жасаймын?',
    'How do sellers send offers?': 'Сатушылар ұсынысты қалай жібереді?',
    'How does chat work?': 'Чат қалай жұмыс істейді?',
    'How do I register on Mollmart?': 'Mollmart-та қалай тіркелемін?',
    'How do I send a strong offer?': 'Күшті ұсынысты қалай жіберемін?',
    'Can I enable auction on my request?': 'Сұранысқа аукцион қосуға бола ма?',
    'How do I create a request with auction?': 'Аукционды сұранысқа қалай қосамын?',
    'How do buyer requests work?': 'Сатып алушы сұраныстары қалай жұмыс істейді?',
    'Where is cart?': 'Себет қайда?',
    'Where is my order history?': 'Тапсырыс тарихым қайда?',
    'How do auctions work?': 'Аукциондар қалай жұмыс істейді?',
    'Where are request-deal orders?': 'Сұраныс мәмілелерінің тапсырыстары қайда?',
    'Where is the catalog?': 'Каталог қайда?',
    'How do I add a showcase listing?': 'Витринаға тауар қалай қосамын?',
    'How does cart checkout work?': 'Себеттен тапсырыс қалай рәсімделеді?',
    'How do I join an auction?': 'Аукционға қалай қосыламын?',
    'Where are active auctions?': 'Белсенді аукциондар қайда?',
    'How do buyer auctions start?': 'Сатып алушы аукциондары қалай басталады?',
    'What happens after demo payment?': 'Демо төлемнен кейін не болады?',
    'How does tracking work?': 'Трекинг қалай жұмыс істейді?',
    'Open Catalog': 'Каталогты ашу',
    'Add items to cart': 'Тауарларды себетке қосу',
    'Checkout from cart when ready': 'Дайын болғанда себеттен тапсырыс беру',
    'Open buyer requests with auction enabled': 'Аукцион қосылған сұраныстарды ашу',
    'Join auction as a seller': 'Сатушы ретінде аукционға қосылу',
    'Track live bids in the auction room': 'Аукцион бөлмесінде ставкаларды бақылау',
    'Open Order history': 'Тапсырыс тарихын ашу',
    'Find the request-deal order': 'Сұраныс мәмілесінің тапсырысын табу',
    'Check status and tracking updates': 'Статус пен трекинг жаңартуларын тексеру',
    'What should I write in a request?': 'Сұранысқа не жазу керек?',
    'How do I publish a draft?': 'Черновикті қалай жариялаймын?',
    'How do I compare offers?': 'Ұсыныстарды қалай салыстырамын?',
    'How do I accept an offer?': 'Ұсынысты қалай қабылдаймын?',
    'Why do I see no offers?': 'Неге ұсыныстар көрінбейді?',
    'Can I edit my request?': 'Сұранысты өңдеуге бола ма?',
    'How do I find buyer requests?': 'Сатып алушы сұраныстарын қалай табамын?',
    'How do I make a strong offer?': 'Жақсы ұсынысты қалай жасаймын?',
    'Where is seller dashboard?': 'Сатушы панелі қайда?',
    'Why can I not send two offers?': 'Неге екі ұсыныс жіберуге болмайды?',
    'What should my offer message include?': 'Ұсыныс хабарында не болуы керек?',
    'Where are my seller metrics?': 'Сатушы метрикалары қайда?',
    'Why do I have no conversations?': 'Неге диалог жоқ?',
    'How do unread messages work?': 'Оқылмаған хабарлар қалай жұмыс істейді?',
    'Where is chat?': 'Чат қайда?',
    'How do I edit profile?': 'Профильді қалай өңдеймін?',
    'What should seller profile include?': 'Сатушы профилінде не болуы керек?',
    'Where are preferences?': 'Қалаулар қайда?',
    'Where are notifications?': 'Хабарландырулар қайда?',
    'Why no notification appears?': 'Неге хабарландыру шықпайды?',
    'How do message notifications work?': 'Хабарлама ескертулері қалай жұмыс істейді?',
    'Which env values are required?': 'Қандай env мәндері міндетті?',
    'How do I rebuild Docker?': 'Docker-ді қалай қайта жинаймын?',
    'Can Redis be disabled?': 'Redis-ті өшіруге бола ма?',
    'How do I disable email verification?': 'Email растауды қалай өшіремін?',
    'Why login fails?': 'Кіру неге сәтсіз?',
    'How do I reset password?': 'Құпиясөзді қалай қалпына келтіремін?',
    'How do I manage categories?': 'Санаттарды қалай басқарамын?',
    'How does moderation work?': 'Модерация қалай жұмыс істейді?',
    'Where are users?': 'Пайдаланушылар қайда?',
    'What happens after accepting an offer?': 'Ұсынысты қабылдағаннан кейін не болады?',
    'Where do I put the API key?': 'API кілтін қайда қоямын?',
    'Which model should I use?': 'Қай модельді қолданамын?',
    'Open Post Request': 'Сұраныс жасау бетін ашу',
    'Enter title, category, budget, and details': 'Атауын, санатын, бюджетін және мәліметін енгізіңіз',
    'Save draft, then publish from My Requests': 'Черновикті сақтап, Менің сұраныстарымнан жариялаңыз',
    'Open My Requests': 'Менің сұраныстарымды ашу',
    'Review offers under a published request': 'Жарияланған сұраныстағы ұсыныстарды қараңыз',
    'Accept the best offer to open chat': 'Чат ашу үшін ең жақсы ұсынысты қабылдаңыз',
    'Open Buyer Requests': 'Сатып алушы сұраныстарын ашу',
    'Filter or search active requests': 'Белсенді сұраныстарды сүзу немесе іздеу',
    'Choose a request that matches your service': 'Қызметіңізге сәйкес сұранысты таңдаңыз',
    'Open a buyer request': 'Сатып алушы сұранысын ашыңыз',
    'Enter price, timeframe, and message': 'Баға, мерзім және хабарлама енгізіңіз',
    'Send one clear offer': 'Бір нақты ұсыныс жіберіңіз',
    'Accept an offer first': 'Алдымен ұсынысты қабылдаңыз',
    'Open Messages': 'Хабарламаларды ашу',
    'Continue details directly with the other user': 'Мәліметтерді басқа пайдаланушымен тікелей жалғастырыңыз',
    'Open Profile': 'Профильді ашу',
    'Update base details': 'Негізгі деректерді жаңарту',
    'Save changes': 'Өзгерістерді сақтау',
    'Open Notifications': 'Хабарландыруларды ашу',
    'Review unread items': 'Оқылмағандарды қарау',
    'Open the linked request or chat': 'Байланысты сұранысты немесе чатты ашу',
    'Set production environment variables': 'Production env айнымалыларын орнатыңыз',
    'Run Prisma migrations': 'Prisma миграцияларын іске қосыңыз',
    'Build frontend and backend images/services': 'Frontend және backend образдарын/сервистерін жинаңыз',
    'Check email and password': 'Email және құпиясөзді тексеріңіз',
    'Confirm account status': 'Аккаунт күйін тексеріңіз',
    'Check email verification setting': 'Email растау баптауын тексеріңіз',
    'Open Admin': 'Админді ашу',
    'Review users/categories/moderation': 'Пайдаланушылар, санаттар және модерацияны қарау',
    'Apply changes carefully': 'Өзгерістерді мұқият қолданыңыз',
    'Use chat for final details': 'Соңғы мәліметтер үшін чатты қолданыңыз',
    'Add unsupported features only when you build them': 'Қолдау жоқ функцияларды іске асырғаннан кейін ғана қосыңыз',
    'Set GEMINI_API_KEY': 'GEMINI_API_KEY орнатыңыз',
    'Choose GEMINI_MODEL': 'GEMINI_MODEL таңдаңыз',
    'Restart/rebuild backend': 'Backend-ті қайта іске қосыңыз немесе қайта жинаңыз'
  }
};

const localizedReplies: Record<Exclude<ChatbotLanguage, 'en'>, Record<ChatbotIntent, string>> = {
  ru: {
    greeting: 'Я помогу с Mollmart: запросы покупателей, предложения продавцов, чат после принятия, согласование цены, демо-оплата и заказы по сделкам.',
    buyer_request: 'Процесс покупателя: создайте запрос с понятным названием, категорией, бюджетом, сроком/локацией при необходимости и полезными деталями. Сначала он сохраняется как черновик; опубликуйте его в Моих запросах, когда будете готовы получать предложения продавцов.',
    buyer_offers: 'Чтобы управлять предложениями, откройте Мои запросы, выберите опубликованный запрос и сравните предложения продавцов. Принятие предложения открывает диалог в Сообщениях.',
    seller_board: 'Процесс продавца: откройте Запросы покупателей, найдите или отфильтруйте активные запросы, затем откройте подходящий и отправьте предложение. Покупатель увидит его под своим запросом.',
    seller_offer: 'Сильное предложение продавца содержит реалистичную цену в валюте запроса, срок выполнения и короткое сообщение о том, что вы можете предоставить.',
    chat: 'Сообщения создаются после того, как покупатель принимает предложение продавца. Если чат пустой, сначала проверьте, принято ли предложение для этого запроса.',
    profile: 'Профиль нужен для заполнения данных аккаунта. Продавцам важно держать информацию понятной, а покупатели могут использовать предпочтения для будущих запросов.',
    notifications: 'Уведомления показывают важные события: новые предложения, принятые предложения, сообщения, изменения модерации и статус аккаунта.',
    catalog: 'Каталог позволяет покупателям просматривать товары продавцов, добавлять в корзину и оформлять заказ. Продавцы управляют витриной в My showcase.',
    auction: 'Аукционы доступны на запросах с включённым auction. Продавцы присоединяются с доски заявок; покупатель открывает комнату аукциона для ставок.',
    orders: 'История заказов показывает сделки после демо-оплаты в чате и заказы из каталога. Откройте заказ для статуса и трекинга.',
    deployment: 'Минимальный деплой требует production env значения, PostgreSQL, backend hosting, frontend hosting, миграции Prisma и безопасные JWT/OpenAI/SMTP секреты. Redis обычно можно сделать опциональным.',
    account: 'Для проблем с аккаунтом проверьте email/пароль, статус аккаунта, необходимость email-подтверждения, JWT secrets и подключение к базе данных backend.',
    admin: 'Админ-экраны нужны для управления пользователями, категориями и модерацией. Админ-действия должны быть отделены от обычных buyer/seller сценариев.',
    platform_limits: 'Mollmart поддерживает запросы, предложения, чат после принятия, демо-оплату, request-deal заказы и статус отслеживания. Реальная оплата картой, escrow, shipping labels, возвраты и интеграции с перевозчиками не входят в текущий scope.',
    assistant_setup: 'Помощник использует GEMINI_API_KEY и GEMINI_MODEL на backend. OpenAI — опциональный запасной вариант. Если ключ отсутствует или API падает, включается локальная справка Mollmart.',
    fallback: 'Могу помочь с Mollmart: запросы, предложения, чат, каталог, аукционы, заказы, профиль и уведомления. Напишите конкретный вопрос или нажмите подсказку ниже.'
  },
  kk: {
    greeting: 'Mollmart бойынша көмектесемін: сатып алушы сұраныстары, сатушы ұсыныстары, қабылдаудан кейінгі чат, баға келісу, демо төлем және тапсырыстар.',
    buyer_request: 'Сатып алушы процесі: анық атауы, санаты, бюджеті, қажет болса мерзімі/орны және пайдалы мәліметтері бар сұраныс жасаңыз. Ол алдымен черновик болады; ұсыныстар алуға дайын кезде Менің сұраныстарымнан жариялаңыз.',
    buyer_offers: 'Ұсыныстарды басқару үшін Менің сұраныстарымды ашып, жарияланған сұранысты таңдаңыз да, сатушылар ұсыныстарын салыстырыңыз. Ұсынысты қабылдау Хабарламаларда диалог ашады.',
    seller_board: 'Сатушы процесі: Сатып алушы сұраныстарын ашып, белсенді сұраныстарды іздеңіз немесе сүзгіден өткізіңіз, сәйкес сұранысты ашып ұсыныс жіберіңіз.',
    seller_offer: 'Жақсы сатушы ұсынысында сұраныс валютасындағы нақты баға, орындау мерзімі және не ұсына алатыныңыз туралы қысқа хабарлама болады.',
    chat: 'Хабарламалар сатып алушы сатушы ұсынысын қабылдағаннан кейін жасалады. Чат бос болса, алдымен сол сұраныста ұсыныс қабылданғанын тексеріңіз.',
    profile: 'Профиль аккаунт деректерін толтыруға арналған. Сатушылар ақпаратты түсінікті ұстауы керек, ал сатып алушылар болашақ сұраныстар үшін қалауларды қолдана алады.',
    notifications: 'Хабарландырулар жаңа ұсыныстар, қабылданған ұсыныстар, хабарлар, модерация өзгерістері және аккаунт күйі сияқты маңызды оқиғаларды көрсетеді.',
    catalog: 'Каталог сатып алушыларға сатушы тауарларын көру, себетке қосу және тапсырыс беруге мүмкіндік береді. Сатушылар витринаны My showcase арқылы басқарады.',
    auction: 'Аукциондар auction қосылған сұраныстарда жүреді. Сатушылар сұраныс тақтасынан қосылады; сатып алушы ставкаларды бақылау үшін аукцион бөлмесін ашады.',
    orders: 'Тапсырыс тарихы чаттағы демо төлемнен кейінгі мәмілелер мен каталог тапсырыстарын көрсетеді. Статус пен трекинг үшін тапсырысты ашыңыз.',
    deployment: 'Минималды деплой үшін production env мәндері, PostgreSQL, backend hosting, frontend hosting, Prisma миграциялары және қауіпсіз JWT/OpenAI/SMTP құпиялары керек. Redis көбіне опционалды бола алады.',
    account: 'Аккаунт мәселелері үшін email/құпиясөзді, аккаунт күйін, email растау талабын, JWT secrets және backend дерекқор қосылымын тексеріңіз.',
    admin: 'Админ экрандары пайдаланушыларды, санаттарды және модерацияны басқаруға арналған. Админ әрекеттері buyer/seller сценарийлерінен бөлек болуы керек.',
    platform_limits: 'Mollmart сұраныстарды, ұсыныстарды, қабылдаудан кейінгі чатты, демо төлемді, request-deal тапсырыстарын және бақылау статусын қолдайды. Нақты карта төлемі, escrow, shipping labels, қайтарымдар және тасымалдаушы интеграциялары қазіргі scope-қа кірмейді.',
    assistant_setup: 'Көмекші backend жағында GEMINI_API_KEY және GEMINI_MODEL қолданады. OpenAI — опционалды резерв. Кілт жоқ болса немесе API істемесе, локал Mollmart анықтамасы қосылады.',
    fallback: 'Mollmart бойынша көмектесе аламын: сұраныстар, ұсыныстар, чат, каталог, аукциондар, тапсырыстар, профиль және хабарландырулар. Нақты сұрақ жазыңыз немесе төмендегі ұсынысты басыңыз.'
  }
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type OpenAIChatbotPayload = {
  reply?: unknown;
  intent?: unknown;
  suggestions?: unknown;
  suggestedRoute?: unknown;
  actions?: unknown;
  confidence?: unknown;
};

const chatbotJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reply: {
      type: 'string',
      description: 'Concise helpful answer for the user, specific to Mollmart.'
    },
    intent: {
      type: 'string',
      enum: validIntents
    },
    suggestions: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    suggestedRoute: {
      type: 'string',
      description: 'One allowed Mollmart route to open next, or an empty string.'
    },
    actions: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    confidence: {
      type: 'number'
    }
  },
  required: ['reply', 'intent', 'suggestions', 'suggestedRoute', 'actions', 'confidence']
} as const;

const geminiChatbotJsonSchema = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    intent: {
      type: 'string',
      enum: [...validIntents]
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' }
    },
    suggestedRoute: { type: 'string' },
    actions: {
      type: 'array',
      items: { type: 'string' }
    },
    confidence: { type: 'number' }
  },
  required: ['reply', 'intent', 'suggestions', 'suggestedRoute', 'actions', 'confidence']
} as const;

function normalizeText(message: string): string {
  return message.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasPhrase(text: string, phrase: string): boolean {
  const normalized = phrase.toLowerCase().trim();
  if (!normalized) return false;
  if (normalized.includes(' ') || /[^\x00-\x7F]/.test(normalized)) {
    return text.includes(normalized);
  }
  return new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
}

function hasAnyPhrase(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => hasPhrase(text, phrase));
}

export class ChatbotService {
  /** Answer greetings and high-confidence FAQ locally — avoids generic AI fallbacks for RU/KK chips. */
  private tryQuickLocalReply(input: ChatbotMessageInput): ChatbotReply | null {
    const language = this.normalizeLanguage(input.language);

    if (this.isGreetingMessage(input.message)) {
      return {
        intent: 'greeting',
        reply: this.shortGreetingReply(language),
        suggestions: this.translateList(defaultSuggestionsForRole(input.userRole), language),
        source: 'local',
        suggestedRoute: '',
        actions: [],
        confidence: 0.9
      };
    }

    const { ranked, localized } = intelligentFaqAnalysis(input.message, input.userRole, language);
    const top = ranked[0];
    if (top && (localized || top.score >= 6)) {
      logger.info(`Chatbot quick FAQ: ${top.entry.id} (score=${top.score.toFixed(1)})`);
      return this.createFaqReply(input, top.entry, null);
    }

    return null;
  }

  async createReply(input: ChatbotMessageInput): Promise<ChatbotReply> {
    const quick = this.tryQuickLocalReply(input);
    if (quick) return quick;

    const geminiKey = config.gemini.apiKey.trim();
    if (geminiKey.length > 0) {
      try {
        const reply = await this.createGeminiReply(input);
        logger.info(`Chatbot reply via Gemini (intent=${reply.intent})`);
        return reply;
      } catch (error) {
        const message = (error as Error).message;
        logger.warn(`Gemini chatbot fallback used: ${message}`);
        if (/API key not valid|403|401|PERMISSION_DENIED/i.test(message)) {
          logger.warn(
            'Gemini key may be invalid. Use a Google AI Studio key (usually starts with AIza) in backend GEMINI_API_KEY.'
          );
        }
      }
    }

    if (config.openai.apiKey.trim().length > 0) {
      try {
        const reply = await this.createOpenAIReply(input);
        logger.info(`Chatbot reply via OpenAI (intent=${reply.intent})`);
        return reply;
      } catch (error) {
        logger.warn(`OpenAI chatbot fallback used: ${(error as Error).message}`);
      }
    }

    logger.info('Chatbot reply via local Mollmart guidance');
    return this.createLocalReply(input);
  }

  private faqIntentToChatbot(intent: FaqIntent): ChatbotIntent {
    if (intent === 'greeting' || intent === 'fallback') return intent;
    return intent as ChatbotIntent;
  }

  private createFaqReply(input: ChatbotMessageInput, entry: FaqEntry, pageCtx = resolvePageContext(input.currentPath)): ChatbotReply {
    const language = this.normalizeLanguage(input.language);
    const intent = this.faqIntentToChatbot(entry.intent);
    const base = faqAnswerForLanguage(entry, language);
    const reply = enrichReplyWithPageContext(base, input, language, pageCtx);

    return {
      intent,
      reply: this.withContext(input, intent, reply),
      suggestions: this.translateList(entry.suggestions, language),
      source: 'local',
      suggestedRoute: entry.route && knownRoutes.has(entry.route)
        ? entry.route
        : this.routeForIntent(intent, input.userRole),
      actions: this.translateList(entry.actions, language),
      confidence: 0.92
    };
  }

  private isGreetingMessage(message: string): boolean {
    const text = message.trim().toLowerCase();
    return /^(hello|hi|hey|сәлем|привет|здравствуй|добрый|салем)\b/i.test(text) && text.split(/\s+/).length <= 4;
  }

  private shortGreetingReply(language: ChatbotLanguage): string {
    if (language === 'ru') {
      return 'Здравствуйте! Спросите о запросах, предложениях, чате, заказах или аукционах — или нажмите подсказку ниже.';
    }
    if (language === 'kk') {
      return 'Сәлем! Сұраныстар, ұсыныстар, чат, тапсырыстар немесе аукциондар туралы сұраңыз — немесе төмендегі ұсынысты басыңыз.';
    }
    return 'Hello! Ask about requests, offers, chat, orders, or auctions — or tap a suggestion below.';
  }

  private createLocalReply(input: ChatbotMessageInput): ChatbotReply {
    const language = this.normalizeLanguage(input.language);
    const pageCtx = resolvePageContext(input.currentPath);

    if (this.isGreetingMessage(input.message)) {
      return {
        intent: 'greeting',
        reply: this.shortGreetingReply(language),
        suggestions: this.translateList(defaultSuggestionsForRole(input.userRole), language),
        source: 'local',
        suggestedRoute: '',
        actions: [],
        confidence: 0.9
      };
    }

    if (pageCtx && isVagueHelpRequest(input.message)) {
      logger.info(`Chatbot proactive page help: ${pageCtx.path}`);
      const proactive = buildProactivePageReply(input, pageCtx, language);
      const relatedFaq = MOLLMART_FAQ.find((e) => e.intent === pageCtx.primaryIntent);
      const intent = this.faqIntentToChatbot(proactive.intent);
      return {
        intent,
        reply: this.withContext(input, intent, proactive.reply),
        suggestions: this.translateList(
          relatedFaq?.suggestions ?? defaultSuggestionsForRole(input.userRole),
          language
        ),
        source: 'local',
        suggestedRoute: proactive.route,
        actions: this.translateList(proactive.actions, language),
        confidence: proactive.confidence
      };
    }

    const { ranked } = intelligentFaqAnalysis(input.message, input.userRole, language);
    const top = ranked[0];

    if (top && top.score >= 2.0) {
      logger.info(`Chatbot FAQ match: ${top.entry.id} (score=${top.score.toFixed(1)})`);
      return this.createFaqReply(input, top.entry, pageCtx);
    }

    if (top && top.score >= 1.2) {
      const synthesized = synthesizePartialFaqReply(
        ranked.map((r) => r.entry),
        input,
        language,
        pageCtx
      );
      if (synthesized) {
        logger.info(`Chatbot partial FAQ synthesis: ${ranked.map((r) => r.entry.id).join(', ')}`);
        const intent = this.faqIntentToChatbot(top.entry.intent);
        return {
          intent,
          reply: this.withContext(input, intent, synthesized),
          suggestions: this.translateList(
            pickContextualSuggestions(ranked.map((r) => r.entry)),
            language
          ),
          source: 'local',
          suggestedRoute:
            top.entry.route && knownRoutes.has(top.entry.route)
              ? top.entry.route
              : this.routeForIntent(intent, input.userRole),
          actions: this.translateList(top.entry.actions, language),
          confidence: 0.82
        };
      }
    }

    const intent = this.detectIntent(input);
    const response = responses[intent];
    const baseReply = language === 'en' ? response.reply : localizedReplies[language][intent];
    const reply = enrichReplyWithPageContext(
      this.withContext(input, intent, baseReply),
      input,
      language,
      pageCtx
    );

    const suggestions =
      intent === 'greeting' || intent === 'fallback'
        ? defaultSuggestionsForRole(input.userRole)
        : response.suggestions;

    return {
      intent,
      reply,
      suggestions: this.translateList(suggestions, language),
      source: 'local',
      suggestedRoute: this.routeForIntent(intent, input.userRole),
      actions: this.translateList(actionsByIntent[intent] ?? [], language),
      confidence: intent === 'fallback' ? 0.42 : 0.78
    };
  }

  private buildUserPrompt(input: ChatbotMessageInput, intent: ChatbotIntent): string {
    const language = this.normalizeLanguage(input.language);
    const pageCtx = resolvePageContext(input.currentPath);
    const { ranked } = intelligentFaqAnalysis(input.message, input.userRole, language);
    const expandedQuery = expandUserQuery(input.message);

    const recentHistory = (input.history ?? [])
      .slice(-10)
      .map((item) => {
        const meta = [
          item.intent ? `topic=${item.intent}` : '',
          item.suggestedRoute ? `route=${item.suggestedRoute}` : ''
        ].filter(Boolean);
        return `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}${meta.length ? ` [${meta.join(', ')}]` : ''}`;
      })
      .join('\n');

    const topicSummary = summarizeConversation(input.history, language);

    return [
      recentHistory ? `Recent conversation:\n${recentHistory}` : '',
      topicSummary ? `Conversation summary: ${topicSummary}` : '',
      this.describeConversationMemory(input),
      pageCtx ? `Current screen context:\n${pageContextForPrompt(pageCtx)}` : '',
      `Current path: ${input.currentPath || 'unknown'}`,
      `Current user role: ${input.userRole || 'guest'}`,
      `Detected intent hint: ${intent}`,
      ranked[0]
        ? `Closest FAQ: "${ranked[0].entry.question}" (relevance ${ranked[0].score.toFixed(1)}). Use its facts if applicable.`
        : '',
      expandedQuery !== input.message ? `Expanded query terms: ${expandedQuery}` : '',
      `Current user message: ${input.message}`,
      'Reply like a smart product guide: direct answer first, then numbered next steps when helpful.'
    ].filter(Boolean).join('\n\n');
  }

  private finalizeAiReply(
    parsed: Required<Omit<ChatbotReply, 'source'>>,
    intent: ChatbotIntent,
    input: ChatbotMessageInput,
    source: 'gemini' | 'openai'
  ): ChatbotReply {
    const normalizedIntent = this.normalizeIntent(parsed.intent, intent);

    return {
      ...parsed,
      intent: normalizedIntent,
      reply: this.limitReply(parsed.reply),
      suggestions: this.normalizeStringList(parsed.suggestions, responses[normalizedIntent].suggestions, 4),
      actions: this.normalizeStringList(parsed.actions, actionsByIntent[normalizedIntent] ?? [], 4),
      suggestedRoute: this.normalizeRoute(parsed.suggestedRoute, normalizedIntent, input.userRole),
      confidence: this.normalizeConfidence(parsed.confidence),
      source
    };
  }

  private async createGeminiReply(input: ChatbotMessageInput): Promise<ChatbotReply> {
    const intent = this.detectIntent(input);
    const model = config.gemini.model.trim();
    const apiKey = config.gemini.apiKey.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: this.buildSystemPrompt(input) }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: this.buildUserPrompt(input, intent) }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: geminiChatbotJsonSchema,
          maxOutputTokens: 650,
          temperature: 0.35
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Gemini request failed (${response.status}) ${errorText.slice(0, 200)}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const outputText = this.extractGeminiText(data);

    if (outputText.length === 0) {
      throw new Error('Gemini response did not include text output');
    }

    const parsed = this.parseOpenAIJson(outputText, intent);
    return this.finalizeAiReply(parsed, intent, input, 'gemini');
  }

  private async createOpenAIReply(input: ChatbotMessageInput): Promise<ChatbotReply> {
    const intent = this.detectIntent(input);

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openai.model,
        instructions: this.buildSystemPrompt(input),
        input: this.buildUserPrompt(input, intent),
        max_output_tokens: 650,
        text: {
          format: {
            type: 'json_schema',
            name: 'mollmart_chatbot_reply',
            strict: true,
            schema: chatbotJsonSchema
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`OpenAI request failed (${response.status}) ${errorText.slice(0, 200)}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const outputText = this.extractOpenAIText(data);

    if (outputText.length === 0) {
      throw new Error('OpenAI response did not include text output');
    }

    const parsed = this.parseOpenAIJson(outputText, intent);
    return this.finalizeAiReply(parsed, intent, input, 'openai');
  }

  private buildSystemPrompt(input: ChatbotMessageInput): string {
    return [
      'You are Mollmart Assistant, the in-app guide for the Mollmart marketplace.',
      'Mollmart workflow: buyers publish product/service requests; sellers browse buyer requests and submit offers; when a buyer accepts an offer, Messages opens; both sides agree a final price in chat; the buyer runs demo payment; a request-deal order appears in Order history with tracking status.',
      'Also supported: seller showcase/catalog products, cart checkout, auctions on eligible buyer requests, notifications, profiles, and admin moderation.',
      `Current role: ${input.userRole || 'guest'}. Current path: ${input.currentPath || 'unknown'}.`,
      'Role rules: buyer -> My Requests, Post request, Messages, Orders, Catalog, Cart. seller -> Buyer Requests, Seller Dashboard, My showcase, Active auctions, Messages, Analytics. admin -> Admin users/categories/moderation/orders.',
      'Use conversation memory for short follow-ups ("where", "how", "next", "that") and stay on the latest Mollmart topic unless the user changes subject.',
      `Reply language: ${this.languageName(this.normalizeLanguage(input.language))}. Return reply, suggestions, and actions in that language.`,
      'Allowed routes only: /register, /login, /profile, /create-product-request, /my-requests, /browse-buyer-requests, /chat, /orders, /chatbot, /notifications, /products, /cart, /seller/dashboard, /seller/analytics, /seller/showcase, /seller/listings, /seller/products/new, /seller/auctions, /help, /admin, /admin/categories, /admin/moderation, /admin/orders, /admin/users.',
      'Never tell regular buyers/sellers about deployment, Docker, GEMINI_API_KEY, or server setup unless they explicitly ask about deploying or configuring the assistant API.',
      'Do not invent real card payments, escrow, shipping labels, carrier APIs, refunds, or unsupported features.',
      'Answer the user question first, then give 2-4 concrete next steps with real Mollmart screen names.',
      'Use current screen context when the user is vague (e.g. "help", "what now") — explain what this page is for.',
      'For follow-ups ("where", "next", "why not working"), use conversation summary and stay on the same topic.',
      'Return only JSON matching the schema. Keep reply under 900 characters.',
      '',
      buildFaqSystemContext()
    ].join('\n');
  }

  private extractGeminiText(data: GeminiResponse): string {
    return (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('')
      .trim();
  }

  private extractOpenAIText(data: OpenAIResponse): string {
    if (typeof data.output_text === 'string') {
      return data.output_text.trim();
    }

    return (data.output ?? [])
      .flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? '')
      .join('\n')
      .trim();
  }

  private parseOpenAIJson(outputText: string, fallbackIntent: ChatbotIntent): Required<Omit<ChatbotReply, 'source'>> {
    const cleanText = outputText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

    try {
      const parsed = JSON.parse(cleanText) as OpenAIChatbotPayload;
      return {
        reply: typeof parsed.reply === 'string' && parsed.reply.trim().length > 0
          ? parsed.reply.trim()
          : responses[fallbackIntent].reply,
        intent: typeof parsed.intent === 'string' ? parsed.intent : fallbackIntent,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : responses[fallbackIntent].suggestions,
        suggestedRoute: typeof parsed.suggestedRoute === 'string' ? parsed.suggestedRoute : routeByIntent[fallbackIntent] ?? '',
        actions: Array.isArray(parsed.actions) ? parsed.actions : actionsByIntent[fallbackIntent] ?? [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.65
      };
    } catch {
      return {
        reply: cleanText,
        intent: fallbackIntent,
        suggestions: responses[fallbackIntent].suggestions,
        suggestedRoute: routeByIntent[fallbackIntent] ?? '',
        actions: actionsByIntent[fallbackIntent] ?? [],
        confidence: 0.55
      };
    }
  }

  private normalizeIntent(value: string, fallback: ChatbotIntent): ChatbotIntent {
    return validIntents.includes(value as ChatbotIntent) ? (value as ChatbotIntent) : fallback;
  }

  private normalizeStringList(value: unknown, fallback: string[], maxItems: number): string[] {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);

    return items.length > 0 ? items : fallback;
  }

  private normalizeRoute(value: string, fallbackIntent: ChatbotIntent, role?: ChatbotMessageInput['userRole']): string {
    const route = value.trim();

    if (route.length > 0 && knownRoutes.has(route)) {
      return route;
    }

    return this.routeForIntent(fallbackIntent, role);
  }

  private normalizeConfidence(value: number): number {
    if (!Number.isFinite(value)) {
      return 0.65;
    }

    return Math.max(0, Math.min(1, value));
  }

  private limitReply(reply: string): string {
    return reply.length <= 1200 ? reply : `${reply.slice(0, 1197)}...`;
  }

  private normalizeLanguage(language: ChatbotMessageInput['language']): ChatbotLanguage {
    return language === 'ru' || language === 'kk' ? language : 'en';
  }

  private languageName(language: ChatbotLanguage): string {
    if (language === 'ru') return 'Russian';
    if (language === 'kk') return 'Kazakh';
    return 'English';
  }

  private translateText(text: string, language: ChatbotLanguage): string {
    if (language === 'en') return text;
    return chatbotTranslations[language][text] ?? text;
  }

  private translateList(items: string[], language: ChatbotLanguage): string[] {
    return items.map((item) => this.translateText(item, language));
  }

  private routeForIntent(intent: ChatbotIntent, role?: ChatbotMessageInput['userRole']): string {
    if (intent === 'account' && role) {
      return '/profile';
    }

    return routeByIntent[intent] ?? '';
  }

  private detectIntent(input: ChatbotMessageInput): ChatbotIntent {
    const text = normalizeText(input.message);
    const scores = new Map<ChatbotIntent, number>();
    const add = (intent: ChatbotIntent, points: number) => {
      scores.set(intent, (scores.get(intent) ?? 0) + points);
    };

    if (hasAnyPhrase(text, ['hello', 'hey', 'hi', 'привет', 'здравствуй', 'сәлем', 'салем']) && text.split(' ').length <= 5) {
      add('greeting', 5);
    }

    if (hasAnyPhrase(text, ['создать запрос', 'опубликовать запрос', 'запрос покупател', 'сұраныс жасау'])) add('buyer_request', 6);
    if (hasAnyPhrase(text, ['принять предложение', 'принять оффер', 'ұсынысты қабылда'])) add('buyer_offers', 6);
    if (hasAnyPhrase(text, ['как работает чат', 'чат работает', 'демо-оплат', 'чат қалай'])) add('chat', 6);
    if (hasAnyPhrase(text, ['продавцы отправляют', 'отправить предложение', 'сатушылар ұсыныс', 'найти запросы'])) {
      add(input.userRole === 'buyer' ? 'seller_offer' : 'seller_board', 6);
    }
    if (hasAnyPhrase(text, ['аукцион', 'аукциондар', 'auction'])) add('auction', 5);
    if (hasAnyPhrase(text, ['заказ', 'тапсырыс', 'история заказ'])) add('orders', 5);
    if (hasAnyPhrase(text, ['gemini', 'openai api', 'api key', 'configure assistant', 'assistant api', 'smart assistant setup'])) add('assistant_setup', 5);

    if (hasAnyPhrase(text, ['catalog', 'showcase', 'product listing', 'my listings', 'cart', 'checkout', 'shop'])) add('catalog', 5);
    if (hasAnyPhrase(text, ['auction', 'auctions', 'bid', 'bidding', 'join auction'])) add('auction', 5);
    if (hasAnyPhrase(text, ['order history', 'my orders', 'tracking number', 'carrier', 'shipment', 'delivery status'])) add('orders', 5);

    if (hasAnyPhrase(text, ['create request', 'post request', 'publish request', 'new request', 'buyer request', 'my request', 'draft request'])) add('buyer_request', 5);
    if (hasAnyPhrase(text, ['accept offer', 'accept offers', 'compare offers', 'my requests', 'buyer offers', 'see offers', 'offer accepted'])) add('buyer_offers', 5);
    if (hasAnyPhrase(text, ['browse requests', 'buyer requests', 'request board', 'seller dashboard', 'find customer', 'find buyers'])) add('seller_board', 5);
    if (hasAnyPhrase(text, ['send offer', 'send offers', 'make offer', 'make offers', 'submit offer', 'submit offers', 'seller offer', 'seller offers', 'proposal', 'bid'])) add('seller_offer', 5);
    if (hasAnyPhrase(text, ['request', 'requests'])) add(input.userRole === 'seller' ? 'seller_board' : 'buyer_request', 2);
    if (hasAnyPhrase(text, ['offer', 'offers', 'price', 'timeframe'])) add(input.userRole === 'buyer' ? 'buyer_offers' : 'seller_offer', 2);
    if (hasAnyPhrase(text, ['message', 'messages', 'chat', 'conversation', 'unread'])) add('chat', 5);
    if (hasAnyPhrase(text, ['profile', 'avatar', 'preferences', 'seller profile', 'buyer preferences'])) add('profile', 5);
    if (hasAnyPhrase(text, ['notification', 'notifications', 'notify', 'alert', 'unread notification'])) add('notifications', 5);
    if (hasAnyPhrase(text, ['deploy', 'deployment', 'production', 'hosting', 'docker', 'build image', 'rebuild', 'vercel', 'render', 'railway', 'env'])) add('deployment', 5);
    if (hasAnyPhrase(text, ['login', 'log in', 'signup', 'sign up', 'register', 'password', 'email', 'email verification', 'forgot password'])) add('account', 5);
    if (hasAnyPhrase(text, ['admin', 'moderation', 'category', 'categories', 'users', 'block user'])) add('admin', 5);
    if (hasAnyPhrase(text, ['payment', 'demo payment', 'escrow', 'refund', 'invoice', 'real card', 'credit card'])) add('platform_limits', 6);
    if (hasAnyPhrase(text, ['order', 'orders']) && !hasAnyPhrase(text, ['admin orders', 'manage orders'])) add('orders', 4);

    if (input.userRole === 'buyer') {
      add('buyer_request', 0.4);
      add('buyer_offers', 0.4);
    } else if (input.userRole === 'seller') {
      add('seller_board', 0.4);
      add('seller_offer', 0.4);
    } else if (input.userRole === 'admin') {
      add('admin', 0.4);
    }

    const contextualIntent = this.detectContextIntent(input);
    const isFollowUp = this.isFollowUp(text);
    if (contextualIntent && isFollowUp) {
      add(contextualIntent, 3.5);
    }

    const faqTop = intelligentFaqAnalysis(
      input.message,
      input.userRole,
      this.normalizeLanguage(input.language)
    ).ranked[0];
    if (faqTop && faqTop.score >= 4) {
      add(this.faqIntentToChatbot(faqTop.entry.intent), faqTop.score);
    }

    const [bestIntent, bestScore] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['fallback', 0];
    if (bestScore >= 3) {
      return bestIntent;
    }

    return contextualIntent && isFollowUp ? contextualIntent : 'fallback';
  }

  private detectContextIntent(input: ChatbotMessageInput): ChatbotIntent | null {
    const recentItems = (input.history ?? [])
      .filter((item) => !(item.role === 'user' && normalizeText(item.content) === normalizeText(input.message)))
      .slice(-8)
      .reverse();

    for (const item of recentItems) {
      if (typeof item.intent === 'string') {
        const intent = this.normalizeIntent(item.intent, 'fallback');
        if (intent !== 'fallback' && intent !== 'greeting') {
          return intent;
        }
      }

      if (typeof item.suggestedRoute === 'string') {
        const intent = intentByRoute.get(item.suggestedRoute.trim());
        if (intent && intent !== 'fallback' && intent !== 'greeting') {
          return intent;
        }
      }
    }

    for (const item of recentItems.filter((historyItem) => historyItem.role === 'user')) {
      const intent = this.detectIntent({
        message: item.content,
        userRole: input.userRole,
        currentPath: input.currentPath,
        history: []
      });
      if (intent !== 'fallback' && intent !== 'greeting') {
        return intent;
      }
    }

    return null;
  }

  private describeConversationMemory(input: ChatbotMessageInput): string {
    const intent = this.detectContextIntent(input);
    if (!intent) {
      return '';
    }

    const route = this.routeForIntent(intent, input.userRole);
    const lastUsefulUserMessage = (input.history ?? [])
      .filter((item) => item.role === 'user' && normalizeText(item.content) !== normalizeText(input.message))
      .slice(-1)[0]?.content;

    return [
      'Conversation memory:',
      `Latest topic: ${intent}.`,
      route ? `Relevant route: ${route}.` : '',
      lastUsefulUserMessage ? `Previous user goal: ${lastUsefulUserMessage}` : ''
    ].filter(Boolean).join('\n');
  }

  private isFollowUp(text: string): boolean {
    return text.length < 90 && (
      hasAnyPhrase(text, ['how', 'where', 'why', 'what', 'when', 'then', 'next', 'this', 'that', 'it']) ||
      text.endsWith('?')
    );
  }

  private withContext(input: ChatbotMessageInput, intent: ChatbotIntent, reply: string): string {
    const role = input.userRole;

    if (role === 'buyer' && ['seller_board', 'seller_offer'].includes(intent)) {
      if (input.language === 'ru') {
        return `${reply} Ваша текущая роль — покупатель, поэтому для страниц продавца может понадобиться аккаунт продавца.`;
      }
      if (input.language === 'kk') {
        return `${reply} Қазіргі рөліңіз — сатып алушы, сондықтан сатушы беттері үшін сатушы аккаунты қажет болуы мүмкін.`;
      }
      return `${reply} Your current role is buyer, so you may need a seller account to use seller-only pages.`;
    }

    if (role === 'seller' && ['buyer_request', 'buyer_offers'].includes(intent)) {
      if (input.language === 'ru') {
        return `${reply} Ваша текущая роль — продавец, поэтому управление запросами покупателя может требовать аккаунт покупателя.`;
      }
      if (input.language === 'kk') {
        return `${reply} Қазіргі рөліңіз — сатушы, сондықтан сатып алушы сұраныстарын басқару үшін сатып алушы аккаунты қажет болуы мүмкін.`;
      }
      return `${reply} Your current role is seller, so buyer request management may require a buyer account.`;
    }

    if (intent === 'fallback') {
      const path = input.currentPath?.split('?')[0];
      if (path === '/chatbot' || path?.startsWith('/chatbot/')) {
        return reply;
      }
    }

    return reply;
  }
}

export default ChatbotService;
