'use client';

import Link from "next/link";
import { useAuth, type User } from "@/context/AuthContext";
import type { ReactNode } from "react";

type RoleGateProps = {
  allowedRoles: User["role"][];
  children: ReactNode;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  unauthenticatedTitle?: string;
  unauthenticatedDescription?: string;
};

export default function RoleGate({
  allowedRoles,
  children,
  title,
  description,
  ctaHref,
  ctaLabel,
  unauthenticatedTitle = "Sign in required",
  unauthenticatedDescription = "Please log in to continue.",
}: RoleGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] px-4">
        <p className="text-sm font-semibold text-[#4c9a66]">Checking access...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <AccessMessage
        icon="lock"
        title={unauthenticatedTitle}
        description={unauthenticatedDescription}
        ctaHref="/login"
        ctaLabel="Log in"
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <AccessMessage
        icon="switch_account"
        title={title}
        description={description}
        ctaHref={ctaHref}
        ctaLabel={ctaLabel}
      />
    );
  }

  return <>{children}</>;
}

function AccessMessage({
  icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f5f6f8] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#e7f3eb] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h1 className="text-xl font-black text-[#0d1b12]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#4c9a66]">{description}</p>
        <Link
          href={ctaHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20"
        >
          {ctaLabel}
        </Link>
      </div>
    </main>
  );
}
