const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const pages = [
  "app/page.tsx",
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/create-product-request/page.tsx",
  "app/my-requests/page.tsx",
  "app/browse-buyer-requests/page.tsx",
  "app/chat/page.tsx",
  "app/orders/page.tsx",
  "app/orders/[id]/page.tsx",
  "app/orders/[id]/tracking/page.tsx",
  "app/notifications/page.tsx",
  "app/profile/page.tsx",
  "app/seller/dashboard/page.tsx",
  "app/seller/analytics/page.tsx",
  "app/admin/page.tsx",
  "app/admin/orders/page.tsx",
  "app/admin/requests/page.tsx",
  "app/admin/users/page.tsx",
  "app/admin/categories/page.tsx",
  "app/admin/moderation/page.tsx",
];

const failures = [];

for (const page of pages) {
  const fullPath = path.join(root, page);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${page} is missing`);
    continue;
  }

  const source = fs.readFileSync(fullPath, "utf8");
  if (!source.includes("export default")) {
    failures.push(`${page} does not export a default page component`);
  }
}

if (failures.length > 0) {
  console.error("Main page check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Main page check passed for ${pages.length} routes.`);
