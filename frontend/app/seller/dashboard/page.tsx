'use client';

import Link from "next/link";
import SellerSidebar from "../../../components/seller/SellerSidebar";

type RequestLead = {
  id: string;
  title: string;
  category: string;
  budget: string;
  deadline: string;
  status: "new" | "matched" | "hot";
};

const LEADS: RequestLead[] = [
  {
    id: "REQ-1024",
    title: "Need 20 ergonomic office chairs",
    category: "Home & Office",
    budget: "$3,000",
    deadline: "May 20",
    status: "hot",
  },
  {
    id: "REQ-1028",
    title: "Looking for branded support headsets",
    category: "Electronics",
    budget: "$4,000",
    deadline: "May 24",
    status: "new",
  },
  {
    id: "REQ-1035",
    title: "Wholesale request for custom T-shirts",
    category: "Fashion",
    budget: "$2,500",
    deadline: "May 28",
    status: "matched",
  },
];

const INSIGHTS = [
  { rank: 1, name: "Office furniture", level: "High" as const },
  { rank: 2, name: "Wireless audio", level: "High" as const },
  { rank: 3, name: "Custom apparel", level: "Med" as const },
];

export default function SellerDashboardPage() {
  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#f5f6f8]">
      <SellerSidebar active="dashboard" />

      <main className="flex h-full flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-[#e7f3eb] bg-white/90 px-6 backdrop-blur">
          <div className="hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-symbols-outlined text-gray-400">search</span>
              </div>
              <input
                className="block w-full rounded-lg border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm text-[#0d1b12] placeholder-gray-500 focus:ring-2 focus:ring-primary"
                placeholder="Search requests, offers, or conversations..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:text-black"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Link>
            <Link
              href="/browse-buyer-requests"
              className="hidden h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-black transition-transform hover:scale-105 md:flex"
            >
              <span className="mr-2 material-symbols-outlined text-[20px]">travel_explore</span>
              Browse Requests
            </Link>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#0d1b12]">Seller Dashboard</h2>
              <p className="mt-1 text-gray-600">
                Track incoming demand, offer activity, and conversations from matched buyers.
              </p>
            </div>
            <Link
              href="/browse-buyer-requests"
              className="flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-bold text-black md:w-auto md:px-5"
            >
              <span className="mr-2 material-symbols-outlined">travel_explore</span>
              Find New Leads
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="travel_explore" iconBg="bg-green-50 text-green-700" label="Matched Requests" value="48" trend="+12%" trendUp />
            <StatCard icon="local_offer" iconBg="bg-blue-50 text-blue-700" label="Offers Sent" value="19" trend="+4%" trendUp />
            <StatCard icon="chat" iconBg="bg-purple-50 text-purple-700" label="Active Chats" value="7" trend="+2" trendUp />
            <StatCard icon="speed" iconBg="bg-orange-50 text-orange-700" label="Response Rate" value="68%" trend="-1.5%" trendUp={false} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between border-b border-[#e7f3eb] p-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  <h3 className="text-lg font-bold text-[#0d1b12]">Demand Signals</h3>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <p className="text-sm text-gray-600">
                  The strongest buyer activity today is in <span className="font-bold text-[#0d1b12]">Home &amp; Office</span>.
                </p>
                <div className="space-y-3">
                  {INSIGHTS.map((item) => (
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
                          item.level === "High" ? "text-green-600" : "text-yellow-600"
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
                    Tip: sellers responding within the first hour tend to get more buyer replies.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#e7f3eb] p-5">
                <h3 className="text-lg font-bold text-[#0d1b12]">Best Matching Requests</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Filter
                  </button>
                  <Link
                    href="/browse-buyer-requests"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Request</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Budget</th>
                      <th className="px-6 py-4 font-medium">Deadline</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {LEADS.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-[#0d1b12]">{lead.title}</p>
                            <p className="text-xs text-gray-500">{lead.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{lead.category}</td>
                        <td className="px-6 py-4 font-medium text-[#0d1b12]">{lead.budget}</td>
                        <td className="px-6 py-4 text-gray-600">{lead.deadline}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            lead.status === "hot"
                              ? "bg-red-100 text-red-700"
                              : lead.status === "new"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-[#e7f3eb] p-4 text-center">
                <Link
                  href="/browse-buyer-requests"
                  className="text-sm font-bold text-green-700 hover:text-green-800"
                >
                  Open Request Board
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
        <span className={`flex items-center text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
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
