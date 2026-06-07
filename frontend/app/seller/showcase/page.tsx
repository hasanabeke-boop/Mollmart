import { redirect } from "next/navigation";

export default function LegacyShowcaseRedirect() {
  redirect("/seller/listings");
}
