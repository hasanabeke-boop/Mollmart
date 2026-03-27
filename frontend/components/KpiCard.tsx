'use client';

type KpiCardProps = {
  icon: string;
  title: string;
  value: string;
  delta: string;
  positive?: boolean;
};

export default function KpiCard({
  icon,
  title,
  value,
  delta,
  positive,
}: KpiCardProps) {
  const isPositive = positive ?? !delta.trim().startsWith("-");

  return (
    <div className="flex flex-col rounded-xl border border-[#e7f3eb] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span
          className={`flex items-center text-xs font-medium ${
            isPositive ? "text-green-600" : "text-red-500"
          }`}
        >
          {delta}
          <span className="material-symbols-outlined text-sm">
            {isPositive ? "arrow_upward" : "arrow_downward"}
          </span>
        </span>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-[#4c9a66]">{title}</p>
        <h3 className="mt-1 text-2xl font-bold text-[#0d1b12]">{value}</h3>
      </div>
    </div>
  );
}

