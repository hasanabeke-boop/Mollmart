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
  while ((m = re.exec(block))) {
    keys.push(m[1].replace(/\\"/g, '"'));
  }
  return keys;
}

const ruKeys = extractKeys(extractBlock("ru"));
const kkKeys = extractKeys(extractBlock("kk"));
const additionsRu = additionsSrc ? extractKeys(extractBlockFrom("ru", additionsSrc)) : [];
const additionsKk = additionsSrc ? extractKeys(extractBlockFrom("kk", additionsSrc)) : [];
const allRuKeys = [...ruKeys, ...additionsRu];
const allKkKeys = [...kkKeys, ...additionsKk];
const ruSet = new Set(allRuKeys);
const kkSet = new Set(allKkKeys);
const onlyRu = allRuKeys.filter((k) => !kkSet.has(k));
const onlyKk = allKkKeys.filter((k) => !ruSet.has(k));

console.log("ru keys:", ruKeys.length + additionsRu.length);
console.log("kk keys:", kkKeys.length + additionsKk.length);
console.log("only in ru:", onlyRu.length);
console.log("only in kk:", onlyKk.length);
if (onlyRu.length) {
  console.log("\n--- Missing in kk ---");
  onlyRu.forEach((k) => console.log(k));
}
if (onlyKk.length) {
  console.log("\n--- Missing in ru ---");
  onlyKk.forEach((k) => console.log(k));
}

// Scan frontend for quoted UI-like strings
const appDir = path.join(__dirname, "..");
const skipDirs = new Set(["node_modules", ".next", "scripts"]);
const stringRe = /(?:>|{|^\s*|[\s(])(["'`])([A-Za-z][^"'`\n]{2,80})\1/g;
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
      if (full.includes("kimi-scrollytelling")) return;
      let m;
      const re = /["']([A-Z][A-Za-z0-9 ,.'!?/&():\-–—]{2,100})["']/g;
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

const missingRu = [];
const missingKk = [];
for (const s of found.keys()) {
  if (!ruSet.has(s)) missingRu.push(s);
  if (!kkSet.has(s)) missingKk.push(s);
}

missingRu.sort();
missingKk.sort();
console.log("\n--- UI strings in code missing ru translation:", missingRu.length);
missingRu.slice(0, 80).forEach((s) => console.log(JSON.stringify(s)));
if (missingRu.length > 80) console.log(`... and ${missingRu.length - 80} more`);
