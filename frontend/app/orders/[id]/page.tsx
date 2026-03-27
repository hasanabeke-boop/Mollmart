'use client';

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ORDERS } from "../data";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const normalizedId = String(params.id || "").replace(/^#/, "").trim();
  const order = useMemo(
    () =>
      ORDERS.find(
        (o) =>
          o.id === normalizedId ||
          o.shortId.replace(/^#/, "") === normalizedId,
      ),
    [normalizedId],
  );

  if (!order) {
    return (
      <div className="w-full max-w-[1280px] mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[#0d1b12] mb-2">
          Order not found
        </h1>
        <p className="text-sm text-[#4c9a66] mb-4">
          We couldn&apos;t find an order with ID <span className="font-mono">#{params.id}</span>.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to orders
        </Link>
      </div>
    );
  }

  const placedOn = new Date(order.date).toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm font-medium text-[#4c9a66] mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/orders" className="hover:text-primary transition-colors">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#0d1b12] font-semibold">
          Order #{order.id}
        </span>
      </nav>

      {/* Heading & actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0d1b12] tracking-tight mb-2">
            Order Details #{order.id}
          </h1>
          <p className="text-[#4c9a66]">
            Placed on {placedOn} • 1 Item • Total ${order.total.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => alert("Invoice download is demo-only.")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e7f3eb] bg-white text-[#0d1b12] text-sm font-bold hover:bg-[#f5f6f8] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            Download Invoice
          </button>
          <button
            type="button"
            onClick={() => alert("Support flow is demo-only.")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e7f3eb] bg-white text-[#0d1b12] text-sm font-bold hover:bg-[#f5f6f8] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">help</span>
            Get Help
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: status + items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Status card */}
          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#0d1b12]">Order Status</h3>
                <p className="text-primary font-bold text-xl mt-1">
                  {order.status === "delivered"
                    ? "Delivered"
                    : order.status === "shipped"
                    ? "Shipped - On the way"
                    : order.status === "processing"
                    ? "Processing"
                    : "Cancelled"}
                </p>
              </div>
              <Link
                href={`/orders/${order.id}/tracking`}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-[#0d1b12] text-sm font-bold hover:opacity-90 transition-opacity w-full sm:w-auto shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined">local_shipping</span>
                Track Package
              </Link>
            </div>

            {/* Progress bar (simple, не динамический пока) */}
            <div className="relative w-full">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-[#e7f3eb] -translate-y-1/2 rounded-full z-0" />
              <div className="absolute top-1/2 left-0 w-3/4 h-1 bg-primary -translate-y-1/2 rounded-full z-0" />
              <div className="relative z-10 flex justify-between w-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                  <span className="text-xs font-semibold text-[#0d1b12]">Ordered</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                  <span className="text-xs font-semibold text-[#0d1b12]">Processing</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-6 rounded-full bg-primary border-4 border-white shadow-md flex items-center justify-center">
                    <div className="size-2 bg-[#0d1b12] rounded-full" />
                  </div>
                  <span className="text-xs font-bold text-primary">
                    {order.status === "delivered" ? "Delivered" : "Shipped"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 opacity-50">
                  <div className="size-4 rounded-full bg-[#e7f3eb] border-4 border-white" />
                  <span className="text-xs font-medium text-[#4c9a66]">Done</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#4c9a66] mt-6 bg-[#f5f6f8] p-3 rounded-lg flex gap-2 items-start">
              <span className="material-symbols-outlined text-[18px] mt-0.5">info</span>
              Latest update: package has arrived at the distribution facility.
            </p>
          </div>

          {/* Items (один основной товар для примера) */}
          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-6">Items in this Order</h3>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4 pb-6 border-b border-[#e7f3eb] last:border-0 last:pb-0">
                <div
                  className="size-24 sm:size-32 rounded-lg bg-cover bg-center border border-[#e7f3eb] shrink-0"
                  style={{ backgroundImage: `url("${order.thumbnail}")` }}
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-[#0d1b12] text-lg">{order.productName}</h4>
                        <p className="text-sm text-[#4c9a66] mt-1">
                          Order ID: <span className="font-mono">#{order.id}</span>
                        </p>
                      </div>
                      <p className="font-bold text-[#0d1b12] text-lg">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-[#e7f3eb] text-xs font-semibold text-[#0d1b12]">
                      Qty: 1
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      type="button"
                      onClick={() => alert("Re-order flow is demo-only.")}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Buy Again
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Review flow is demo-only.")}
                      className="text-sm font-semibold text-[#4c9a66] hover:text-[#0d1b12] transition-colors"
                    >
                      Write a Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: address, payment, summary */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4c9a66]">location_on</span>
              Shipping Address
            </h3>
            <address className="not-italic text-sm text-[#0d1b12] leading-relaxed">
              <span className="font-bold block mb-1">John Doe</span>
              1234 Green Leaf Blvd, Apt 4B
              <br />
              Columbus, OH 43085
              <br />
              United States
              <span className="text-[#4c9a66] mt-2 block">
                Phone: +1 (555) 123-4567
              </span>
            </address>
          </div>

          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4c9a66]">credit_card</span>
              Payment Method
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-8 w-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                <span className="font-bold text-xs italic text-blue-800">VISA</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#0d1b12]">
                  Visa ending in 4242
                </p>
                <p className="text-xs text-[#4c9a66]">Expires 12/26</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e7f3eb] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d1b12] mb-4">Order Summary</h3>
            <div className="flex flex-col gap-3 pb-4 border-b border-[#e7f3eb]">
              <div className="flex justify-between text-sm">
                <span className="text-[#4c9a66]">Subtotal (1 item)</span>
                <span className="font-medium text-[#0d1b12]">
                  ${order.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4c9a66]">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4c9a66]">Estimated Tax</span>
                <span className="font-medium text-[#0d1b12]">
                  ${(order.total * 0.07).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="font-bold text-lg text-[#0d1b12]">Order Total</span>
              <span className="font-bold text-2xl text-[#0d1b12]">
                ${(order.total * 1.07).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 text-center">
            <p className="text-sm text-[#0d1b12] mb-2">
              Have an issue with your order?
            </p>
            <button
              type="button"
              onClick={() => alert("Support contact is demo-only.")}
              className="text-sm font-bold text-primary hover:underline"
            >
              Contact Customer Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

