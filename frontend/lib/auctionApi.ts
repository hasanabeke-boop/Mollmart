import { apiFetchWithRefresh } from "@/lib/api";
import { shippingPayload, type ShippingInput } from "@/lib/shipping";
import type { RequestDealOrder } from "@/lib/requestDeals";

export async function placeAuctionWinnerOrder(
  requestId: string,
  input: ShippingInput,
): Promise<RequestDealOrder> {
  return apiFetchWithRefresh<RequestDealOrder>(
    `/api/v1/auctions/request/${encodeURIComponent(requestId)}/winner-place-order`,
    {
      method: "POST",
      service: "auction",
      body: JSON.stringify(shippingPayload(input)),
    },
  );
}
