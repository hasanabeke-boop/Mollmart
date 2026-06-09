import { apiFetchWithRefresh } from "@/lib/api";
import { demoCheckoutPayload, type DemoCheckoutInput } from "@/lib/demoPayment";
import type { RequestDealOrder } from "@/lib/requestDeals";

export async function checkoutAuctionWinner(
  requestId: string,
  input: DemoCheckoutInput,
): Promise<RequestDealOrder> {
  return apiFetchWithRefresh<RequestDealOrder>(
    `/api/v1/auctions/request/${encodeURIComponent(requestId)}/winner-checkout`,
    {
      method: "POST",
      service: "auction",
      body: JSON.stringify(demoCheckoutPayload(input)),
    },
  );
}
