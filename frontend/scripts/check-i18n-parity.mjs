import { uiTranslations } from "../lib/i18n.ts";

const ruKeys = new Set(Object.keys(uiTranslations.ru));
const kkKeys = new Set(Object.keys(uiTranslations.kk));
const ruOnly = [...ruKeys].filter((k) => !kkKeys.has(k));
const kkOnly = [...kkKeys].filter((k) => !ruKeys.has(k));

console.log(`RU keys: ${ruKeys.size}`);
console.log(`KK keys: ${kkKeys.size}`);
console.log(`In RU not KK: ${ruOnly.length}`);
if (ruOnly.length) console.log(ruOnly.join("\n"));
console.log(`In KK not RU: ${kkOnly.length}`);
if (kkOnly.length) console.log(kkOnly.join("\n"));
