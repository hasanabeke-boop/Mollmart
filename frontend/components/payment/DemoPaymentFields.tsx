"use client";

import {
  formatCardExpiryInput,
  formatCardNumberDisplay,
  normalizeCardNumber,
  type DemoCardInput,
} from "@/lib/demoPayment";

type ShippingFields = {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
};

type Props = {
  card: DemoCardInput;
  onCardChange: (patch: Partial<DemoCardInput>) => void;
  shipping?: ShippingFields;
  onShippingChange?: (patch: Partial<ShippingFields>) => void;
  inputClassName?: string;
};

export default function DemoPaymentFields({
  card,
  onCardChange,
  shipping,
  onShippingChange,
  inputClassName = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm",
}: Props) {
  const showShipping = shipping != null && onShippingChange != null;

  return (
    <div className="space-y-4">
      {showShipping ? (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivery details</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Name</span>
            <input
              value={shipping.shippingName}
              onChange={(e) => onShippingChange({ shippingName: e.target.value })}
              className={inputClassName}
              placeholder="Jane Buyer"
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Phone</span>
            <input
              value={shipping.shippingPhone}
              onChange={(e) => onShippingChange({ shippingPhone: e.target.value })}
              className={inputClassName}
              placeholder="+7 777 123 4567"
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Address</span>
            <textarea
              value={shipping.shippingAddress}
              onChange={(e) => onShippingChange({ shippingAddress: e.target.value })}
              className={`${inputClassName} min-h-24`}
              placeholder="Street, city, postal code"
              autoComplete="street-address"
            />
          </label>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Demo card</p>
        <p className="text-xs text-slate-500">Simulated only — nothing is charged or stored.</p>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Name on card</span>
          <input
            value={card.cardHolderName}
            onChange={(e) => onCardChange({ cardHolderName: e.target.value })}
            className={inputClassName}
            placeholder="Jane Buyer"
            autoComplete="cc-name"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Card number</span>
          <input
            value={formatCardNumberDisplay(card.cardNumber)}
            onChange={(e) => onCardChange({ cardNumber: normalizeCardNumber(e.target.value) })}
            className={`${inputClassName} font-mono tracking-wide`}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="cc-number"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Expiry</span>
            <input
              value={card.cardExpiry}
              onChange={(e) => onCardChange({ cardExpiry: formatCardExpiryInput(e.target.value) })}
              className={`${inputClassName} font-mono`}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">CVV</span>
            <input
              value={card.cardCvv}
              onChange={(e) => onCardChange({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              className={`${inputClassName} font-mono tracking-widest`}
              placeholder="123"
              inputMode="numeric"
              autoComplete="cc-csc"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
