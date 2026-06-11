import type { Language } from "@/lib/i18n";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

const termsEn: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "June 2026",
  intro:
    "These Terms of Service (“Terms”) govern your access to and use of Mollmart, a demand-first marketplace prototype developed as an educational diploma project. By creating an account or using the platform, you agree to these Terms.",
  sections: [
    {
      title: "1. About Mollmart",
      paragraphs: [
        "Mollmart connects buyers who publish requests with sellers who submit offers, negotiate in chat, and fulfill catalog or request-based orders. The platform may include demo payment flows, order tracking, reverse auctions, and admin moderation tools.",
        "Mollmart is provided for learning and demonstration purposes. It is not a licensed financial institution, escrow provider, or commercial marketplace operator unless explicitly stated otherwise in writing.",
      ],
    },
    {
      title: "2. Eligibility and accounts",
      paragraphs: [
        "You must provide accurate registration information and keep your credentials secure. You are responsible for activity under your account.",
        "You may use buyer mode, seller mode, or both where available. Switching workspace modes does not create a separate legal entity — one account remains tied to you.",
        "We may suspend or terminate accounts that violate these Terms, abuse other users, or attempt to compromise platform security.",
      ],
    },
    {
      title: "3. Buyer and seller conduct",
      paragraphs: [
        "Buyers may publish requests, browse the catalog, place orders, and communicate with sellers through in-platform chat. Sellers may list products, respond to requests, join auctions where enabled, and update order fulfillment status.",
        "You agree not to post unlawful, misleading, harassing, or infringing content; not to circumvent platform fees or moderation; and not to use automated scraping or abuse that degrades service for others.",
        "Prices, delivery, and payment arrangements between buyers and sellers are negotiated or displayed on the platform. Unless a separate binding agreement exists, Mollmart does not guarantee transaction outcomes.",
      ],
    },
    {
      title: "4. Orders, payments, and cancellations",
      paragraphs: [
        "Catalog checkout and request-deal orders follow the status workflow shown in the product (created, in progress, awaiting confirmation, completed, or cancelled).",
        "Payment features may operate in demo mode. Do not treat demo balances or payment confirmations as real funds unless production payment integration is explicitly enabled.",
        "Order cancellation may require admin review. Sellers and buyers should communicate through chat before disputing a deal.",
      ],
    },
    {
      title: "5. Content and intellectual property",
      paragraphs: [
        "You retain ownership of content you submit (requests, listings, messages, images). You grant Mollmart a limited license to host, display, and process that content solely to operate the service.",
        "Mollmart branding, software, and UI remain the property of the project authors. Do not copy or redistribute platform code or assets except as permitted by the project license.",
      ],
    },
    {
      title: "6. Disclaimers and liability",
      paragraphs: [
        "The service is provided “as is” without warranties of uninterrupted availability, accuracy of listings, or fitness for a particular purpose.",
        "To the fullest extent permitted by law, Mollmart and its contributors are not liable for indirect, incidental, or consequential damages arising from use of the platform or from deals between users.",
      ],
    },
    {
      title: "7. Changes and contact",
      paragraphs: [
        "We may update these Terms as the prototype evolves. Continued use after changes constitutes acceptance of the revised Terms.",
        "Questions about these Terms can be sent through the Help Center or project contact channels listed on the site.",
      ],
    },
  ],
};

