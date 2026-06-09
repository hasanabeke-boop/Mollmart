import { redirect } from "next/navigation";

export default function SellerDashboardRedirectPage() {
  redirect("/seller/analytics");
}
