const fs = require("fs");
const path = require("path");

const i18nPath = path.join(__dirname, "../lib/i18n.ts");
const additionsPath = path.join(__dirname, "../lib/i18n-additions.ts");
const src = fs.readFileSync(i18nPath, "utf8");
const additionsSrc = fs.existsSync(additionsPath)
  ? fs.readFileSync(additionsPath, "utf8")
  : "";

function extractBlockFrom(lang, text) {
  const start = text.indexOf(`${lang}: {`);
  if (start < 0) return "";
  let depth = 0;
  let i = start + lang.length + 2;
  for (; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return "";
}

function extractBlock(lang) {
  return extractBlockFrom(lang, src);
}

function extractKeys(block) {
  const keys = [];
  const re = /"((?:\\.|[^"\\])+)":/g;
  let m;
  while ((m = re.exec(block))) keys.push(m[1].replace(/\\"/g, '"'));
  return keys;
}

const ruKeys = extractKeys(extractBlock("ru"));
const kkKeys = extractKeys(extractBlock("kk"));
const additionsRu = additionsSrc ? extractKeys(extractBlockFrom("ru", additionsSrc)) : [];
const additionsKk = additionsSrc ? extractKeys(extractBlockFrom("kk", additionsSrc)) : [];
const ruSet = new Set([...ruKeys, ...additionsRu]);
const kkSet = new Set([...kkKeys, ...additionsKk]);

const appDir = path.join(__dirname, "..");
const skipDirs = new Set(["node_modules", ".next", "scripts"]);
const found = new Map();

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full);
    else if (
      /\.(tsx|ts|jsx|js)$/.test(name) &&
      !name.endsWith("i18n.ts") &&
      name !== "i18n-additions.ts" &&
      name !== "landingI18n.ts"
    ) {
      const text = fs.readFileSync(full, "utf8");
      if (full.includes("kimi-scrollytelling")) continue;
      const re = /["']([A-Z][A-Za-z0-9 ,.'!?/&():\\-–—]{2,100})["']/g;
      let m;
      while ((m = re.exec(text))) {
        const s = m[1];
        if (/^(use client|use server|GET|POST|PATCH|DELETE|flex|grid|hidden|true|false|null)$/.test(s)) continue;
        if (/^[a-z-]+$/.test(s)) continue;
        if (s.includes("${") || s.includes("className")) continue;
        if (!found.has(s)) found.set(s, []);
        found.get(s).push(path.relative(appDir, full));
      }
    }
  }
}

walk(appDir);

const missing = [...found.keys()].filter((s) => !ruSet.has(s)).sort();
const out = {
  count: missing.length,
  strings: missing.map((s) => ({ s, files: found.get(s).slice(0, 5) })),
};
fs.writeFileSync(path.join(__dirname, "missing-i18n.json"), JSON.stringify(out, null, 2));
console.log("missing ru/kk:", missing.length);