const termsRu: LegalDocument = {
  title: "Условия использования сервиса",
  lastUpdated: "июнь 2026",
  intro:
    "Настоящие Условия использования («Условия») регулируют доступ к Mollmart и использование платформы — маркетплейса «сначала спрос», созданного как учебный дипломный проект. Регистрируясь или пользуясь сервисом, вы соглашаетесь с этими Условиями.",
  sections: [
    {
      title: "1. О сервисе Mollmart",
      paragraphs: [
        "Mollmart связывает покупателей, публикующих заявки, с продавцами, которые отправляют офферы, ведут переговоры в чате и выполняют заказы из каталога или по сделкам.",
        "Платформа предназначена для обучения и демонстрации. Это не лицензированный финансовый институт, escrow-сервис или коммерческий маркетплейс, если иное не указано письменно.",
      ],
    },
    {
      title: "2. Регистрация и аккаунт",
      paragraphs: [
        "Вы обязуетесь указывать достоверные данные и хранить пароль в безопасности. Ответственность за действия в аккаунте несёте вы.",
        "Доступны режимы покупателя и продавца (или оба). Переключение режима не создаёт отдельный аккаунт.",
        "Мы можем ограничить или удалить аккаунт при нарушении Условий, злоупотреблениях или попытках взлома.",
      ],
    },
    {
      title: "3. Поведение покупателей и продавцов",
      paragraphs: [
        "Покупатели могут публиковать заявки, пользоваться каталогом, оформлять заказы и общаться в чате. Продавцы — размещать товары, откликаться на заявки, участвовать в аукционах и обновлять статусы заказов.",
        "Запрещены незаконный, вводящий в заблуждение, оскорбительный контент, обход модерации и автоматизированный сбор данных, мешающий работе сервиса.",
        "Цены, доставка и оплата согласуются между сторонами на платформе. Mollmart не гарантирует результат сделки, если нет отдельного договора.",
      ],
    },
    {
      title: "4. Заказы, оплата и отмена",
      paragraphs: [
        "Заказы проходят статусы, указанные в интерфейсе: создан, в работе, ожидает подтверждения, завершён или отменён.",
        "Оплата может работать в демо-режиме. Не считайте демо-баланс реальными деньгами без явного включения боевой интеграции.",
        "Отмена заказа может требовать решения администратора. Споры сначала обсуждайте в чате.",
      ],
    },
    {
      title: "5. Контент и права",
      paragraphs: [
        "Вы сохраняете права на свой контент (заявки, товары, сообщения, изображения) и даёте Mollmart ограниченную лицензию на хранение и показ для работы сервиса.",
        "Бренд, код и интерфейс Mollmart принадлежат авторам проекта.",
      ],
    },
    {
      title: "6. Ограничение ответственности",
      paragraphs: [
        "Сервис предоставляется «как есть», без гарантий бесперебойной работы или точности объявлений.",
        "В пределах, допустимых законом, авторы проекта не несут ответственности за косвенный ущерб от использования платформы или сделок между пользователями.",
      ],
    },
    {
      title: "7. Изменения и связь",
      paragraphs: [
        "Условия могут обновляться по мере развития прототипа. Продолжение использования означает согласие с новой редакцией.",
        "Вопросы можно направлять через раздел помощи или контакты проекта на сайте.",
      ],
    },
  ],
};

const termsKk: LegalDocument = {
  title: "Қызмет көрсету шарттары",
  lastUpdated: "2026 маусым",
  intro:
    "Бұл Қызмет көрсету шарттары («Шарттар») Mollmart платформасына — оқу диплом жобасы ретінде жасалған «алдымен сұраныс» маркетплейсіне — кіру мен пайдалануды реттейді. Тіркелу немесе платформаны қолдану арқылы сіз осы Шарттармен келісесіз.",
  sections: [
    {
      title: "1. Mollmart туралы",
      paragraphs: [
        "Mollmart сұрау жариялайтын сатып алушылар мен ұсыныс жіберетін, чатта келісетін сатушыларды байланыстырады.",
        "Платформа оқу және демонстрация мақсатында. Бұл лицензияланған қаржы институты немесе коммерциялық маркетплейс емес.",
      ],
    },
    {
      title: "2. Тіркелу және аккаунт",
      paragraphs: [
        "Дұрыс деректерді көрсету және парольді қорғау міндетті. Аккаунттағы әрекеттерге сіз жауаптысыз.",
        "Сатып алушы, сатушы немесе екі режим де қолжетімді. Режим ауыстыру жеке аккаунт жасамайды.",
        "Шарттарды бұзу немесе қауіпсіздікке шабуыл жасау аккаунтты шектеуге әкелуі мүмкін.",
      ],
    },
    {
      title: "3. Мінез-құлық",
      paragraphs: [
        "Сатып алушылар сұрау жариялап, каталогпен тапсырыс бере алады. Сатушылар тауар қойып, сұрауға жауап береді.",
        "Заңсыз, адасымшақ немесе қорлайтын контент, модерацияны айналып өту және автоматты scraping тыйым салынады.",
        "Баға мен жеткізу тараптар арасында келісіледі. Mollmart мәміле нәтижесіне кепілдік бермейді.",
      ],
    },
    {
      title: "4. Тапсырыс, төлем, болдыру",
      paragraphs: [
        "Тапсырыстар интерфейсте көрсетілген күйлерден өтеді.",
        "Төлем демо режимде болуы мүмкін. Демо балансты нақты ақша деп есептемеңіз.",
        "Тапсырысты болдыру үшін әкімнің шешімі қажет болуы мүмкін.",
      ],
    },
    {
      title: "5. Контент және құқықтар",
      paragraphs: [
        "Контентке құқығыңыз сақталады; Mollmart-қа оны қызмет көрсету үшін шектеулі лицензия беріледі.",
        "Mollmart бренді мен коды жоба авторларына тиесілі.",
      ],
    },
    {
      title: "6. Жауапкершілікті шектеу",
      paragraphs: [
        "Қызмет «қалай болса, солай» ұсынылады.",
        "Заң рұqsat етілген шектеуде авторлар жанама зиян үшін жауапты емес.",
      ],
    },
    {
      title: "7. Өзгерістер",
      paragraphs: [
        "Шарттар жаңартылуы мүмкін. Платформаны әрі қарай қолдану — жаңа редакциямен келісу.",
        "Сұрақтар Help Center арқылы жіберілуі мүмкін.",
      ],
    },
  ],
};

