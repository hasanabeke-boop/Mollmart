import { ChatbotMessageInput, ChatbotReply } from '../types/chatbot';
import config from '../../../config/config';
import logger from '../../../middleware/logger';

type ChatbotIntent =
  | 'greeting'
  | 'buyer_request'
  | 'buyer_offers'
  | 'seller_board'
  | 'seller_offer'
  | 'chat'
  | 'profile'
  | 'notifications'
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
  '/chatbot',
  '/notifications',
  '/seller/dashboard',
  '/seller/analytics',
  '/help',
  '/admin',
  '/admin/categories',
  '/admin/moderation',
  '/admin/users'
]);

const defaultSuggestions = [
  'How do I create a request?',
  'How do sellers send offers?',
  'How does chat work?'
];

const routeByIntent: Partial<Record<ChatbotIntent, string>> = {
  buyer_request: '/create-product-request',
  buyer_offers: '/my-requests',
  seller_board: '/browse-buyer-requests',
  seller_offer: '/browse-buyer-requests',
  chat: '/chat',
  profile: '/profile',
  notifications: '/notifications',
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
  chat: ['Accept an offer first', 'Open Messages', 'Continue details directly with the other user'],
  profile: ['Open Profile', 'Update base details', 'Save changes'],
  notifications: ['Open Notifications', 'Review unread items', 'Open the linked request or chat'],
  deployment: ['Set production environment variables', 'Run Prisma migrations', 'Build frontend and backend images/services'],
  account: ['Check email and password', 'Confirm account status', 'Check email verification setting'],
  admin: ['Open Admin', 'Review users/categories/moderation', 'Apply changes carefully'],
  platform_limits: ['Use chat for final details', 'Handle payment or delivery outside Mollmart', 'Add unsupported features only when you build them'],
  assistant_setup: ['Set OPENAI_API_KEY', 'Choose OPENAI_MODEL', 'Restart/rebuild backend']
};

const responses: Record<ChatbotIntent, Omit<ChatbotReply, 'intent' | 'source' | 'suggestedRoute' | 'actions' | 'confidence'>> = {
  greeting: {
    reply: 'I can guide buyers, sellers, and admins through Mollmart requests, offers, accepted-offer chat, profiles, notifications, admin tools, and deployment.',
    suggestions: defaultSuggestions
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
    reply: 'Messages are created after a buyer accepts a seller offer. If the chat page is empty, first check whether an offer has been accepted for that request.',
    suggestions: ['Why do I have no conversations?', 'How do unread messages work?', 'Where is chat?']
  },
  profile: {
    reply: 'Profile is where users complete account details. Sellers should keep seller information clear so buyers trust their offers; buyers can use preferences to shape future requests.',
    suggestions: ['How do I edit profile?', 'What should seller profile include?', 'Where are preferences?']
  },
  notifications: {
    reply: 'Notifications surface important events such as new offers, accepted offers, messages, moderation changes, and account status updates.',
    suggestions: ['Where are notifications?', 'Why no notification appears?', 'How do message notifications work?']
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
    reply: 'Admin screens are for user management, categories, and moderation. Keep admin actions separate from buyer and seller workflows so normal users only see their role-specific screens.',
    suggestions: ['How do I manage categories?', 'How does moderation work?', 'Where are users?']
  },
  platform_limits: {
    reply: 'Mollmart currently matches buyers and sellers, collects offers, and opens chat after acceptance. It does not provide checkout, escrow, in-app payment, shipping labels, or delivery tracking yet.',
    suggestions: ['What happens after accepting an offer?', 'Can we add payments later?', 'How does chat work?']
  },
  assistant_setup: {
    reply: 'The assistant uses OPENAI_API_KEY and OPENAI_MODEL on the backend. If the key is missing or the API fails, it falls back to local Mollmart guidance.',
    suggestions: ['Where do I put the API key?', 'Which model should I use?', 'How do I rebuild Docker?']
  },
  fallback: {
    reply: 'I can help with Mollmart flows: buyer requests, seller offers, accepted-offer chat, profiles, notifications, login, admin, and deployment. Tell me which screen or problem you mean.',
    suggestions: defaultSuggestions
  }
};

