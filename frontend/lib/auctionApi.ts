import { apiFetchWithRefresh } from "@/lib/api";
import { shippingPayload, type ShippingInput } from "@/lib/shipping";
import type { RequestDealOrder } from "@/lib/requestDeals";
import type { AuctionSessionView } from "@/lib/auctionTypes";

export async function fetchAuctionByRequestId(requestId: string): Promise<AuctionSessionView> {
  return apiFetchWithRefresh<AuctionSessionView>(
    `/api/v1/auctions/request/${encodeURIComponent(requestId)}`,
    { service: "auction" },
  );
}

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