const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "June 2026",
  intro:
    "This Privacy Policy explains how Mollmart collects, uses, and protects personal information when you use our educational marketplace prototype.",
  sections: [
    {
      title: "1. Information we collect",
      paragraphs: [
        "Account data: name, email, password (stored hashed), role (buyer/seller), and profile details you choose to provide.",
        "Activity data: requests, listings, offers, chat messages, orders, auction participation, and moderation flags related to your account.",
        "Technical data: session tokens, approximate usage logs, and browser/device information needed to secure and operate the service.",
      ],
    },
    {
      title: "2. How we use information",
      paragraphs: [
        "To authenticate you, deliver notifications (in-app and email when configured), match buyers with sellers, and display your workspace history.",
        "To prevent abuse, enforce moderation decisions, and improve platform reliability during development.",
        "We do not sell personal data to third-party advertisers.",
      ],
    },
    {
      title: "3. Sharing and disclosure",
      paragraphs: [
        "Other users see information needed for marketplace function — for example, your display name on offers, messages, and order records shared with counterparty buyers or sellers.",
        "Administrators may access data to moderate content, resolve disputes, and maintain security.",
        "We may disclose information if required by law or to protect users and the integrity of the service.",
      ],
    },
    {
      title: "4. Cookies and local storage",
      paragraphs: [
        "We use cookies and local storage for authentication sessions, language preference, theme selection, and workspace mode.",
        "You can clear browser storage, but some features will require signing in again.",
      ],
    },
    {
      title: "5. Data retention and deletion",
      paragraphs: [
        "We retain account and transaction records while your account is active and as needed for the prototype’s audit and learning objectives.",
        "You may request account deletion from profile settings where available. Deletion removes your account, profile, and associated user-generated content according to platform rules.",
      ],
    },
    {
      title: "6. Security",
      paragraphs: [
        "We apply industry-standard practices such as hashed passwords, HTTPS in production, and access controls. No online service can guarantee absolute security.",
        "Report suspected unauthorized access through the Help Center.",
      ],
    },
    {
      title: "7. Your rights and updates",
      paragraphs: [
        "Depending on your jurisdiction, you may request access, correction, or deletion of personal data by contacting project administrators.",
        "We may update this Privacy Policy as features change. The “Last updated” date at the top reflects the latest revision.",
      ],
    },
  ],
};

const privacyRu: LegalDocument = {
  title: "Политика конфиденциальности",
  lastUpdated: "июнь 2026",
  intro:
    "Настоящая Политика конфиденциальности описывает, как Mollmart собирает, использует и защищает персональные данные при использовании учебного прототипа маркетплейса.",
  sections: [
    {
      title: "1. Какие данные мы собираем",
      paragraphs: [
        "Данные аккаунта: имя, email, пароль (в хешированном виде), роль (покупатель/продавец) и данные профиля.",
        "Данные активности: заявки, товары, офферы, сообщения чата, заказы, участие в аукционах и записи модерации.",
        "Технические данные: токены сессии, журналы использования и сведения браузера/устройства для безопасности сервиса.",
      ],
    },
    {
      title: "2. Как мы используем данные",
      paragraphs: [
        "Для входа, уведомлений (в приложении и по email при настройке), сопоставления покупателей и продавцов, отображения истории.",
        "Для предотвращения злоупотреблений, модерации и улучшения стабильности платформы.",
        "Мы не продаём персональные данные рекламодателям.",
      ],
    },
    {
      title: "3. Передача данных",
      paragraphs: [
        "Другие пользователи видят информацию, необходимую для работы маркетплейса — имя в офферах, чате и заказах с контрагентом.",
        "Администраторы могут просматривать данные для модерации и безопасности.",
        "Раскрытие возможно по требованию закона или для защиты пользователей.",
      ],
    },
    {
      title: "4. Cookies и локальное хранилище",
      paragraphs: [
        "Используются для сессии, языка, темы оформления и режима workspace.",
        "Очистка хранилища браузера потребует повторного входа.",
      ],
    },
    {
      title: "5. Хранение и удаление",
      paragraphs: [
        "Данные хранятся, пока аккаунт активен и для целей учебного проекта.",
        "Удаление аккаунта доступно в настройках профиля — удаляются аккаунт и связанный пользовательский контент по правилам платформы.",
      ],
    },
    {
      title: "6. Безопасность",
      paragraphs: [
        "Применяются хеширование паролей, HTTPS в production и контроль доступа. Абсолютная безопасность не гарантируется.",
        "О подозрительном доступе сообщайте через раздел помощи.",
      ],
    },
    {
      title: "7. Ваши права и изменения",
      paragraphs: [
        "Вы можете запросить доступ, исправление или удаление данных у администраторов проекта.",
        "Политика может обновляться — дата «Последнее обновление» указана выше.",
      ],
    },
  ],
};

