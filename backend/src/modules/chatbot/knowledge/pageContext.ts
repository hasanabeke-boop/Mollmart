import type { FaqIntent } from './mollmartFaq';

export type PageContext = {
  path: string;
  screen: string;
  purpose: string;
  primaryIntent: FaqIntent;
  route: string;
  tips: {
    en: string;
    ru: string;
    kk: string;
  };
  nextSteps: {
    en: string[];
    ru: string[];
    kk: string[];
  };
};

const PAGE_RULES: Array<{
  match: (path: string) => boolean;
  ctx: Omit<PageContext, 'path'>;
}> = [
  {
    match: (p) => p === '/my-requests' || p.startsWith('/my-requests/'),
    ctx: {
      screen: 'My Requests',
      purpose: 'Manage buyer requests, publish drafts, review and accept seller offers.',
      primaryIntent: 'buyer_offers',
      route: '/my-requests',
      tips: {
        en: 'You are on My Requests — check draft vs published status and open Offers on each card.',
        ru: 'Вы в Моих запросах — проверьте черновик или опубликованный статус и откройте Предложения на карточке.',
        kk: 'Сіз Менің сұраныстарым бетіндесіз — черновик немесе жарияланған күйін және ұсыныстарды тексеріңіз.'
      },
      nextSteps: {
        en: ['Publish any draft request', 'Open Offers and compare totals', 'Accept one offer to start chat'],
        ru: ['Опубликуйте черновик', 'Откройте Предложения и сравните итог', 'Примите одно предложение для чата'],
        kk: ['Черновикті жариялаңыз', 'Ұсыныстарды ашып салыстырыңыз', 'Чат үшін бір ұсынысты қабылдаңыз']
      }
    }
  },
  {
    match: (p) => p === '/create-product-request' || p.startsWith('/create-product-request/'),
    ctx: {
      screen: 'Post Request',
      purpose: 'Create a buyer request with title, category, budget, and details.',
      primaryIntent: 'buyer_request',
      route: '/create-product-request',
      tips: {
        en: 'You are creating a request — be specific so sellers can quote accurately. Enable auction only if you want reverse bidding.',
        ru: 'Вы создаёте запрос — будьте конкретны, чтобы продавцы точно оценили. Аукцион включайте только если нужны торги.',
        kk: 'Сұраныс жасаудасыз — нақты болыңыз. Аукционды тек кері бәсеке керек болса қосыңыз.'
      },
      nextSteps: {
        en: ['Fill title, category, quantity, budget', 'Add deadline/location if useful', 'Save then publish from My Requests'],
        ru: ['Заполните название, категорию, количество, бюджет', 'Добавьте срок/локацию', 'Сохраните и опубликуйте из Моих запросов'],
        kk: ['Атау, санат, саны, бюджетті толтырыңыз', 'Мерзім/орын қосыңыз', 'Сақтап, Менің сұраныстарымнан жариялаңыз']
      }
    }
  },
  {
    match: (p) => p === '/browse-buyer-requests' || p.startsWith('/browse-buyer-requests/'),
    ctx: {
      screen: 'Buyer Requests',
      purpose: 'Seller board to find buyer demand and send offers or join auctions.',
      primaryIntent: 'seller_board',
      route: '/browse-buyer-requests',
      tips: {
        en: 'You are browsing buyer requests — filter by category and open requests that match your stock or service.',
        ru: 'Вы на доске заявок покупателей — фильтруйте по категории и открывайте подходящие запросы.',
        kk: 'Сатып алушы сұраныстары тақтасындасыз — санат бойынша сүзіп, сәйкес сұраныстарды ашыңыз.'
      },
      nextSteps: {
        en: ['Search or filter requests', 'Open a strong match', 'Send one clear offer per request'],
        ru: ['Найдите или отфильтруйте запрос', 'Откройте подходящий', 'Отправьте одно предложение'],
        kk: ['Сұранысты іздеңіз', 'Сәйкесін ашыңыз', 'Бір ұсыныс жіберіңіз']
      }
    }
  },
  {
    match: (p) => p === '/chat' || p.startsWith('/chat/'),
    ctx: {
      screen: 'Messages',
      purpose: 'Negotiate after accepted offer; agree price; buyer runs demo payment.',
      primaryIntent: 'chat',
      route: '/chat',
      tips: {
        en: 'You are in Messages — chat exists only after offer acceptance. Use price proposals, then demo Pay when agreed.',
        ru: 'Вы в Сообщениях — чат только после принятия предложения. Отправляйте встречные цены, затем демо-оплата.',
        kk: 'Хабарламалардасыз — чат ұсыныс қабылданғаннан кейін. Баға ұсынысы, содан кейін демо төлем.'
      },
      nextSteps: {
        en: ['Pick the conversation', 'Send or accept price proposals', 'Buyer: Pay now (demo) when ready'],
        ru: ['Выберите диалог', 'Отправьте или примите цену', 'Покупатель: демо-оплата'],
        kk: ['Диалогты таңдаңыз', 'Баға ұсынысын жіберіңіз/қабылдаңыз', 'Сатып алушы: демо төлем']
      }
    }
  },
  {
    match: (p) => p === '/orders' || p.startsWith('/orders/'),
    ctx: {
      screen: 'Order history',
      purpose: 'Track request-deal orders and catalog checkout orders.',
      primaryIntent: 'orders',
      route: '/orders',
      tips: {
        en: 'You are in Order history — request-deal orders appear after demo payment in chat.',
        ru: 'Вы в Истории заказов — сделки появляются после демо-оплаты в чате.',
        kk: 'Тапсырыс тарихындасыз — мәмілелер чаттағы демо төлемнен кейін пайда болады.'
      },
      nextSteps: {
        en: ['Open an order for details', 'Check status and tracking', 'Return to chat if payment pending'],
        ru: ['Откройте заказ', 'Проверьте статус и трекинг', 'Вернитесь в чат если оплата не завершена'],
        kk: ['Тапсырысты ашыңыз', 'Статус пен трекингті тексеріңіз', 'Төлем болмаса чатқа оралыңыз']
      }
    }
  },
  {
    match: (p) => p === '/products' || p.startsWith('/products/'),
    ctx: {
      screen: 'Catalog',
      purpose: 'Browse seller showcase products and add to cart.',
      primaryIntent: 'catalog',
      route: '/products',
      tips: {
        en: 'You are in the Catalog — this is separate from buyer-request offers. Use Cart to checkout showcase products.',
        ru: 'Вы в Каталоге — это отдельно от запросов/предложений. Оформление через Корзину.',
        kk: 'Каталогтасыз — бұл сұраныс/ұсыныстан бөлек. Себет арқылы тапсырыс беріңіз.'
      },
      nextSteps: {
        en: ['Search products', 'Add to cart', 'Checkout from Cart'],
        ru: ['Найдите товар', 'Добавьте в корзину', 'Оформите из Корзины'],
        kk: ['Тауар іздеңіз', 'Себетке қосыңыз', 'Себеттен рәсімдеңіз']
      }
    }
  },
  {
    match: (p) => p.startsWith('/seller/dashboard'),
    ctx: {
      screen: 'Seller Dashboard',
      purpose: 'Seller overview, metrics, and quick access to buyer requests.',
      primaryIntent: 'seller_board',
      route: '/seller/dashboard',
      tips: {
        en: 'You are on Seller Dashboard — use it to monitor demand and jump to Buyer Requests.',
        ru: 'Вы на Панели продавца — отсюда переходите к Заявкам покупателей.',
        kk: 'Сатушы панеліндесіз — Сатып алушы сұраныстарына осы жерден өтіңіз.'
      },
      nextSteps: {
        en: ['Review live requests', 'Open Buyer Requests', 'Check analytics for performance'],
        ru: ['Просмотрите заявки', 'Откройте Заявки покупателей', 'Смотрите аналитику'],
        kk: ['Сұраныстарды қараңыз', 'Сатып алушы сұраныстарын ашыңыз', 'Аналитиканы тексеріңіз']
      }
    }
  },
  {
    match: (p) => p.startsWith('/seller/auctions') || p.startsWith('/auctions/'),
    ctx: {
      screen: 'Auctions',
      purpose: 'Reverse auctions where sellers lower price to win buyer requests.',
      primaryIntent: 'auction',
      route: '/seller/auctions',
      tips: {
        en: 'You are in Auctions — sellers compete by lowering bids down to their floor price.',
        ru: 'Вы в Аукционах — продавцы снижают ставку до минимальной цены.',
        kk: 'Аукциондардасыз — сатушылар минималды бағаға дейін төмендетеді.'
      },
      nextSteps: {
        en: ['Join from Buyer Requests first', 'Watch round timer', 'Lower price or hold each round'],
        ru: ['Сначала присоединитесь с доски заявок', 'Следите за раундами', 'Снижайте цену или держите'],
        kk: ['Алдымен сұраныс тақтасынан қосылыңыз', 'Раунд таймерін бақылаңыз', 'Бағаны төмендетіңіз']
      }
    }
  },
  {
    match: (p) => p === '/chatbot' || p.startsWith('/chatbot/'),
    ctx: {
      screen: 'Mollmart Assistant',
      purpose: 'Ask how Mollmart works — requests, offers, chat, orders, catalog, auctions.',
      primaryIntent: 'greeting',
      route: '/chatbot',
      tips: {
        en: 'You are in the Assistant — ask about buyer requests, seller offers, chat, payments, or auctions. Try the suggestion chips below.',
        ru: 'Вы в Помощнике — спрашивайте о запросах, предложениях, чате, оплате или аукционах. Используйте подсказки ниже.',
        kk: 'Сіз Көмекшідесіз — сұраныстар, ұсыныстар, чат, төлем немесе аукциондар туралы сұраңыз. Төмендегі ұсыныстарды қолданыңыз.'
      },
      nextSteps: {
        en: ['Tap a suggestion chip', 'Ask in Russian, Kazakh, or English', 'Use “Open this page” links in answers'],
        ru: ['Нажмите подсказку ниже', 'Пишите на русском, казахском или английском', 'Переходите по ссылкам в ответах'],
        kk: ['Төмендегі ұсынысты басыңыз', 'Орысша, қазақша немесе ағылшынша жазыңыз', 'Жауаптағы сілтемелерді қолданыңыз']
      }
    }
  },
  {
    match: (p) => p.startsWith('/admin'),
    ctx: {
      screen: 'Admin',
      purpose: 'Manage users, categories, moderation, and request-deal orders.',
      primaryIntent: 'admin',
      route: '/admin',
      tips: {
        en: 'You are in Admin — use separate tools for users, categories, moderation, and orders.',
        ru: 'Вы в Админке — отдельные разделы для пользователей, категорий, модерации и заказов.',
        kk: 'Админ панеліндесіз — пайдаланушылар, санаттар, модерация және тапсырыстар.'
      },
      nextSteps: {
        en: ['Review users', 'Check moderation queue', 'Update order tracking if needed'],
        ru: ['Проверьте пользователей', 'Откройте модерацию', 'Обновите трекинг заказа при необходимости'],
        kk: ['Пайдаланушыларды тексеріңіз', 'Модерацияны ашыңыз', 'Трекингті жаңартыңыз']
      }
    }
  }
];

export function resolvePageContext(path?: string): PageContext | null {
  if (!path || path === '/') return null;
  const normalized = path.split('?')[0].split('#')[0];
  const rule = PAGE_RULES.find((r) => r.match(normalized));
  if (!rule) return null;
  return { path: normalized, ...rule.ctx };
}

export function pageContextForPrompt(ctx: PageContext): string {
  return [
    `Screen: ${ctx.screen} (${ctx.path})`,
    `Purpose: ${ctx.purpose}`,
    `Relevant topic: ${ctx.primaryIntent}`,
    `On-screen tip: ${ctx.tips.en}`
  ].join('\n');
}

export function localizedPageTip(ctx: PageContext, language: 'en' | 'ru' | 'kk'): string {
  return ctx.tips[language];
}

export function localizedPageSteps(ctx: PageContext, language: 'en' | 'ru' | 'kk'): string[] {
  return ctx.nextSteps[language];
}