const chatbotTranslations: Record<Exclude<ChatbotLanguage, 'en'>, Record<string, string>> = {
  ru: {
    'How do I create a request?': 'Как создать запрос?',
    'How do sellers send offers?': 'Как продавцы отправляют предложения?',
    'How does chat work?': 'Как работает чат?',
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
    'Can we add payments later?': 'Можно ли добавить платежи позже?',
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
    'Handle payment or delivery outside Mollmart': 'Оплату или доставку оформляйте вне Mollmart',
    'Add unsupported features only when you build them': 'Добавляйте неподдерживаемые функции только после реализации',
    'Set OPENAI_API_KEY': 'Установите OPENAI_API_KEY',
    'Choose OPENAI_MODEL': 'Выберите OPENAI_MODEL',
    'Restart/rebuild backend': 'Перезапустите или пересоберите backend'
  },
  kk: {
    'How do I create a request?': 'Сұранысты қалай жасаймын?',
    'How do sellers send offers?': 'Сатушылар ұсынысты қалай жібереді?',
    'How does chat work?': 'Чат қалай жұмыс істейді?',
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
    'Can we add payments later?': 'Төлемдерді кейін қосуға бола ма?',
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
    'Handle payment or delivery outside Mollmart': 'Төлем немесе жеткізуді Mollmart-тан тыс орындаңыз',
    'Add unsupported features only when you build them': 'Қолдау жоқ функцияларды іске асырғаннан кейін ғана қосыңыз',
    'Set OPENAI_API_KEY': 'OPENAI_API_KEY орнатыңыз',
    'Choose OPENAI_MODEL': 'OPENAI_MODEL таңдаңыз',
    'Restart/rebuild backend': 'Backend-ті қайта іске қосыңыз немесе қайта жинаңыз'
  }
};

