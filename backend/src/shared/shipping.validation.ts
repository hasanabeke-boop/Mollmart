import Joi from 'joi';

export const shippingFieldsSchema = {
  shippingName: Joi.string().trim().min(2).max(200).required(),
  shippingPhone: Joi.string().trim().min(5).max(40).required(),
  shippingAddress: Joi.string().trim().min(5).max(2000).required()
};

export const shippingSchema = Joi.object(shippingFieldsSchema);

export type ShippingInput = {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
};

export function normalizeShippingInput(input: ShippingInput): ShippingInput {
  return {
    shippingName: input.shippingName.trim(),
    shippingPhone: input.shippingPhone.trim(),
    shippingAddress: input.shippingAddress.trim()
  };
}
