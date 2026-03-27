'use client';

import { useState } from "react";
import SellerSidebar from "../../../components/seller/SellerSidebar";
import KpiCard from "../../../components/KpiCard";

type Range = "7d" | "month" | "lastMonth" | "ytd" | "custom";

export default function SellerAnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customData, setCustomData] = useState<ChartPoint[] | null>(null);

  const handleExport = () => {
    alert(`Exporting analytics for range: ${range}`);
  };

  const handleNewReport = () => {
    alert("New report creation flow (demo).");
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) {
      alert("Please select both start and end dates.");
      return;
    }
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      alert("Invalid dates.");
      return;
    }
    if (start > end) {
      alert("Start date must be before end date.");
      return;
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
    const pointsCount = Math.max(2, Math.min(10, diffDays));

    const base = SALES_DATA["7d"];
    const custom: ChartPoint[] = Array.from({ length: pointsCount }).map(
      (_, index) => {
        const basePoint = base[index % base.length];
        const d = new Date(start.getTime() + index * (diffDays > 10 ? (diffDays / pointsCount) * MS_PER_DAY : MS_PER_DAY));
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        const factor = 0.85 + (index / Math.max(pointsCount - 1, 1)) * 0.3;
        return { label, value: Math.round(basePoint.value * factor) };
      },
    );

    setCustomData(custom);
    setRange("custom");
    setShowCustom(false);
  };

  const kpi = getKpiValues(range, customData);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#f5f6f8]">
      <SellerSidebar active="analytics" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#0d1b12]">
            Analytics Dashboard
          </h2>
          <p className="text-[#4c9a66] text-base">
            Overview of your store performance and market insights.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e7f3eb] bg-white hover:bg-[#f5f6f8] text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          <button
            type="button"
            onClick={handleNewReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-[#0fd650] text-black text-sm font-bold shadow-lg shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Report
          </button>
        </div>
      </div>

      {/* Range chips */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 no-scrollbar">
          <RangeChip label="Last 7 Days" value="7d" range={range} setRange={setRange} primary />
          <RangeChip label="This Month" value="month" range={range} setRange={setRange} />
          <RangeChip label="Last Month" value="lastMonth" range={range} setRange={setRange} />
          <RangeChip label="Year to Date" value="ytd" range={range} setRange={setRange} />
        </div>
        <div className="h-6 w-px bg-[#e7f3eb] mx-2 shrink-0" />
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowCustom((prev) => !prev)}
            className={`flex items-center gap-1 text-sm font-medium whitespace-nowrap transition-colors ${
              range === "custom"
                ? "text-primary"
                : "text-[#4c9a66] hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              calendar_month
            </span>
            Custom Range
          </button>
          {showCustom && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[#e7f3eb] bg-white shadow-xl p-4 z-50 space-y-3">
              <div className="text-xs font-semibold text-[#4c9a66] uppercase tracking-wide">
                Select custom range
              </div>
              <div className="flex gap-3">
                <label className="flex-1 flex flex-col gap-1 text-xs text-[#4c9a66]">
                  Start date
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 rounded-md border border-[#e7f3eb] px-2 text-sm text-[#0d1b12] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="flex-1 flex flex-col gap-1 text-xs text-[#4c9a66]">
                  End date
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 rounded-md border border-[#e7f3eb] px-2 text-sm text-[#0d1b12] focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-[#4c9a66] hover:text-primary"
                  onClick={() => setShowCustom(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-bold rounded-md bg-primary text-black hover:bg-[#0fd650]"
                  onClick={applyCustomRange}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon="payments"
          title="Total Revenue"
          value={`$${kpi.revenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          delta={kpi.deltaRevenue}
          positive={kpi.deltaRevenue.startsWith("+")}
        />
        <KpiCard
          icon="shopping_bag"
          title="Total Orders"
          value={kpi.orders.toLocaleString()}
          delta={kpi.deltaOrders}
          positive={kpi.deltaOrders.startsWith("+")}
        />
        <KpiCard
          icon="receipt_long"
          title="Avg. Order Value"
          value={`$${kpi.avgOrderValue.toFixed(2)}`}
          delta={kpi.deltaAov}
          positive={kpi.deltaAov.startsWith("+")}
        />
        <KpiCard
          icon="trending_up"
          title="Conversion Rate"
          value={`${kpi.conversionRate.toFixed(1)}%`}
          delta={kpi.deltaConv}
          positive={kpi.deltaConv.startsWith("+")}
        />
      </div>

      {/* Chart section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart range={range} customData={customData} />

        {/* Right column: demand + tips (статично) */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-gradient-to-br from-black to-[#053f18] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">trending_up</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">auto_graph</span>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">
                  Market Demand
                </span>
              </div>
              <h4 className="text-xl font-bold mb-2">Vintage Denim is trending</h4>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Searches for &quot;Vintage Denim&quot; are up 20% this week. Consider adding more
                stock.
              </p>
              <button
                type="button"
                onClick={() => alert("Viewing opportunities (demo).")}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-white text-black font-bold text-sm transition-colors"
              >
                View Opportunities
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-[#e7f3eb] p-6 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#4c9a66] mb-4">
              Selling Tips
            </h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 items-start">
                <div className="min-w-6 pt-0.5 text-primary">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div>
                  <span className="font-medium block mb-0.5 text-[#0d1b12]">
                    Optimize titles
                  </span>
                  <span className="text-[#4c9a66] text-xs">
                    Include specific keywords like &quot;Cotton&quot; or &quot;Slim Fit&quot;.
                  </span>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <div className="min-w-6 pt-0.5 text-primary">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div>
                  <span className="font-medium block mb-0.5 text-[#0d1b12]">
                    Add more photos
                  </span>
                  <span className="text-[#4c9a66] text-xs">
                    Listings with 5+ photos sell 15% faster.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom grid: top products + customer insights (визуально как в макете) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Top products (статично – можно связать с данными позже) */}
        <div className="rounded-xl bg-white border border-[#e7f3eb] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#e7f3eb] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#0d1b12]">Top Performing Products</h3>
            <button
              type="button"
              onClick={() => alert("View all products (demo).")}
              className="text-sm font-medium text-primary hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f5f6f8]">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66]">
                    Product
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">
                    Price
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-right">
                    Sold
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#4c9a66] text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7f3eb]">
                <TopProductRow
                  name="Basic Cotton Tee"
                  id="#49201"
                  price={24}
                  sold={342}
                  status="In Stock"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuCt2Ql24pKmjAiNdDUsS7rU_QBbNDVsPnWqLrRowQVs8HkRyADpb6J6aYd68BsHuDrLbJcUrfMo4pdaTl0ZqwyC7pllRl-wkX3OO0GFGFRY919zDl6AOeHHx8mQ24L5aEkrL7k3o1T-lf_Fo7XSeFNPiB7KNx2pa0yr9nZxY8YlwlwS-ojZmCxq9Ttmc0wjYYClVVn4wTlT90llV_zlWpeVQRe2-Briec2S_oryMyGhIBNrJZ1Ta6op3_0xDtSBWYF0OBSwcSIGORc"
                />
                <TopProductRow
                  name="Urban Sneakers"
                  id="#49202"
                  price={120}
                  sold={128}
                  status="Low Stock"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuBt2k1ybM0TnzpODmxhWzbBf1byLEdWwdkDoVqvQw7Zgfub9JRfuESAizTZxXOAn4GpkooYgDpE3DyzI6Xtzc5plFEyDe_ayAwumLbOhzQd8g4HzEYM63sBtbM-NnaN_1av_hHAkSN0djVLb5SgWxv-C2v3DbaggcM1-ih_6ulbnfwGEiqnxcxQjbzfNrxmFpzxxpHRBf6kLpzXjMQxU3ly4b9QsY4WiAXrB8CBEzdjirWrlkqD0ZgG761TOTRt2WKMOtToS5yd61w"
                />
                <TopProductRow
                  name="Travel Backpack"
                  id="#49203"
                  price={85.5}
                  sold={86}
                  status="In Stock"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ12YlhLkjFhbLhwwzJS4AxzdLNLmnyOqibNaS3Sv7xxDcRi5KO8F8YUgPgsC3XGIFgGMIucJRwnayPFcdBqYavsjOy8ATqdlV1-wtE6mC1tQCj5lnCg7yS8fYgsUiQCIuDGXF1vhMrQHnDFBev2JuiPiOg7bcE6JTDCHatFl3P7F-Hnn6qzfFkyu0HXUEs8duzbrQsNcR2lKGAMQgzZqEcKPPrm3ApPS8WmISaAUJBu2__MCW7tcrWQWMzBsyjt12TgfknUM85U0"
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer insights donut (визуальный) */}
        <div className="rounded-xl bg-white border border-[#e7f3eb] shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#0d1b12]">Customer Insights</h3>
            <button
              type="button"
              onClick={() => alert("More insights demo.")}
              className="text-[#4c9a66] hover:text-primary"
            >
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-40 h-40 shrink-0">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "conic-gradient(#13ec5b 0% 65%, #053f18 65% 85%, #e7f3eb 85% 100%)",
                }}
              />
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                <span className="text-2xl font-black text-[#0d1b12]">65%</span>
                <span className="text-[10px] uppercase font-bold text-[#4c9a66]">
                  Returning
                </span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-4 text-sm">
              <Row label="Returning Customers" value="65%" colorClass="bg-primary" />
              <Row label="New Customers" value="20%" colorClass="bg-[#053f18]" />
              <Row label="Inactive" value="15%" colorClass="bg-[#e7f3eb]" />
              <div className="pt-4 border-t border-[#e7f3eb] mt-4 text-xs text-[#4c9a66]">
                <span className="font-bold text-primary">Insight:</span> Repeat customers are
                spending 20% more on average this month. Consider a loyalty campaign.
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

type RangeChipProps = {
  label: string;
  value: Range;
  range: Range;
  setRange: (value: Range) => void;
  primary?: boolean;
};

function RangeChip({ label, value, range, setRange, primary }: RangeChipProps) {
  const active = range === value;
  if (primary) {
    return (
      <button
        type="button"
        onClick={() => setRange(value)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md ${
          active
            ? "bg-black text-white"
            : "bg-white text-[#0d1b12] hover:bg-[#f5f6f8]"
        }`}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setRange(value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap ${
        active
          ? "bg-primary text-black border-primary"
          : "bg-white text-[#0d1b12] border-[#e7f3eb] hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}

type TopProductRowProps = {
  name: string;
  id: string;
  price: number;
  sold: number;
  status: string;
  image: string;
};

function TopProductRow({ name, id, price, sold, status, image }: TopProductRowProps) {
  const low = status.toLowerCase().includes("low");
  return (
    <tr className="hover:bg-[#f5f6f8] transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-md bg-cover bg-center bg-gray-200"
            style={{ backgroundImage: `url("${image}")` }}
          />
          <div>
            <p className="text-sm font-medium text-[#0d1b12]">{name}</p>
            <p className="text-xs text-[#4c9a66]">ID: {id}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-right font-medium text-[#0d1b12]">
        ${price.toFixed(2)}
      </td>
      <td className="py-4 px-6 text-sm text-right text-[#4c9a66]">
        {sold}
      </td>
      <td className="py-4 px-6 text-center">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            low
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

type RowProps = {
  label: string;
  value: string;
  colorClass: string;
};

function Row({ label, value, colorClass }: RowProps) {
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

type ChartRange = Range;

type ChartPoint = { label: string; value: number };

const SALES_DATA: Record<Exclude<ChartRange, "custom">, ChartPoint[]> = {
  "7d": [
    { label: "Mon", value: 720 },
    { label: "Tue", value: 980 },
    { label: "Wed", value: 830 },
    { label: "Thu", value: 1230 },
    { label: "Fri", value: 920 },
    { label: "Sat", value: 1450 },
    { label: "Sun", value: 1120 },
  ],
  month: [
    { label: "W1", value: 4200 },
    { label: "W2", value: 5850 },
    { label: "W3", value: 5020 },
    { label: "W4", value: 6400 },
  ],
  lastMonth: [
    { label: "W1", value: 3800 },
    { label: "W2", value: 4100 },
    { label: "W3", value: 3950 },
    { label: "W4", value: 4300 },
  ],
  ytd: [
    { label: "Jan", value: 8200 },
    { label: "Feb", value: 7600 },
    { label: "Mar", value: 9100 },
    { label: "Apr", value: 10400 },
    { label: "May", value: 9800 },
    { label: "Jun", value: 11200 },
  ],
};

type KpiSnapshot = {
  revenue: number;
  orders: number;
  avgOrderValue: number;
  conversionRate: number;
  deltaRevenue: string;
  deltaOrders: string;
  deltaAov: string;
  deltaConv: string;
};

function getKpiValues(range: Range, customData: ChartPoint[] | null): KpiSnapshot {
  if (range === "custom" && customData && customData.length > 0) {
    const totalRevenue = customData.reduce((sum, p) => sum + p.value, 0);
    const orders = Math.max(1, Math.round(totalRevenue / 80));
    const avgOrderValue = totalRevenue / orders;
    return {
      revenue: totalRevenue,
      orders,
      avgOrderValue,
      conversionRate: 3.2,
      deltaRevenue: "+6.8%",
      deltaOrders: "+3.1%",
      deltaAov: "-1.4%",
      deltaConv: "+0.3%",
    };
  }

  switch (range) {
    case "7d":
      return {
        revenue: 12450,
        orders: 145,
        avgOrderValue: 85.5,
        conversionRate: 3.2,
        deltaRevenue: "+12.5%",
        deltaOrders: "+5.2%",
        deltaAov: "-2.1%",
        deltaConv: "+0.5%",
      };
    case "month":
      return {
        revenue: 48230,
        orders: 560,
        avgOrderValue: 86.1,
        conversionRate: 3.4,
        deltaRevenue: "+8.3%",
        deltaOrders: "+4.0%",
        deltaAov: "+1.0%",
        deltaConv: "+0.4%",
      };
    case "lastMonth":
      return {
        revenue: 44500,
        orders: 538,
        avgOrderValue: 82.7,
        conversionRate: 3.0,
        deltaRevenue: "-3.2%",
        deltaOrders: "-1.8%",
        deltaAov: "-1.5%",
        deltaConv: "-0.2%",
      };
    case "ytd":
      return {
        revenue: 215400,
        orders: 2430,
        avgOrderValue: 88.7,
        conversionRate: 3.3,
        deltaRevenue: "+18.9%",
        deltaOrders: "+11.4%",
        deltaAov: "+2.3%",
        deltaConv: "+0.6%",
      };
    default:
      return {
        revenue: 12450,
        orders: 145,
        avgOrderValue: 85.5,
        conversionRate: 3.2,
        deltaRevenue: "+12.5%",
        deltaOrders: "+5.2%",
        deltaAov: "-2.1%",
        deltaConv: "+0.5%",
      };
  }
}

function SalesChart({
  range,
  customData,
}: {
  range: ChartRange;
  customData?: ChartPoint[] | null;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    SALES_DATA["7d"].length - 1,
  );

  const baseRange: Exclude<ChartRange, "custom"> =
    range === "custom" ? "7d" : range;
  const baseData = SALES_DATA[baseRange];
  const data =
    range === "custom" && customData && customData.length > 0
      ? customData
      : baseData;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = 0;
  const yRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const raw = (point.value - minValue) / yRange;
    // Немного «смягчаем» вертикальный разброс, чтобы график выглядел более плавно
    const eased = 0.2 + raw * 0.6;
    const y = 90 - eased * 70; // padding сверху и снизу
    return { ...point, x, y };
  });

  const pathD =
    points.length > 0
      ? points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(" ")
      : "";

  const areaD =
    points.length > 0
      ? `M ${points[0].x.toFixed(2)} 100 ` +
        points
          .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
          .join(" ") +
        ` L ${points[points.length - 1].x.toFixed(2)} 100 Z`
      : "";

  const activePoint =
    activeIndex != null && points[activeIndex] ? points[activeIndex] : null;

  return (
    <div className="lg:col-span-2 rounded-xl bg-white border border-[#e7f3eb] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#0d1b12]">Sales Performance</h3>
          <p className="text-sm text-[#4c9a66]">
            Revenue by{" "}
            {range === "7d"
              ? "day"
              : range === "ytd"
              ? "month"
              : "week"}{" "}
            (mock data)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-primary" />
          <span className="text-sm font-medium text-[#0d1b12]">Revenue</span>
        </div>
      </div>

      <div className="relative w-full h-[300px]">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onMouseLeave={() => setActiveIndex(points.length - 1)}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#13ec5b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#13ec5b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid */}
          <g stroke="#e7f3eb" strokeWidth="0.4">
            {[0, 1, 2, 3].map((row) => {
              const y = 90 - (row * 70) / 3;
              return <line key={row} x1="0" y1={y} x2="100" y2={y} />;
            })}
          </g>

          {/* area */}
          {areaD && (
            <path d={areaD} fill="url(#salesGradient)" stroke="none" />
          )}

          {/* line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#13ec5b"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

        </svg>

        {/* точки поверх SVG, чтобы они были идеально круглыми и интерактивными */}
        {points.map((p, index) => (
          <button
            key={p.label}
            type="button"
            onMouseEnter={() => setActiveIndex(index)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-white hover:bg-primary/10 transition-colors ${
              activeIndex === index ? "w-3 h-3" : "w-2.5 h-2.5"
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
          />
        ))}

        {activePoint && (
          <div
            className="pointer-events-none absolute flex flex-col items-center"
            style={{
              left: `${activePoint.x}%`,
              top: `${activePoint.y}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-black text-white text-xs py-1 px-2 rounded mb-1 shadow-lg whitespace-nowrap">
              ${activePoint.value.toLocaleString()}
            </div>
            <div className="w-2 h-2 bg-primary rounded-full ring-4 ring-white" />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4 text-xs font-medium text-[#4c9a66] border-t border-[#e7f3eb] pt-4">
        {data.map((d) => (
          <button
            key={d.label}
            type="button"
            onMouseEnter={() =>
              setActiveIndex(data.findIndex((p) => p.label === d.label))
            }
            className={`flex-1 text-center ${
              activePoint?.label === d.label ? "text-primary font-semibold" : ""
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

