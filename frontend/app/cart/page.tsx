'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  seller: string;
  price: number;
  image: string;
  stockLabel: string;
  stockTone: "in" | "low";
  quantity: number;
};

const INITIAL_ITEMS: CartItem[] = [
  {
    id: 1,
    name: "Ergonomic Office Chair",
    seller: "OfficePro",
    price: 199.0,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAupzFwRYyVKfzQHAGlkhaQ1FFRUHVKonMwgnI6-sgsi5BuHfIdYrHuJCObSRiqUit9LU0GVvLxbdYkMUNzWUUGvXyESLoOBBdCOKPAeKjOZEL76r7H1Mc5SxRBAJleRWgtoh56_eexdtvVbKhPMqDv3oG_VSWdqXTFvZqJYIxEeTO6oqM4zdQI6xxQN49KrabiUYdqc06y2e3lAFFFX_Tty88WgGPTHbL7xUHlpZpH499yV4s55GMPKTFGX6gsdySuHRONPEPoCec",
    stockLabel: "In Stock",
    stockTone: "in",
    quantity: 1,
  },
  {
    id: 2,
    name: "Mechanical Keyboard RGB",
    seller: "TechGear",
    price: 120.0,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJY_lGFWmyHNb1aMtmVhQD8nnCu59lRi2iGgY_JLDKvR1Rdv49LMJd8Ff9zVfvWNFf_N48CCRVjlU-E6XhRn84aumdm5KYq2eHBzSfEmN5dOZVdxvhKiLAjw3e5tSL0FKYGNqvYW_8LAuEMBbXo_gKrSg3Sfw_ycSy0bb6DZ8jn6Da4Yk1RXT7qhwt938i1mEtliTpXxEi77o2y5nYwVvWDlZ6lJhc8PWvsmZCId6nL_Na9LUrPNH5zdh9wUWVqLT8RqFkcpOufw0",
    stockLabel: "Low Stock",
    stockTone: "low",
    quantity: 1,
  },
  {
    id: 3,
    name: "Running Shoes - Size 10",
    seller: "SportyLife",
    price: 89.95,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhm03UVz6HvMsO6t6o40Tg0uf1nKkM__NG8FQdWW7T2t1D6ObE-t_23hL_T6RvzpTskVImi1ewqfCl4dUHb5nWrVU8ArnCD02dWft0VrfRl02f-rtDB3yZ74ozUYGHksjkHeAq4xmWeNAsPKutyGhh4UoA_LwSu0qyI-sTkYXrH2mDUvNtCncfUaOZ7aycNP1dP4MCAI9GOZqlf6ktYKPzAj3hsFd2mugGa83IqXRlc3pZj5-7le_ksmeKHYBH4TE9MDKl1V7Xw8Y",
    stockLabel: "In Stock",
    stockTone: "in",
    quantity: 1,
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const shipping = subtotal > 250 || items.length === 0 ? 0 : 15;
  const tax = subtotal * 0.08;

  const discount = appliedPromo === "SAVE10" ? subtotal * 0.1 : 0;
  const total = subtotal + shipping + tax - discount;

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApplyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (code === "SAVE10") {
      setAppliedPromo(code);
      alert("Промокод SAVE10 применён: скидка 10% на товары.");
    } else {
      setAppliedPromo(null);
      alert("Неизвестный промокод.");
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
      {/* Progress */}
      <div className="mb-10 w-full max-w-3xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between w-full relative" role="list">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -z-10 -translate-y-1/2 rounded" />
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-10 h-10 bg-primary rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-black text-xl">
                  shopping_cart
                </span>
              </span>
              <span className="absolute -bottom-8 text-sm font-bold text-[#0d1b12]">
                Cart
              </span>
            </li>
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-gray-500 text-sm">
                  credit_card
                </span>
              </span>
              <span className="absolute -bottom-8 text-sm font-medium text-gray-500">
                Payment
              </span>
            </li>
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-gray-500 text-sm">
                  local_shipping
                </span>
              </span>
              <span className="absolute -bottom-8 text-sm font-medium text-gray-500">
                Shipping
              </span>
            </li>
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-gray-500 text-sm">
                  check_circle
                </span>
              </span>
              <span className="absolute -bottom-8 text-sm font-medium text-gray-500">
                Review
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        {/* Cart items */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-[#e7f3eb] pb-4">
            <h2 className="text-3xl font-bold text-[#0d1b12]">Your Shopping Cart</h2>
            <span className="text-[#4c9a66] font-medium text-lg">
              {itemCount} {itemCount === 1 ? "Item" : "Items"}
            </span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-[#e7f3eb] flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="relative shrink-0 w-full sm:w-24 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-grow flex flex-col gap-1 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-[#0d1b12] leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[#4c9a66] text-sm mt-1">Sold by {item.seller}</p>
                    <p
                      className={`text-xs font-medium mt-1 w-fit px-2 py-0.5 rounded ${
                        item.stockTone === "in"
                          ? "text-green-600 bg-green-50"
                          : "text-orange-600 bg-orange-50"
                      }`}
                    >
                      {item.stockLabel}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-[#0d1b12]">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4 sm:mt-2">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium group"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span className="group-hover:underline">Remove</span>
                  </button>
                  <div className="flex items-center rounded-lg bg-[#f6f8f6] border border-[#e7f3eb] h-9">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-9 h-full flex items-center justify-center text-[#0d1b12] hover:bg-gray-200 rounded-l-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">remove</span>
                    </button>
                    <input
                      readOnly
                      type="number"
                      className="w-10 bg-transparent text-center text-sm font-bold border-none p-0 focus:ring-0 text-[#0d1b12] appearance-none"
                      value={item.quantity}
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-9 h-full flex items-center justify-center text-[#0d1b12] hover:bg-gray-200 rounded-r-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Ваша корзина пуста. Добавьте товары со страницы каталога.
            </p>
          )}

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#4c9a66] font-medium hover:underline mt-4"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-4 h-fit">
          <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-[#e7f3eb] p-6">
            <h3 className="text-xl font-bold text-[#0d1b12] mb-6">Order Summary</h3>
            <div className="space-y-4 border-b border-[#e7f3eb] pb-6">
              <div className="flex justify-between text-[#0d1b12]">
                <span>Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#0d1b12]">
                <span>Shipping estimate</span>
                <span className="font-medium">
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-[#0d1b12]">
                <span>Tax (8%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Savings</span>
                <span className="font-medium">
                  -${discount.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="py-6 border-b border-[#e7f3eb]">
              <label
                htmlFor="promo"
                className="block text-sm font-medium text-[#0d1b12] mb-2"
              >
                Gift card or discount code
              </label>
              <div className="flex gap-2">
                <input
                  id="promo"
                  type="text"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Enter code (e.g. SAVE10)"
                  className="flex-1 rounded-lg border-[#e7f3eb] bg-[#f6f8f6] text-sm focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="bg-[#f6f8f6] hover:bg-gray-200 text-[#0d1b12] font-medium px-4 py-2 rounded-lg border border-[#e7f3eb] transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="py-6">
              <div className="flex justify-between items-end mb-6">
                <span className="text-lg font-bold text-[#0d1b12]">Total</span>
                <span className="text-3xl font-bold text-[#0d1b12]">
                  ${total.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => alert("Checkout flow пока демо.")}
                className="w-full bg-primary hover:bg-[#0fd650] text-black font-bold text-lg py-4 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 opacity-60">
                  <span className="material-symbols-outlined text-3xl text-gray-600">
                    credit_card
                  </span>
                  <span className="material-symbols-outlined text-3xl text-gray-600">
                    account_balance
                  </span>
                  <span className="material-symbols-outlined text-3xl text-gray-600">
                    payments
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-center flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Transactions are 100% Secured and Encrypted (demo)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

