/** English UI keys for deal/request/offer statuses — pass through t(). */

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  has_offers: "Has offers",
  in_negotiation: "In negotiation",
  accepted: "Accepted",
  closed: "Closed",
  cancelled: "Cancelled",
  active: "Active",
};

export const OFFER_STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  updated: "Updated",
  withdrawn: "Withdrawn",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

export const PROPOSAL_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  superseded: "Superseded",
};

export function translateStatusLabel(
  status: string,
  map: Record<string, string>,
  t: (text: string) => string,
): string {
  const key = map[status];
  return key ? t(key) : status.replace(/_/g, " ");
}