const localizedReplies: Record<Exclude<ChatbotLanguage, 'en'>, Record<ChatbotIntent, string>> = {
  ru: {
    greeting: 'Я помогу покупателям, продавцам и администраторам с запросами Mollmart, предложениями, чатом после принятия предложения, профилями, уведомлениями, админ-инструментами и деплоем.',
    buyer_request: 'Процесс покупателя: создайте запрос с понятным названием, категорией, бюджетом, сроком/локацией при необходимости и полезными деталями. Сначала он сохраняется как черновик; опубликуйте его в Моих запросах, когда будете готовы получать предложения продавцов.',
    buyer_offers: 'Чтобы управлять предложениями, откройте Мои запросы, выберите опубликованный запрос и сравните предложения продавцов. Принятие предложения открывает диалог в Сообщениях.',
    seller_board: 'Процесс продавца: откройте Запросы покупателей, найдите или отфильтруйте активные запросы, затем откройте подходящий и отправьте предложение. Покупатель увидит его под своим запросом.',
    seller_offer: 'Сильное предложение продавца содержит реалистичную цену в валюте запроса, срок выполнения и короткое сообщение о том, что вы можете предоставить.',
    chat: 'Сообщения создаются после того, как покупатель принимает предложение продавца. Если чат пустой, сначала проверьте, принято ли предложение для этого запроса.',
    profile: 'Профиль нужен для заполнения данных аккаунта. Продавцам важно держать информацию понятной, а покупатели могут использовать предпочтения для будущих запросов.',
    notifications: 'Уведомления показывают важные события: новые предложения, принятые предложения, сообщения, изменения модерации и статус аккаунта.',
    deployment: 'Минимальный деплой требует production env значения, PostgreSQL, backend hosting, frontend hosting, миграции Prisma и безопасные JWT/OpenAI/SMTP секреты. Redis обычно можно сделать опциональным.',
    account: 'Для проблем с аккаунтом проверьте email/пароль, статус аккаунта, необходимость email-подтверждения, JWT secrets и подключение к базе данных backend.',
    admin: 'Админ-экраны нужны для управления пользователями, категориями и модерацией. Админ-действия должны быть отделены от обычных buyer/seller сценариев.',
    platform_limits: 'Mollmart сейчас связывает покупателей и продавцов, собирает предложения и открывает чат после принятия. Checkout, escrow, shipping labels и доставка пока не являются частью платформы.',
    assistant_setup: 'Помощник использует OPENAI_API_KEY и OPENAI_MODEL на backend. Если ключ отсутствует или API падает, включается локальная справка Mollmart.',
    fallback: 'Я могу помочь с процессами Mollmart: запросы покупателей, предложения продавцов, чат после принятия, профили, уведомления, вход, админка и деплой. Уточните, что вы хотите сделать на этом экране.'
  },
  kk: {
    greeting: 'Мен сатып алушыларға, сатушыларға және админдерге Mollmart сұраныстары, ұсыныстар, қабылданған ұсыныстан кейінгі чат, профильдер, хабарландырулар, админ құралдары және деплой бойынша көмектесемін.',
    buyer_request: 'Сатып алушы процесі: анық атауы, санаты, бюджеті, қажет болса мерзімі/орны және пайдалы мәліметтері бар сұраныс жасаңыз. Ол алдымен черновик болады; ұсыныстар алуға дайын кезде Менің сұраныстарымнан жариялаңыз.',
    buyer_offers: 'Ұсыныстарды басқару үшін Менің сұраныстарымды ашып, жарияланған сұранысты таңдаңыз да, сатушылар ұсыныстарын салыстырыңыз. Ұсынысты қабылдау Хабарламаларда диалог ашады.',
    seller_board: 'Сатушы процесі: Сатып алушы сұраныстарын ашып, белсенді сұраныстарды іздеңіз немесе сүзгіден өткізіңіз, сәйкес сұранысты ашып ұсыныс жіберіңіз.',
    seller_offer: 'Жақсы сатушы ұсынысында сұраныс валютасындағы нақты баға, орындау мерзімі және не ұсына алатыныңыз туралы қысқа хабарлама болады.',
    chat: 'Хабарламалар сатып алушы сатушы ұсынысын қабылдағаннан кейін жасалады. Чат бос болса, алдымен сол сұраныста ұсыныс қабылданғанын тексеріңіз.',
    profile: 'Профиль аккаунт деректерін толтыруға арналған. Сатушылар ақпаратты түсінікті ұстауы керек, ал сатып алушылар болашақ сұраныстар үшін қалауларды қолдана алады.',
    notifications: 'Хабарландырулар жаңа ұсыныстар, қабылданған ұсыныстар, хабарлар, модерация өзгерістері және аккаунт күйі сияқты маңызды оқиғаларды көрсетеді.',
    deployment: 'Минималды деплой үшін production env мәндері, PostgreSQL, backend hosting, frontend hosting, Prisma миграциялары және қауіпсіз JWT/OpenAI/SMTP құпиялары керек. Redis көбіне опционалды бола алады.',
    account: 'Аккаунт мәселелері үшін email/құпиясөзді, аккаунт күйін, email растау талабын, JWT secrets және backend дерекқор қосылымын тексеріңіз.',
    admin: 'Админ экрандары пайдаланушыларды, санаттарды және модерацияны басқаруға арналған. Админ әрекеттері buyer/seller сценарийлерінен бөлек болуы керек.',
    platform_limits: 'Mollmart қазір сатып алушылар мен сатушыларды сәйкестендіреді, ұсыныстар жинайды және қабылдаудан кейін чат ашады. Checkout, escrow, shipping labels және жеткізу әзірге платформа бөлігі емес.',
    assistant_setup: 'Көмекші backend жағында OPENAI_API_KEY және OPENAI_MODEL қолданады. Кілт жоқ болса немесе API істемесе, локал Mollmart анықтамасы қосылады.',
    fallback: 'Мен Mollmart процестерімен көмектесе аламын: сатып алушы сұраныстары, сатушы ұсыныстары, қабылдаудан кейінгі чат, профильдер, хабарландырулар, кіру, админ және деплой. Осы экранда не істегіңіз келетінін нақтылаңыз.'
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

function normalizeText(message: string): string {
  return message.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hasPhrase(text: string, phrase: string): boolean {
  return new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
}

function hasAnyPhrase(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => hasPhrase(text, phrase));
}

export class ChatbotService {
  async createReply(input: ChatbotMessageInput): Promise<ChatbotReply> {
    if (config.openai.apiKey.trim().length > 0) {
      try {
        return await this.createOpenAIReply(input);
      } catch (error) {
        logger.warn(`OpenAI chatbot fallback used: ${(error as Error).message}`);
      }
    }

    return this.createLocalReply(input);
  }

  private createLocalReply(input: ChatbotMessageInput): ChatbotReply {
    const intent = this.detectIntent(input);
    const response = responses[intent];
    const language = this.normalizeLanguage(input.language);
    const reply = language === 'en' ? response.reply : localizedReplies[language][intent];

    return {
      intent,
      reply: this.withContext(input, intent, reply),
      suggestions: this.translateList(response.suggestions, language),
      source: 'local',
      suggestedRoute: this.routeForIntent(intent, input.userRole),
      actions: this.translateList(actionsByIntent[intent] ?? [], language),
      confidence: intent === 'fallback' ? 0.42 : 0.78
    };
  }

  private async createOpenAIReply(input: ChatbotMessageInput): Promise<ChatbotReply> {
    const intent = this.detectIntent(input);
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

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.openai.model,
        instructions: this.buildSystemPrompt(input),
        input: [
          recentHistory ? `Recent conversation:\n${recentHistory}` : '',
          this.describeConversationMemory(input),
          `Current path: ${input.currentPath || 'unknown'}`,
          `Current user role: ${input.userRole || 'guest'}`,
          `Detected intent hint: ${intent}`,
          `Current user message: ${input.message}`
        ].filter(Boolean).join('\n\n'),
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
    const normalizedIntent = this.normalizeIntent(parsed.intent, intent);

    return {
      ...parsed,
      intent: normalizedIntent,
      reply: this.limitReply(parsed.reply),
      suggestions: this.normalizeStringList(parsed.suggestions, responses[normalizedIntent].suggestions, 4),
      actions: this.normalizeStringList(parsed.actions, actionsByIntent[normalizedIntent] ?? [], 4),
      suggestedRoute: this.normalizeRoute(parsed.suggestedRoute, normalizedIntent, input.userRole),
      confidence: this.normalizeConfidence(parsed.confidence),
      source: 'openai'
    };
  }

  private buildSystemPrompt(input: ChatbotMessageInput): string {
    return [
      'You are Mollmart Assistant, a smart support chatbot inside the Mollmart marketplace app.',
      'Mollmart is not a checkout store. Correct flow: buyers publish product/service requests; sellers browse buyer requests and submit offers; when a buyer accepts an offer, a buyer-seller conversation opens in Messages.',
      'Use the current role and path when helpful. If role is buyer, prefer buyer actions. If role is seller, prefer seller board/dashboard actions. If role is admin, mention admin routes only when relevant.',
      'Use conversation memory logically: if the user asks a short follow-up such as "where", "how", "why", "next", "what about that", or "show me", keep answering about the latest remembered Mollmart topic unless the new message clearly changes topic.',
      `Current role available to you: ${input.userRole || 'guest'}. Current path: ${input.currentPath || 'unknown'}.`,
      `Reply language: ${this.languageName(this.normalizeLanguage(input.language))}. Return reply, suggestions, and actions in that language.`,
      'Allowed routes only: /register, /login, /profile, /create-product-request, /my-requests, /browse-buyer-requests, /chat, /chatbot, /notifications, /seller/dashboard, /seller/analytics, /help, /admin, /admin/categories, /admin/moderation, /admin/users.',
      'Do not invent checkout, payment, escrow, shipping labels, delivery tracking, file uploads for requests, realtime websocket features, or unsupported social login. If asked, explain they are not currently part of Mollmart.',
      'For deployment: mention production env, secure secrets, PostgreSQL, Prisma migrations, frontend/backend build, Docker rebuild, CORS/SERVER_URL, and optional Redis when relevant.',
      'For API assistant setup: mention OPENAI_API_KEY and OPENAI_MODEL in backend env, and that local fallback works without a key.',
      'Be logical: answer the question first, then give 2-4 concrete next actions. If the request is vague, ask one direct clarifying question and still give the safest next step.',
      'Return only JSON matching the schema. Keep reply under 900 characters. suggestions and actions should be short UI labels.'
    ].join('\n');
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

    if (hasAnyPhrase(text, ['hello', 'hey', 'hi']) && text.split(' ').length <= 5) add('greeting', 5);
    if (hasAnyPhrase(text, ['assistant', 'bot', 'chatbot'])) add('assistant_setup', 3);

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
    if (hasAnyPhrase(text, ['payment', 'checkout', 'cart', 'shipping', 'delivery tracking', 'escrow', 'refund', 'invoice'])) add('platform_limits', 6);
    if (hasAnyPhrase(text, ['openai', 'api key', 'model', 'smart assistant', 'ai assistant'])) add('assistant_setup', 5);

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
      if (input.language === 'ru') {
        return input.currentPath
          ? `${reply} Сейчас вы на ${input.currentPath}; скажите, что хотите сделать на этом экране.`
          : reply;
      }
      if (input.language === 'kk') {
        return input.currentPath
          ? `${reply} Қазір сіз ${input.currentPath} бетінде тұрсыз; осы экранда не істегіңіз келетінін айтыңыз.`
          : reply;
      }
      return input.currentPath
        ? `${reply} You are currently on ${input.currentPath}; tell me what you are trying to do from this screen.`
        : reply;
    }

    return reply;
  }
}

export default ChatbotService;
