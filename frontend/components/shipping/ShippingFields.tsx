"use client";

import type { ShippingInput } from "@/lib/shipping";

type Props = {
  value: ShippingInput;
  onChange: (patch: Partial<ShippingInput>) => void;
  inputClassName?: string;
};

export default function ShippingFields({
  value,
  onChange,
  inputClassName = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm",
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivery details</p>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Name</span>
        <input
          value={value.shippingName}
          onChange={(e) => onChange({ shippingName: e.target.value })}
          className={inputClassName}
          placeholder="Jane Buyer"
          autoComplete="name"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Phone</span>
        <input
          value={value.shippingPhone}
          onChange={(e) => onChange({ shippingPhone: e.target.value })}
          className={inputClassName}
          placeholder="+7 777 123 4567"
          autoComplete="tel"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Address</span>
        <textarea
          value={value.shippingAddress}
          onChange={(e) => onChange({ shippingAddress: e.target.value })}
          className={`${inputClassName} min-h-24`}
          placeholder="Street, city, postal code"
          autoComplete="street-address"
        />
      </label>
    </div>
  );
}
