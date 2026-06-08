import type { ChatbotMessageInput } from '../types/chatbot';
import {
  faqAnswerForLanguage,
  rankMollmartFaq,
  type FaqEntry,
  type FaqIntent
} from './mollmartFaq';
import { matchLocalizedFaq } from './multilingualFaq';
import {
  localizedPageSteps,
  localizedPageTip,
  resolvePageContext,
  type PageContext
} from './pageContext';

type Language = 'en' | 'ru' | 'kk';

/** Expand short / multilingual phrasing before FAQ match */
const PHRASE_EXPANSIONS: Array<{ pattern: RegExp; addTerms: string }> = [
  { pattern: /\b(оплат|төлем|pay|payment|pay now)\b/i, addTerms: 'demo payment chat agree price' },
  { pattern: /\b(предложен|ұсыныс|offer|offers|bid)\b/i, addTerms: 'seller offer accept offer' },
  { pattern: /\b(запрос|сұраныс|request|requests)\b/i, addTerms: 'buyer request publish draft' },
  { pattern: /\b(чат|хабар|message|chat|conversation)\b/i, addTerms: 'messages accept offer first' },
  { pattern: /\b(аукцион|auction|auctions)\b/i, addTerms: 'reverse auction join sellers' },
  { pattern: /\b(заказ|тапсырыс|order|orders)\b/i, addTerms: 'order history tracking demo payment' },
  { pattern: /\b(каталог|catalog|витрин|showcase|корзин|cart)\b/i, addTerms: 'catalog showcase cart checkout' },
  { pattern: /\b(где|where|қайда|не работает|doesn'?t work|not working|почему|why|неге)\b/i, addTerms: 'troubleshoot help' },
  { pattern: /\b(далее|next|then|потом|содан)\b/i, addTerms: 'what happens after' }
];

export function expandUserQuery(message: string): string {
  let expanded = message;
  for (const { pattern, addTerms } of PHRASE_EXPANSIONS) {
    if (pattern.test(message)) {
      expanded += ` ${addTerms}`;
    }
  }
  return expanded;
}

export function isVagueHelpRequest(message: string): boolean {
  const text = message.toLowerCase().trim();
  if (text.length > 120) return false;
  return (
    /^(help|hi|hello|hey|start|что делать|не понимаю|көмек|көмектес|сәлем|помоги|помощь)\b/i.test(text) ||
    /\b(what should i do|what do i do here|how does this page|что здесь|бұл бетте)\b/i.test(text) ||
    (text.split(/\s+/).length <= 4 && /\b(help|help me|көмек|помоги)\b/i.test(text))
  );
}

export function summarizeConversation(history: ChatbotMessageInput['history'], language: Language): string {
  const items = (history ?? []).slice(-6);
  if (items.length === 0) return '';

  const userGoals = items
    .filter((h) => h.role === 'user')
    .map((h) => h.content.trim())
    .slice(-3);

  const lastIntent = [...items].reverse().find((h) => h.intent)?.intent;
  const lastRoute = [...items].reverse().find((h) => h.suggestedRoute)?.suggestedRoute;

  const parts = [
    userGoals.length ? `Recent user goals: ${userGoals.join(' → ')}` : '',
    lastIntent ? `Last topic: ${lastIntent}` : '',
    lastRoute ? `Last suggested page: ${lastRoute}` : ''
  ].filter(Boolean);

  if (language !== 'en') {
    return parts.join('. ');
  }
  return parts.join('. ');
}

export function enrichReplyWithPageContext(
  baseReply: string,
  input: ChatbotMessageInput,
  language: Language,
  pageCtx: PageContext | null
): string {
  if (!pageCtx) return baseReply;

  const path = input.currentPath?.split('?')[0];
  if (!path || path !== pageCtx.path) return baseReply;

  if (path === '/chatbot' || path.startsWith('/chatbot/')) {
    return baseReply;
  }

  const tip = localizedPageTip(pageCtx, language);
  if (baseReply.toLowerCase().includes(pageCtx.screen.toLowerCase())) {
    return baseReply;
  }

  const prefix =
    language === 'ru'
      ? `Сейчас вы на экране «${pageCtx.screen}». ${tip}\n\n`
      : language === 'kk'
        ? `Қазір сіз «${pageCtx.screen}» бетіндесіз. ${tip}\n\n`
        : `You are on ${pageCtx.screen}. ${tip}\n\n`;

  return `${prefix}${baseReply}`;
}

export function buildProactivePageReply(
  input: ChatbotMessageInput,
  pageCtx: PageContext,
  language: Language
): {
  reply: string;
  intent: FaqIntent;
  route: string;
  suggestions: string[];
  actions: string[];
  confidence: number;
} {
  const steps = localizedPageSteps(pageCtx, language);
  const tip = localizedPageTip(pageCtx, language);

  const reply =
    language === 'ru'
      ? `${tip}\n\nРекомендуемые шаги на этом экране:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : language === 'kk'
        ? `${tip}\n\nОсы экрандағы ұсынылған қадамдар:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
        : `${tip}\n\nSuggested steps on this screen:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

  return {
    reply,
    intent: pageCtx.primaryIntent,
    route: pageCtx.route,
    suggestions: [],
    actions: steps,
    confidence: 0.88
  };
}

/** Combine top FAQ hits when match is partial but related */
export function synthesizePartialFaqReply(
  entries: FaqEntry[],
  input: ChatbotMessageInput,
  language: Language,
  pageCtx: PageContext | null
): string | null {
  if (entries.length === 0) return null;

  const primary = faqAnswerForLanguage(entries[0], language);
  const secondary = entries[1] ? faqAnswerForLanguage(entries[1], language) : null;

  const intro =
    language === 'ru'
      ? 'Похоже, вас интересует следующее:'
      : language === 'kk'
        ? 'Сізді мыналар қызықтыруы мүмкін:'
        : 'This seems closest to what you need:';

  let body = `${intro}\n\n${primary}`;
  if (secondary && entries[0].intent !== entries[1].intent) {
    const also =
      language === 'ru' ? '\n\nТакже полезно:' : language === 'kk' ? '\n\nСондай-ақ пайдалы:' : '\n\nAlso relevant:';
    body += `${also}\n${secondary}`;
  }

  return enrichReplyWithPageContext(body, input, language, pageCtx);
}

export function pickContextualSuggestions(entries: FaqEntry[], max = 4): string[] {
  return [...new Set(entries.flatMap((e) => e.suggestions))].slice(0, max);
}

export function intelligentFaqAnalysis(
  message: string,
  role?: string,
  language: Language = 'en'
) {
  const localized = matchLocalizedFaq(message, language);
  const expanded = expandUserQuery(message);
  const ranked = rankMollmartFaq(expanded, role, 3);

  if (localized) {
    const withoutDup = ranked.filter((r) => r.entry.id !== localized.entry.id);
    return { expanded, ranked: [localized, ...withoutDup], localized };
  }

  return { expanded, ranked, localized: null };
}
