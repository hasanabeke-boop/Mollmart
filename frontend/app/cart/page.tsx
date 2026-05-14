'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatCatalogMoney } from "@/lib/catalog";
import {
  fetchShopCart,
  removeShopCartItem,
  setShopCartQuantity,
  type ShopCartItem,
} from "@/lib/shop";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ShopCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchShopCart();
      setItems(data.items ?? []);
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      setError(err.message || "Failed to load cart");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?returnUrl=${encodeURIComponent("/cart")}`);
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  const allSameCurrency = useMemo(() => {
    if (items.length === 0) return true;
    const c0 = items[0]?.currency;
    return items.every((i) => i.currency === c0);
  }, [items]);

  const shipping = subtotal > 250 || items.length === 0 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = async (productId: string, delta: number) => {
    const row = items.find((i) => i.productId === productId);
    if (!row) return;
    const next = Math.max(0, row.quantity + delta);
    try {
      if (next <= 0) {
        await removeShopCartItem(productId);
      } else {
        await setShopCartQuantity(productId, Math.min(next, row.maxQuantity));
      }
      await load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Update failed");
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await removeShopCartItem(productId);
      await load();
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || "Remove failed");
    }
  };

  if (authLoading || (!user && !error)) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
      <div className="mb-10 w-full max-w-3xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between w-full relative" role="list">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -z-10 -translate-y-1/2 rounded" />
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-10 h-10 bg-primary rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-black text-xl">shopping_cart</span>
              </span>
              <span className="absolute -bottom-8 text-sm font-bold text-[#0d1b12]">Cart</span>
            </li>
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-gray-500 text-sm">credit_card</span>
              </span>
              <span className="absolute -bottom-8 text-sm font-medium text-gray-500">Payment</span>
            </li>
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-gray-500 text-sm">local_shipping</span>
              </span>
              <span className="absolute -bottom-8 text-sm font-medium text-gray-500">Shipping</span>
            </li>
            <li className="relative flex flex-col items-center group">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full ring-4 ring-[#f5f6f8]">
                <span className="material-symbols-outlined text-gray-500 text-sm">check_circle</span>
              </span>
              <span className="absolute -bottom-8 text-sm font-medium text-gray-500">Orders</span>
            </li>
          </ol>
        </nav>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-end justify-between border-b border-[#e7f3eb] pb-4">
            <h2 className="text-3xl font-bold text-[#0d1b12]">Your Shopping Cart</h2>
            <span className="text-[#4c9a66] font-medium text-lg">
              {itemCount} {itemCount === 1 ? "Item" : "Items"}
            </span>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading cart…</p>
          ) : (
            items.map((item) => {
              const low = item.quantity >= item.maxQuantity;
              return (
                <div
                  key={item.productId}
                  className="bg-white rounded-xl p-4 shadow-sm border border-[#e7f3eb] flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="relative shrink-0 w-full sm:w-24 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-grow flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-lg font-bold text-[#0d1b12] leading-tight hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        <p className="text-[#4c9a66] text-sm mt-1">Sold by {item.sellerName}</p>
                        <p
                          className={`text-xs font-medium mt-1 w-fit px-2 py-0.5 rounded ${
                            item.maxQuantity > 0
                              ? low
                                ? "text-orange-600 bg-orange-50"
                                : "text-green-600 bg-green-50"
                              : "text-red-600 bg-red-50"
                          }`}
                        >
                          {item.maxQuantity > 0 ? `${item.maxQuantity} available` : "Out of stock"}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-[#0d1b12] shrink-0">
                        {formatCatalogMoney(item.unitPrice * item.quantity, item.currency, 2)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-4 sm:mt-2">
                      <button
                        type="button"
                        onClick={() => void removeItem(item.productId)}
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-medium group"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        <span className="group-hover:underline">Remove</span>
                      </button>
                      <div className="flex items-center rounded-lg bg-[#f6f8f6] border border-[#e7f3eb] h-9">
                        <button
                          type="button"
                          onClick={() => void updateQuantity(item.productId, -1)}
                          className="w-9 h-full flex items-center justify-center text-[#0d1b12] hover:bg-gray-200 rounded-l-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">remove</span>
                        </button>
                        <span className="w-10 text-center text-sm font-bold text-[#0d1b12]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void updateQuantity(item.productId, 1)}
                          disabled={item.quantity >= item.maxQuantity}
                          className="w-9 h-full flex items-center justify-center text-[#0d1b12] hover:bg-gray-200 rounded-r-lg transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {!loading && items.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Your cart is empty. Add items from the{" "}
              <Link href="/products" className="text-primary font-semibold underline">
                showcase
              </Link>
              .
            </p>
          )}

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#4c9a66] font-medium hover:underline mt-4"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Continue shopping
          </Link>
        </div>

        <div className="lg:col-span-4 h-fit">
          <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-[#e7f3eb] p-6">
            <h3 className="text-xl font-bold text-[#0d1b12] mb-6">Order summary</h3>
            <div className="space-y-4 border-b border-[#e7f3eb] pb-6">
              <div className="flex justify-between text-[#0d1b12]">
                <span>Subtotal</span>
                <span className="font-medium">
                  {allSameCurrency && items[0]
                    ? formatCatalogMoney(subtotal, items[0].currency, 2)
                    : "Various currencies"}
                </span>
              </div>
              <div className="flex justify-between text-[#0d1b12]">
                <span>Shipping estimate</span>
                <span className="font-medium">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-[#0d1b12]">
                <span>Tax (8%)</span>
                <span className="font-medium">
                  {allSameCurrency && items[0]
                    ? formatCatalogMoney(tax, items[0].currency, 2)
                    : `$${tax.toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="py-6">
              <div className="flex justify-between items-end mb-6">
                <span className="text-lg font-bold text-[#0d1b12]">Estimated total</span>
                <span className="text-2xl font-bold text-[#0d1b12]">
                  {allSameCurrency && items[0]
                    ? formatCatalogMoney(total, items[0].currency, 2)
                    : `$${total.toFixed(2)}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Checkout converts all lines to one currency and creates real orders (demo payment: instant).
              </p>
              <Link
                href={items.length === 0 ? "#" : "/cart/checkout"}
                className={`w-full bg-primary hover:bg-[#0fd650] text-black font-bold text-lg py-4 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
                  items.length === 0 ? "pointer-events-none opacity-50" : ""
                }`}
                onClick={(e) => {
                  if (items.length === 0) e.preventDefault();
                }}
              >
                Proceed to checkout
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
