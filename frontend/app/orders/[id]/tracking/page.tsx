'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ORDERS } from "../../data";

const BASE_EVENTS = [
  {
    title: "Arrived at Sort Facility",
    location: "Columbus, OH, United States",
    time: "Today, 8:45 AM",
  },
  {
    title: "Departed from Facility",
    location: "Louisville, KY, United States",
    time: "Oct 23, 11:20 PM",
  },
  {
    title: "Package Received by Carrier",
    location: "Lexington, KY, United States",
    time: "Oct 22, 4:15 PM",
  },
];

export default function OrderTrackingPage() {
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
  const [showFullHistory, setShowFullHistory] = useState(false);

  if (!order) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 py-12">
        <h1 className="text-2xl font-bold text-[#0d1b12] mb-2">
          Tracking not found
        </h1>
        <p className="text-sm text-[#4c9a66] mb-4">
          We couldn&apos;t find tracking info for order{" "}
          <span className="font-mono">#{params.id}</span>.
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

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(order.trackingNumber);
      alert("Tracking number copied to clipboard.");
    } catch {
      alert("Unable to copy tracking number.");
    }
  };

  const events = showFullHistory
    ? [
        ...BASE_EVENTS,
        {
          title: "Label Created",
          location: "Lexington, KY, United States",
          time: "Oct 22, 1:05 PM",
        },
      ]
    : BASE_EVENTS;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col bg-[#f5f6f8] text-[#0d1b12]">
      <div className="layout-container flex h-full grow flex-col max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-[#4c9a66] mb-6">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link href="/orders" className="hover:underline">
            Orders
          </Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-medium text-[#0d1b12]">
            Order #{order.id}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: main tracking */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-end gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[#0d1b12] text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Track Your Order
                </h1>
                <p className="text-[#4c9a66]">
                  Order #{order.id} • Placed on{" "}
                  {new Date(order.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("Invoice view is demo-only.")}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                View Invoice
              </button>
            </div>

            {/* Main status card */}
            <div className="bg-white rounded-xl shadow p-6 md:p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-[#0d1b12] tracking-tight text-2xl font-bold leading-tight">
                  Arriving by {order.arrivedBy || "soon"}
                </h2>
              </div>

              {/* Visual tracker */}
              <div className="w-full py-4">
                <div className="relative flex items-center justify-between w-full">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-[#e7f3eb] rounded-full -z-0" />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full -z-0"
                    style={{ width: "60%" }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#0d1b12] shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0d1b12] hidden sm:block">
                      Order Placed
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#0d1b12] shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0d1b12] hidden sm:block">
                      Processing
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[#0d1b12] shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0d1b12] hidden sm:block">
                      Shipped
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white border-[3px] border-primary flex items-center justify-center text-primary shadow-md transform scale-110">
                      <span className="material-symbols-outlined text-[20px] animate-pulse">
                        move_location
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary hidden sm:block">
                      In Transit
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#e7f3eb] border-2 border-transparent flex items-center justify-center text-[#4c9a66]">
                      <span className="material-symbols-outlined text-[18px]">package_2</span>
                    </div>
                    <span className="text-xs font-medium text-[#4c9a66] hidden sm:block">
                      Delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* Carrier info */}
              <div className="mt-10 p-4 bg-[#f8fcf9] rounded-lg flex flex-wrap gap-6 items-center border border-[#e7f3eb]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center p-1 shadow-sm">
                    <img
                      alt={`${order.carrier} logo`}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVSETwtVNdXkZfhgReFlu4ik6e04IeqgG1kdrgWOxdus4AWnTHMHd-5lxy5FQsUZhksXM6eHcZqO0znO2psIslZavHOw9GRC2btTKhmPbDdD0x0rqf51CfXKXseOH1MmWQux1ifmfx3c6TylA3nMnAwaIZmNL_43GhELRqX6DsNHjyDD9P5HJubRaM5QYsUyBiChXb8kWugsrjyr-Ikzu6PtYonCdXCnlfatH61k5vHE2hRWh-n85cLUT18TJ5BygaNHQ7oWbtmtc"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#4c9a66] uppercase font-bold tracking-wider">
                      Carrier
                    </span>
                    <span className="text-sm font-semibold text-[#0d1b12]">
                      {order.carrier}
                    </span>
                  </div>
                </div>
                <div className="w-px h-8 bg-[#e7f3eb] hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-xs text-[#4c9a66] uppercase font-bold tracking-wider">
                    Tracking Number
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTracking}
                    className="flex items-center gap-2 group"
                  >
                    <span className="text-sm font-semibold text-[#0d1b12] group-hover:text-primary transition-colors">
                      {order.trackingNumber}
                    </span>
                    <span className="material-symbols-outlined text-[14px] text-[#4c9a66]">
                      content_copy
                    </span>
                  </button>
                </div>
                <div className="sm:ml-auto">
                  <a
                    href="#"
                    className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    Visit Carrier Site
                    <span className="material-symbols-outlined text-[16px]">
                      open_in_new
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow p-6 md:p-8 border border-gray-100 mt-6">
              <h3 className="text-lg font-bold text-[#0d1b12] mb-6">
                Tracking History
              </h3>
              <div className="relative pl-4 border-l-2 border-[#e7f3eb] flex flex-col gap-8">
                {events.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="relative">
                    <div
                      className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ring-4 ring-white ${
                        index === 0 ? "bg-primary" : "bg-[#e7f3eb]"
                      }`}
                    />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                      <div>
                        <p className="text-base font-semibold text-[#0d1b12]">
                          {event.title}
                        </p>
                        <p className="text-sm text-[#4c9a66]">{event.location}</p>
                      </div>
                      <div className="text-sm font-medium text-[#0d1b12] opacity-70">
                        {event.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowFullHistory((prev) => !prev)}
                className="mt-6 text-sm font-bold text-primary flex items-center gap-1 hover:underline"
              >
                {showFullHistory ? "Hide history" : "See full history"}
                <span className="material-symbols-outlined text-[18px]">
                  {showFullHistory ? "expand_less" : "expand_more"}
                </span>
              </button>
            </div>
          </div>

          {/* Right: summary + help */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
              <h3 className="text-base font-bold text-[#0d1b12] mb-4">
                Items in this shipment (1)
              </h3>
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-lg bg-gray-100 bg-center bg-cover border border-gray-100 flex-shrink-0"
                  style={{ backgroundImage: `url("${order.thumbnail}")` }}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-[#0d1b12] leading-snug">
                    {order.productName}
                  </p>
                  <p className="text-xs text-[#4c9a66]">Qty: 1</p>
                  <p className="text-xs text-[#0d1b12] mt-1">
                    Total: ${order.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
              <h3 className="text-base font-bold text-[#0d1b12] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#4c9a66]">
                  location_on
                </span>
                Shipping Address
              </h3>
              <div className="pl-7">
                <p className="text-sm font-semibold text-[#0d1b12]">John Doe</p>
                <p className="text-sm text-[#4c9a66] leading-relaxed">
                  1234 Green Leaf Blvd, Apt 4B
                  <br />
                  Columbus, OH 43085
                  <br />
                  United States
                </p>
              </div>
            </div>

            <div className="bg-[#f8fcf9] rounded-xl border border-dashed border-primary/40 p-5 flex flex-col items-center text-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <h3 className="text-sm font-bold text-[#0d1b12]">
                Have an issue with your order?
              </h3>
              <p className="text-xs text-[#4c9a66] mb-1">
                Our support team is available 24/7 to help you.
              </p>
              <button
                type="button"
                onClick={() => alert("Support contact is demo-only.")}
                className="w-full h-9 rounded-lg bg-white border border-gray-200 text-[#0d1b12] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

