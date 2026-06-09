export type ShippingInput = {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
};

export const EMPTY_SHIPPING: ShippingInput = {
  shippingName: "",
  shippingPhone: "",
  shippingAddress: "",
};

export function validateShipping(input: ShippingInput): string | null {
  if (input.shippingName.trim().length < 2) return "Enter recipient name.";
  if (input.shippingPhone.trim().length < 5) return "Enter a phone number.";
  if (input.shippingAddress.trim().length < 5) return "Enter delivery address.";
  return null;
}

export function shippingPayload(input: ShippingInput) {
  return {
    shippingName: input.shippingName.trim(),
    shippingPhone: input.shippingPhone.trim(),
    shippingAddress: input.shippingAddress.trim(),
  };
}