const privacyKk: LegalDocument = {
  title: "Құпиялылық саясаты",
  lastUpdated: "2026 маусым",
  intro:
    "Бұл Құпиялылық саясаты Mollmart оқу прототипін пайдаланғанда жеке деректерді қалай жинайтынын, қолданатынын және қорғайтынын түсіндіреді.",
  sections: [
    {
      title: "1. Жиналатын деректер",
      paragraphs: [
        "Аккаунт: аты, email, пароль (хеш), рөл (сатып алушы/сатушы), профиль мәліметтері.",
        "Белсенділік: сұраулар, тауарлар, ұсыныстар, чат, тапсырыстар, аукцион.",
        "Техникалық: сессия токендері, журналдар, браузер/құрылғы деректері.",
      ],
    },
    {
      title: "2. Пайдалану мақсаты",
      paragraphs: [
        "Кіру, хабарландыру, сатып алушы мен сатушыны сәйкестендіру, тарихты көрсету.",
        "Злоупотребление мен модерацияны болдырмау.",
        "Жеке деректерді жарнамаға сатпаймыз.",
      ],
    },
    {
      title: "3. Бөлісу",
      paragraphs: [
        "Басқа пайдаланушылар маркетплейс функциясы үшін қажет ақпаратты көреді.",
        "Әкімшілер модерация үшін дерекке қол жеткізе алады.",
        "Заң талабы бойынша ашу мүмкін.",
      ],
    },
    {
      title: "4. Cookies",
      paragraphs: [
        "Сессия, тіл, тема және workspace режимі үшін.",
        "Тазалағаннан кейін қайта кіру керек.",
      ],
    },
    {
      title: "5. Сақтау және жою",
      paragraphs: [
        "Аккаунт белсенді болғанша сақталады.",
        "Профиль параметрлерінен аккаунтты жоюға болады.",
      ],
    },
    {
      title: "6. Қауіпсіздік",
      paragraphs: [
        "Пароль хеші, HTTPS, рұqsatтар.",
        "Күмәнді кіру туралы Help Center-ге хабарлаңыз.",
      ],
    },
    {
      title: "7. Құқықтар",
      paragraphs: [
        "Дерекке қол жеткізу немесе жоюды әкімшіден сұрауға болады.",
        "Саясат жаңартылуы мүмкін.",
      ],
    },
  ],
};

const termsByLang: Record<Language, LegalDocument> = {
  en: termsEn,
  ru: termsRu,
  kk: termsKk,
};

const privacyByLang: Record<Language, LegalDocument> = {
  en: privacyEn,
  ru: privacyRu,
  kk: privacyKk,
};

export function getTermsDocument(language: Language): LegalDocument {
  return termsByLang[language] ?? termsEn;
}

export function getPrivacyDocument(language: Language): LegalDocument {
  return privacyByLang[language] ?? privacyEn;
}

export const legalUiLabels: Record<
  Language,
  { lastUpdated: string; backHome: string; helpCenter: string }
> = {
  en: {
    lastUpdated: "Last updated",
    backHome: "Back to home",
    helpCenter: "Help Center",
  },
  ru: {
    lastUpdated: "Последнее обновление",
    backHome: "На главную",
    helpCenter: "Центр помощи",
  },
  kk: {
    lastUpdated: "Соңғы жаңарту",
    backHome: "Басты бетке",
    helpCenter: "Көмек орталығы",
  },
};
