import Joi from 'joi';

export function normalizeCardNumber(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function parseCardExpiry(expiry: string): { month: number; year: number } | null {
  const m = expiry.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (m == null) return null;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  return { month, year };
}

export function assertDemoCardNotExpired(expiry: string): void {
  const parsed = parseCardExpiry(expiry);
  if (parsed == null) {
    throw new Error('INVALID_CARD_EXPIRY');
  }
  const now = new Date();
  const expEnd = new Date(parsed.year, parsed.month, 0, 23, 59, 59, 999);
  if (expEnd < now) {
    throw new Error('CARD_EXPIRED');
  }
}

const cardNumberValidator = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const digits = normalizeCardNumber(String(value));
    if (digits.length < 13 || digits.length > 19) {
      return helpers.error('any.invalid');
    }
    return digits;
  })
  .required();

export const demoCardFieldsSchema = {
  cardHolderName: Joi.string().trim().min(2).max(120).required(),
  cardNumber: cardNumberValidator,
  cardExpiry: Joi.string()
    .trim()
    .pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .required(),
  cardCvv: Joi.string().trim().pattern(/^\d{3,4}$/).required()
};

export const demoCardOnlySchema = Joi.object(demoCardFieldsSchema);

export const demoCheckoutWithShippingSchema = Joi.object({
  shippingName: Joi.string().trim().min(2).max(200).required(),
  shippingPhone: Joi.string().trim().min(5).max(40).required(),
  shippingAddress: Joi.string().trim().min(5).max(2000).required(),
  ...demoCardFieldsSchema
});

/** Validates demo card; card data is never persisted. */
export function validateDemoCardFields(input: {
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}): void {
  void input.cardHolderName;
  void normalizeCardNumber(input.cardNumber);
  assertDemoCardNotExpired(input.cardExpiry);
  void input.cardCvv;
}
