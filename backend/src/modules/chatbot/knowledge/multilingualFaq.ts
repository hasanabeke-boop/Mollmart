import { MOLLMART_FAQ, type FaqEntry, type FaqMatch } from './mollmartFaq';

type Language = 'en' | 'ru' | 'kk';

/** Direct phrase → FAQ id (RU/KK chips and natural questions) */
const LOCALIZED_TRIGGERS: Array<{ faqId: string; ru: string[]; kk: string[]; en: string[] }> = [
  {
    faqId: 'buyer-create-request',
    en: ['how do i create a request', 'create and publish a buyer request', 'how to create a request'],
    ru: ['как создать запрос', 'создать запрос', 'как создать и опубликовать', 'опубликовать запрос', 'создать и опубликовать запрос'],
    kk: ['сұраныс жасау', 'сұранысты қалай жасаймын', 'сұраныс жасап жариялау']
  },
  {
    faqId: 'buyer-accept-offer',
    en: ['how do i accept', 'accept a seller offer', 'accept an offer'],
    ru: ['как принять предложение', 'принять предложение', 'принять предложение продавца'],
    kk: ['ұсынысты қабылдау', 'сатушы ұсынысын қабылдау']
  },
  {
    faqId: 'buyer-no-offers',
    en: ['no offers', 'why does my request have no offers'],
    ru: ['нет предложений', 'почему нет предложений', 'почему у моего запроса нет'],
    kk: ['ұсыныс жоқ', 'неге ұсыныс жоқ']
  },
  {
    faqId: 'seller-find-requests',
    en: ['how do sellers find', 'find buyer requests', 'how sellers send offers', 'how do sellers send offers'],
    ru: [
      'как продавцы отправляют предложения',
      'продавцы отправляют предложения',
      'как продавцам найти',
      'найти запросы покупателей',
      'заявки покупателей'
    ],
    kk: ['сатушылар ұсыныс жібереді', 'сатып алушы сұраныстарын табу', 'сатушылар сұраныстарын қалай табады']
  },
  {
    faqId: 'seller-strong-offer',
    en: ['strong seller offer', 'send a strong offer', 'how do i send a strong'],
    ru: ['сильное предложение', 'отправить предложение', 'как отправить предложение'],
    kk: ['күшті ұсыныс', 'ұсыныс жіберу']
  },
  {
    faqId: 'seller-one-offer',
    en: ['only one offer', 'two offers', 'send two offers'],
    ru: ['только одно предложение', 'два предложения', 'одно предложение на запрос'],
    kk: ['бір ұсыныс', 'екі ұсыныс жіберуге болмайды']
  },
  {
    faqId: 'chat-no-conversation',
    en: ['no conversations', 'no chat', 'why do i have no chat'],
    ru: ['нет диалогов', 'нет чата', 'почему нет чата', 'нет сообщений'],
    kk: ['диалог жоқ', 'чат жоқ', 'неге чат жоқ']
  },
  {
    faqId: 'chat-negotiate-pay',
    en: ['how does chat work', 'how do chat and demo payment', 'demo payment', 'how chat work'],
    ru: [
      'как работает чат',
      'чат и демо-оплата',
      'демо-оплата',
      'как работают чат',
      'переговоры в чате',
      'согласовать цену'
    ],
    kk: ['чат қалай жұмыс істейді', 'демо төлем', 'чат пен демо төлем']
  },
  {
    faqId: 'after-accept-offer',
    en: ['what happens after i accept', 'after accepting an offer', 'what happens after accept'],
    ru: ['что происходит после принятия', 'после принятия предложения', 'что дальше после'],
    kk: ['қабылдағаннан кейін не болады', 'ұсынысты қабылдағаннан кейін']
  },
  {
    faqId: 'orders-tracking',
    en: ['order history', 'where are orders', 'tracking'],
    ru: ['история заказов', 'где заказы', 'мои заказы', 'отслеживание'],
    kk: ['тапсырыс тарихы', 'тапсырыстар қайда']
  },
  {
    faqId: 'auction-reverse',
    en: ['reverse auction', 'how do auctions work', 'join auction'],
    ru: ['аукцион', 'обратные аукционы', 'как работают аукционы', 'присоединиться к аукциону'],
    kk: ['аукцион', 'кері аукцион', 'аукциондар қалай']
  },
  {
    faqId: 'catalog-showcase',
    en: ['catalog', 'showcase', 'cart checkout'],
    ru: ['каталог', 'витрина', 'корзина', 'оформить заказ'],
    kk: ['каталог', 'витрина', 'себет']
  },
  {
    faqId: 'workspace-toggle',
    en: ['switch buyer seller', 'buyer seller toggle', 'seller mode'],
    ru: ['переключить режим', 'режим продавца', 'режим покупателя', 'buyer seller'],
    kk: ['режим ауыстыру', 'сатушы режимі', 'сатып алушы режимі']
  },
  {
    faqId: 'register-login',
    en: ['register and log in', 'how do i register', 'sign up', 'log in'],
    ru: ['зарегистрироваться', 'как зарегистрироваться', 'войти', 'вход', 'логин'],
    kk: ['тіркелу', 'кіру', 'қалай тіркелемін']
  },
  {
    faqId: 'notifications',
    en: ['notifications', 'what do notifications cover'],
    ru: ['уведомления', 'какие уведомления', 'колокольчик'],
    kk: ['хабарландырулар', 'хабарландыру']
  },
  {
    faqId: 'admin-basics',
    en: ['what can admins do', 'admin panel', 'moderation'],
    ru: ['что может администратор', 'админка', 'модерация', 'админ'],
    kk: ['админ не істей алады', 'модерация', 'админ']
  },
  {
    faqId: 'platform-limits',
    en: ['real payment', 'credit card', 'escrow', 'refund'],
    ru: ['реальная оплата', 'карта', 'эскроу', 'возврат'],
    kk: ['нақты төлем', 'карта', 'escrow']
  }
];

function normalizeTrigger(text: string): string {
  return text
    .toLowerCase()
    .replace(/[?!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function triggersForLanguage(
  row: (typeof LOCALIZED_TRIGGERS)[number],
  language: Language
): string[] {
  if (language === 'ru') return [...row.ru, ...row.en];
  if (language === 'kk') return [...row.kk, ...row.en];
  return row.en;
}

/**
 * High-confidence FAQ match for localized UI strings and natural RU/KK/EN questions.
 */
export function matchLocalizedFaq(message: string, language: Language = 'en'): FaqMatch | null {
  const text = normalizeTrigger(message);
  if (!text) return null;

  let best: { faqId: string; score: number } | null = null;

  for (const row of LOCALIZED_TRIGGERS) {
    for (const trigger of triggersForLanguage(row, language)) {
      const normalizedTrigger = normalizeTrigger(trigger);
      if (!normalizedTrigger) continue;

      if (text === normalizedTrigger) {
        const score = 10;
        if (!best || score > best.score) best = { faqId: row.faqId, score };
        continue;
      }

      if (text.includes(normalizedTrigger) || normalizedTrigger.includes(text)) {
        const score = normalizedTrigger.length >= 12 ? 8 : 6;
        if (!best || score > best.score) best = { faqId: row.faqId, score };
      }
    }
  }

  if (!best || best.score < 6) return null;

  const entry = MOLLMART_FAQ.find((e) => e.id === best!.faqId);
  if (!entry) return null;

  return { entry, score: best.score };
}

export function findFaqById(id: string): FaqEntry | undefined {
  return MOLLMART_FAQ.find((e) => e.id === id);
}
