export type DemoCardInput = {
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
};

export type DemoCheckoutInput = DemoCardInput & {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
};

export const EMPTY_DEMO_CARD: DemoCardInput = {
  cardHolderName: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
};

export const EMPTY_DEMO_CHECKOUT: DemoCheckoutInput = {
  ...EMPTY_DEMO_CARD,
  shippingName: "",
  shippingPhone: "",
  shippingAddress: "",
};

export function normalizeCardNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function formatCardNumberDisplay(digits: string): string {
  return normalizeCardNumber(digits)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

export function formatCardExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function parseCardExpiry(expiry: string): { month: number; year: number } | null {
  const m = expiry.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!m) return null;
  return { month: Number(m[1]), year: 2000 + Number(m[2]) };
}

export function validateDemoCard(input: DemoCardInput): string | null {
  if (input.cardHolderName.trim().length < 2) return "Enter the name on the card.";
  const num = normalizeCardNumber(input.cardNumber);
  if (num.length < 13 || num.length > 19) return "Enter a valid card number.";
  const exp = parseCardExpiry(input.cardExpiry);
  if (!exp) return "Enter expiry as MM/YY.";
  const expEnd = new Date(exp.year, exp.month, 0, 23, 59, 59, 999);
  if (expEnd < new Date()) return "This card appears expired.";
  if (!/^\d{3,4}$/.test(input.cardCvv.trim())) return "Enter a valid CVV.";
  return null;
}

export function validateDemoCheckout(input: DemoCheckoutInput): string | null {
  if (input.shippingName.trim().length < 2) return "Enter recipient name.";
  if (input.shippingPhone.trim().length < 5) return "Enter a phone number.";
  if (input.shippingAddress.trim().length < 5) return "Enter delivery address.";
  return validateDemoCard(input);
}

export function demoCardPayload(input: DemoCardInput) {
  return {
    cardHolderName: input.cardHolderName.trim(),
    cardNumber: normalizeCardNumber(input.cardNumber),
    cardExpiry: input.cardExpiry.trim(),
    cardCvv: input.cardCvv.trim(),
  };
}

export function demoCheckoutPayload(input: DemoCheckoutInput) {
  return {
    shippingName: input.shippingName.trim(),
    shippingPhone: input.shippingPhone.trim(),
    shippingAddress: input.shippingAddress.trim(),
    ...demoCardPayload(input),
  };
}
