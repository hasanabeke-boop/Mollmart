'use client';

import Link from "next/link";
import { useState } from "react";
import SellerSidebar from "../../../components/seller/SellerSidebar";

type ProductStatus = "active" | "low";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: ProductStatus;
  image: string;
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "HD-402",
    name: "Premium Headphones",
    sku: "HD-402",
    price: 249,
    stock: 45,
    status: "active",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCSZJsbgIo_6W_UYTLwUSCXipnsDnfY_qExDniCFv1Es2seR6GrOa2UmVk7MleXCGxY5QDBlmGionPmeUFT130ggpGlBZjEhv0XuWfPc5siQsi_xKMJP4K7dCcLXI6fivx-s9Rpmt8C3UzFTSL3DALUL6seiItshUK-XU9CzKfyfSfFd-H5VHRYWQfoDO_hNPzR6z9IIZE1rs2ELfCX6n7JFzf13OcyvL45y73InsBrAyoqJqyo4n5yUYX0nUcfU_EpTs3V2Jiv01Q",
  },
  {
    id: "TS-101",
    name: "Cotton Basic T-Shirt",
    sku: "TS-101",
    price: 29,
    stock: 128,
    status: "active",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7C4EVSr_kUr3TY7Fbdi7aiGjZeXoBnN9_7uK3my4sDFhwTK5v5X1xT9VgSKBuMaEZrmLrq3wc76YvNAOhqsJ5umLaSLAOma3eANxXyAscYbujRnquI1m9faQLtm4RasUauR297Eeu-HKKhIdxDPOiUuH6gcp08oCQ2eh9DU_OL5tk6AIbwfMWkVd2VnE7-KQEOr5p7eAbwlSThwYt4FEf6IjbSJlmbG2qbx5b06dDjiqLge4FWV3FRfYrmY-iXkoBepLLfWolbro",
  },
  {
    id: "HL-990",
    name: "Hydrating Lotion",
    sku: "HL-990",
    price: 15.5,
    stock: 5,
    status: "low",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcq_HnNPNfBX_yT84DFCO826McWkn7XcohuEPIlGRQ-yb974hbj_2FykiuMGfL_Nf_r7OnfiuzpkaZrcsz9UWAAOxJcObYhC7xDG7ezFvnp3RWSj1h_zsbttxAbd3sRq5v7Oew3q9wMwb1nRatFwgq7Fmgp3jtQlr2DU2MWUDdDqNpLzvfzdhaUC-3tUZPeZDe-39l8mFawSICUkkQV7T5r2ts_dNXHtPz8sD9-t4xQkmxGB9WxYPB-HdSPLAP7Z_bSeinlWfpBsU",
  },
];

const DEMAND_ITEMS = [
  { rank: 1, name: "Ergonomic Chairs", level: "High" as const },
  { rank: 2, name: "Wireless Earbuds", level: "High" as const },
  { rank: 3, name: "Smart Watches", level: "Med" as const },
];

export default function SellerDashboardPage() {
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);

  const handleAddProduct = () => {
    alert("Add Product flow (demo).");
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#f5f6f8]">
      <SellerSidebar active="dashboard" />

      {/* Main content area */}
      <main className="flex h-full flex-1 flex-col overflow-y-auto">
        {/* Top inner header */}
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#e7f3eb] bg-white/90 px-6 backdrop-blur">
          {/* Search */}
          <div className="hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-symbols-outlined text-gray-400">search</span>
              </div>
              <input
                className="block w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm text-[#0d1b12] placeholder-gray-500 focus:ring-2 focus:ring-primary"
                placeholder="Search products, orders..."
                type="text"
              />
            </div>
          </div>
          {/* Right actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:text-black"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Link>
            <button
              type="button"
              onClick={handleAddProduct}
              className="hidden h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-black transition-transform hover:scale-105 md:flex"
            >
              <span className="mr-2 material-symbols-outlined text-[20px]">add</span>
              Add Product
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Page heading */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#0d1b12]">Dashboard</h2>
              <p className="mt-1 text-gray-600">
                Welcome back, Alex. Here&apos;s what&apos;s happening with your store today.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddProduct}
              className="flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-bold text-black md:hidden"
            >
              <span className="mr-2 material-symbols-outlined">add</span>
              Add Product
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="payments"
              iconBg="bg-green-50 text-green-700"
              label="Total Revenue"
              value="$12,450"
              trend="+12.5%"
              trendUp
            />
            <StatCard
              icon="shopping_cart"
              iconBg="bg-blue-50 text-blue-700"
              label="Total Sales"
              value="128"
              trend="+5.2%"
              trendUp
            />
            <StatCard
              icon="visibility"
              iconBg="bg-purple-50 text-purple-700"
              label="Store Views"
              value="1.2k"
              trend="+8.4%"
              trendUp
            />
            <StatCard
              icon="show_chart"
              iconBg="bg-orange-50 text-orange-700"
              label="Conversion Rate"
              value="3.2%"
              trend="-1.2%"
              trendUp={false}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Demand Insights */}
            <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between border-b border-[#e7f3eb] p-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  <h3 className="text-lg font-bold text-[#0d1b12]">Demand Insights</h3>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Full report (demo).")}
                  className="text-xs font-bold text-gray-500 hover:text-primary"
                >
                  View Report
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <p className="text-sm text-gray-600">
                  High demand detected in{" "}
                  <span className="font-bold text-[#0d1b12]">Home Office</span> category.
                </p>
                <div className="space-y-3">
                  {DEMAND_ITEMS.map((item) => (
                    <div
                      key={item.rank}
                      className="group flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-green-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-gray-400 shadow-sm">
                          {item.rank}
                        </div>
                        <span className="text-sm font-medium text-[#0d1b12]">{item.name}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs font-bold ${
                          item.level === "High"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {item.level}
                        <span className="material-symbols-outlined text-[16px]">
                          {item.level === "High" ? "local_fire_department" : "trending_flat"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-lg bg-primary/10 p-4">
                  <p className="text-xs font-medium text-gray-800">
                    💡 Tip: Adding products in &quot;Home Office&quot; could increase visibility by 24%.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Products table */}
            <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#e7f3eb] p-5">
                <h3 className="text-lg font-bold text-[#0d1b12]">Active Products</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => alert("Filter (demo).")}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Filter
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Export (demo).")}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Product Name</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Stock</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 flex-shrink-0 rounded-lg bg-gray-100 bg-center bg-cover"
                              style={{ backgroundImage: `url("${product.image}")` }}
                            />
                            <div>
                              <p className="font-bold text-[#0d1b12]">{product.name}</p>
                              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-[#0d1b12]">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{product.stock} in stock</td>
                        <td className="px-6 py-4">
                          {product.status === "active" ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Actions for ${product.name} (demo).`)}
                            className="text-gray-400 hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              more_vert
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#e7f3eb] p-4 text-center">
                <Link
                  href="/products"
                  className="text-sm font-bold text-green-700 hover:text-green-800"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  trend,
  trendUp,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span
          className={`flex items-center text-xs font-medium ${
            trendUp ? "text-green-600" : "text-red-500"
          }`}
        >
          {trend}
          <span className="material-symbols-outlined text-sm">
            {trendUp ? "arrow_upward" : "arrow_downward"}
          </span>
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <h3 className="mt-1 text-2xl font-bold text-[#0d1b12]">{value}</h3>
      </div>
    </div>
  );
}
