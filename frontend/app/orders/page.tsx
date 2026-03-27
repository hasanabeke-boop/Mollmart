'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { ORDERS, type Order, type OrderStatus } from "./data";

const STATUS_TABS: { id: "all" | OrderStatus; label: string }[] = [
  { id: "all", label: "All Orders" },
  { id: "shipped", label: "Active" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 5;

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]["id"]>("all");
  const [period, setPeriod] = useState("30");
  const [page, setPage] = useState(1);

  const filteredOrders = useMemo(() => {
    let data: Order[] = ORDERS;
    if (activeTab !== "all") {
      data = data.filter((o) => o.status === activeTab);
    }
    // Пример фильтра по периоду — пока просто имитация (без реальной даты)
    if (period === "30") {
      return data;
    }
    if (period === "90") {
      return data;
    }
    return data;
  }, [activeTab, period]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

  const handleTabChange = (id: (typeof STATUS_TABS)[number]["id"]) => {
    setActiveTab(id);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0d1b12] mb-2 tracking-tight">
          My Orders
        </h1>
        <p className="text-[#4c9a66]">
          Manage your recent orders, track shipments, and download invoices.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center border-b border-[#cfe7d7] mb-6 gap-4">
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar gap-8">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 border-b-[3px] text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-[#0d1b12] font-bold"
                  : "border-transparent text-[#4c9a66] hover:text-[#0d1b12]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto pb-2 sm:pb-0">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setPage(1);
              }}
              className="appearance-none bg-white border border-[#cfe7d7] text-[#0d1b12] text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-3 pr-8 py-2 cursor-pointer"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#4c9a66]">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#cfe7d7] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#4c9a66] uppercase bg-[#f8fcf9] border-b border-[#cfe7d7]">
              <tr>
                <th className="px-6 py-4 font-semibold w-16" scope="col">
                  Product
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Order Details
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Date
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold" scope="col">
                  Total
                </th>
                <th className="px-6 py-4 font-semibold text-right" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#cfe7d7]">
              {pageItems.map((order) => (
                <tr
                  key={order.id}
                  className="bg-white hover:bg-[#f8fcf9] transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div
                      className="size-12 rounded-lg bg-gray-100 bg-cover bg-center border border-gray-100"
                      style={{ backgroundImage: `url("${order.thumbnail}")` }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#0d1b12]">{order.productName}</div>
                    <div className="text-xs text-[#4c9a66] mt-1">
                      ID: <span className="font-mono">#{order.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#0d1b12] opacity-80">
                    {new Date(order.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    {order.status === "delivered" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        <span className="size-1.5 rounded-full bg-green-500" />
                        Delivered
                      </span>
                    )}
                    {order.status === "shipped" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        Shipped
                      </span>
                    )}
                    {order.status === "processing" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                        <span className="size-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        Processing
                      </span>
                    )}
                    {order.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                        <span className="size-1.5 rounded-full bg-red-500" />
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#0d1b12]">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === "shipped" ? (
                      <Link
                        href={`/orders/${order.id}/tracking`}
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-primary text-[#0d1b12] font-bold text-xs tracking-wide uppercase hover:bg-[#4a63e8] transition-colors shadow-sm shadow-primary/20"
                      >
                        Track
                      </Link>
                    ) : (
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-primary hover:text-green-600 font-medium text-sm inline-flex items-center gap-1 transition-colors"
                      >
                        Details
                        <span className="material-symbols-outlined text-base">
                          arrow_forward
                        </span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-[#4c9a66]"
                  >
                    No orders for this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#cfe7d7] px-6 py-4 bg-[#f8fcf9]">
          <div className="text-sm text-[#4c9a66]">
            Showing{" "}
            <span className="font-semibold text-[#0d1b12]">
              {filteredOrders.length === 0 ? 0 : startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[#0d1b12]">
              {Math.min(startIndex + PAGE_SIZE, filteredOrders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#0d1b12]">
              {filteredOrders.length}
            </span>{" "}
            results
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center justify-center size-9 rounded-lg border border-[#cfe7d7] bg-white text-[#0d1b12] hover:bg-[#e7f3eb] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="flex items-center justify-center size-9 rounded-lg bg-primary text-[#0d1b12] font-bold text-sm shadow-sm">
              {currentPage}
            </button>
            {currentPage < totalPages && (
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center justify-center size-9 rounded-lg border border-transparent hover:bg-[#e7f3eb] text-[#4c9a66] text-sm transition-colors"
              >
                {currentPage + 1}
              </button>
            )}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center size-9 rounded-lg border border-[#cfe7d7] bg-white text-[#0d1b12] hover:bg-[#e7f3eb] transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

