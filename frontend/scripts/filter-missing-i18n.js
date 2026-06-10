const fs = require("fs");
const path = require("path");

const missing = JSON.parse(
  fs.readFileSync(path.join(__dirname, "missing-i18n.json"), "utf8"),
);

const SKIP_FILES = new Set(["lib\\landingI18n.ts"]);
const SKIP_EXACT = new Set([
  "AbortError",
  "Authorization",
  "CODE",
  "PRE",
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "DEMAND",
  "MEETS",
  "SUPPLY",
  "Abdurahman S.",
  "Daniyar K.",
  "Don",
  "Austin, TX",
  "Chicago, IL",
  "Denver, CO",
  "Miami, FL",
  "Seattle, WA",
  "Portland, OR",
  "Nashville, TN",
  "Phoenix, AZ",
]);

const filtered = missing.strings
  .filter(({ s, files }) => {
    if (SKIP_EXACT.has(s)) return false;
    if (files.every((f) => SKIP_FILES.has(f) || f.includes("landingI18n"))) return false;
    return true;
  })
  .map(({ s }) => s);

console.log("filtered count:", filtered.length);
fs.writeFileSync(
  path.join(__dirname, "missing-i18n-filtered.json"),
  JSON.stringify(filtered, null, 2),
);
