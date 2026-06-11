"use client";

import Link from "next/link";
import type { LegalDocument } from "@/lib/legalContent";

type Props = {
  document: LegalDocument;
  labels: {
    lastUpdated: string;
    backHome: string;
    helpCenter: string;
  };
};

export default function LegalDocumentPage({ document, labels }: Props) {
  return (
    <main className="app-page app-page-wide py-10 sm:py-14">
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link href="/" className="hover:text-primary transition-colors">
          {labels.backHome}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-[var(--foreground)] font-medium">{document.title}</span>
      </nav>

      <header className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">
          {labels.lastUpdated}: {document.lastUpdated}
        </p>
        <p className="mt-6 text-base leading-relaxed text-[var(--text-muted)]">{document.intro}</p>
      </header>

      <article className="max-w-3xl space-y-10">
        {document.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-[var(--foreground)]">{section.title}</h2>
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="text-sm leading-[1.75] text-[var(--text-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </article>

      <footer className="mt-14 border-t border-[var(--border-muted)] pt-8">
        <Link href="/help" className="text-sm font-semibold text-primary hover:underline">
          {labels.helpCenter}
        </Link>
      </footer>
    </main>
  );
}
