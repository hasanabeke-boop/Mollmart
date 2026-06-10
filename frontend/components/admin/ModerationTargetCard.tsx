'use client';

import Link from "next/link";
import type { ModerationTargetDetails } from "@/lib/admin";

export function ModerationTargetCard({ target }: { target: ModerationTargetDetails }) {
  if (!target.exists) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
        {target.label}
        {target.subtitle ? <p className="font-mono text-[10px] mt-0.5">{target.subtitle}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-lg border border-[#e7f3eb] bg-white p-3 min-w-[220px]">
      {target.imageUrl ? (
        <img
          src={target.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover bg-gray-100"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#0d1b12] truncate">{target.label}</p>
        {target.subtitle ? <p className="text-xs text-gray-500 truncate">{target.subtitle}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {target.status ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
              {target.status}
            </span>
          ) : null}
          {target.isHidden ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
              blocked
            </span>
          ) : null}
        </div>
        {target.owner ? (
          <p className="mt-1 text-[10px] text-gray-400 truncate">
            {target.owner.name}
            {target.owner.email ? ` · ${target.owner.email}` : ""}
          </p>
        ) : null}
        {target.publicPath ? (
          <Link
            href={target.publicPath}
            target="_blank"
            className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600 hover:underline"
          >
            View live
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
