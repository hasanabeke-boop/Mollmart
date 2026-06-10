export type OrderStatus =
  | "paid"
  | "in_progress"
  | "awaiting_confirmation"
  | "completed"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "paid",
  "in_progress",
  "awaiting_confirmation",
  "completed",
  "cancelled",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Created",
  in_progress: "In progress",
  awaiting_confirmation: "Awaiting confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  paid: "Order created",
  in_progress: "Seller started fulfillment or shipped the item",
  awaiting_confirmation: "Delivered or service done — waiting for buyer confirmation",
  completed: "Buyer confirmed",
  cancelled: "Order was cancelled",
};

export type OrderAction = {
  status: "in_progress" | "awaiting_confirmation" | "completed";
  label: string;
  hint?: string;
};

export function nextOrderAction(
  status: OrderStatus,
  role: "buyer" | "seller",
): OrderAction | null {
  if (role === "seller") {
    if (status === "paid") {
      return {
        status: "in_progress",
        label: "Start work",
        hint: "Mark that you started fulfillment or shipped the order.",
      };
    }
    if (status === "in_progress") {
      return {
        status: "awaiting_confirmation",
        label: "Mark as delivered",
        hint: "Buyer will confirm receipt to complete the order.",
      };
    }
  }
  if (role === "buyer" && status === "awaiting_confirmation") {
    return {
      status: "completed",
      label: "Confirm receipt",
      hint: "The order will be completed after you confirm.",
    };
  }
  return null;
}

export function orderTrackingSteps(status: OrderStatus) {
  const steps = [
    { key: "paid" as const, label: ORDER_STATUS_LABELS.paid },
    { key: "in_progress" as const, label: ORDER_STATUS_LABELS.in_progress },
    { key: "awaiting_confirmation" as const, label: ORDER_STATUS_LABELS.awaiting_confirmation },
    { key: "completed" as const, label: ORDER_STATUS_LABELS.completed },
  ];
  if (status === "cancelled") {
    return [{ key: "cancelled" as const, label: ORDER_STATUS_LABELS.cancelled, done: true, current: true }];
  }
  const order: OrderStatus[] = ["paid", "in_progress", "awaiting_confirmation", "completed"];
  const idx = order.indexOf(status);
  return steps.map((step, i) => ({
    ...step,
    done: idx >= i,
    current: idx === i,
  }));
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}
