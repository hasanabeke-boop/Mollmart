'use client';

import { useState } from "react";
import SellerSidebar from "../../../components/seller/SellerSidebar";
import KpiCard from "../../../components/KpiCard";

type Range = "7d" | "month" | "lastMonth" | "ytd";
type ChartPoint = { label: string; value: number };

const RESPONSE_DATA: Record<Range, ChartPoint[]> = {
  "7d": [
    { label: "Mon", value: 7 },
    { label: "Tue", value: 10 },
    { label: "Wed", value: 8 },
    { label: "Thu", value: 13 },
    { label: "Fri", value: 12 },
    { label: "Sat", value: 15 },
    { label: "Sun", value: 11 },
  ],
  month: [
    { label: "W1", value: 42 },
    { label: "W2", value: 51 },
    { label: "W3", value: 47 },
    { label: "W4", value: 58 },
  ],
  lastMonth: [
    { label: "W1", value: 34 },
    { label: "W2", value: 39 },
    { label: "W3", value: 41 },
    { label: "W4", value: 43 },
  ],
  ytd: [
    { label: "Jan", value: 112 },
    { label: "Feb", value: 126 },
    { label: "Mar", value: 140 },
    { label: "Apr", value: 152 },
    { label: "May", value: 165 },
    { label: "Jun", value: 178 },
  ],
};

const MATCH_ROWS = [
  { name: "Office furniture", requests: 28, offers: 13, rate: "46%" },
  { name: "Electronics", requests: 31, offers: 16, rate: "52%" },
  { name: "Apparel", requests: 14, offers: 7, rate: "50%" },
];

export default function SellerAnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const data = RESPONSE_DATA[range];

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#f5f6f8]">
      <SellerSidebar active="analytics" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#0d1b12]">
              Seller Analytics
            </h2>
            <p className="text-[#4c9a66] text-base">
              Measure request coverage, offer activity, and conversion into active conversations.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e7f3eb] bg-white hover:bg-[#f5f6f8] text-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-[#0fd650] text-black text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">insights</span>
              Generate Insights
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {(["7d", "month", "lastMonth", "ytd"] as Range[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`px-4 py-2 rounded-full border text-sm font-medium ${
                range === item
                  ? "bg-primary text-black border-primary"
                  : "bg-white text-[#0d1b12] border-[#e7f3eb] hover:border-primary/50"
              }`}
            >
              {item === "7d" ? "Last 7 Days" : item === "month" ? "This Month" : item === "lastMonth" ? "Last Month" : "Year to Date"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon="travel_explore" title="Matched Requests" value="48" delta="+12%" positive />
          <KpiCard icon="local_offer" title="Offers Sent" value="19" delta="+4%" positive />
          <KpiCard icon="chat" title="Chats Opened" value="7" delta="+2" positive />
          <KpiCard icon="speed" title="Offer Acceptance" value="21%" delta="+1.3%" positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white border border-[#e7f3eb] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#0d1b12]">Offer Activity</h3>
                <p className="text-sm text-[#4c9a66]">How many relevant buyer requests you responded to.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-primary" />
                <span className="text-sm font-medium text-[#0d1b12]">Offers Sent</span>
              </div>
            </div>
            <div className="space-y-4">
              {data.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#0d1b12] font-medium">{point.label}</span>
                    <span className="text-[#4c9a66]">{point.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#e7f3eb] overflow-hidden">
                    <div className="h-3 rounded-full bg-primary" style={{ width: `${Math.min(point.value * 5, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-black to-[#053f18] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">query_stats</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">auto_graph</span>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">
                  Request Pulse
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">Office & electronics demand is rising</h4>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                The best-performing sellers right now respond early, mention delivery timing, and keep offers concise.
              </p>
              <button
                type="button"
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-white text-black font-bold text-sm transition-colors"
              >
                View Matching Requests
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <div className="rounded-xl bg-white border border-[#e7f3eb] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e7f3eb] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0d1b12]">Category Match Performance</h3>
              <button type="button" className="text-sm font-medium text-primary hover:underline">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f5f6f8]">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">
                      Category
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">
                      Requests
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">
                      Offers
                    </th>
                    <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-center">
                      Match Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7f3eb]">
                  {MATCH_ROWS.map((row) => (
                    <tr key={row.name} className="hover:bg-[#f5f6f8] transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-[#0d1b12]">{row.name}</td>
                      <td className="py-4 px-6 text-sm text-right text-[#4c9a66]">{row.requests}</td>
                      <td className="py-4 px-6 text-sm text-right text-[#4c9a66]">{row.offers}</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {row.rate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-[#e7f3eb] shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#0d1b12]">Conversation Outcomes</h3>
              <button type="button" className="text-[#4c9a66] hover:text-primary">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <InsightRow label="Offers leading to chat" value="37%" colorClass="bg-primary" />
              <InsightRow label="Chats still active" value="58%" colorClass="bg-[#053f18]" />
              <InsightRow label="Requests ignored" value="12%" colorClass="bg-[#e7f3eb]" />
              <div className="pt-4 border-t border-[#e7f3eb] mt-4 text-xs text-[#4c9a66]">
                <span className="font-bold text-primary">Insight:</span> The strongest results come from offers with clear pricing and specific next steps.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InsightRow({ label, value, colorClass }: { label: string; value: string; colorClass: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`size-3 rounded-full ${colorClass}`} />
        <span className="font-medium text-[#0d1b12]">{label}</span>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}
