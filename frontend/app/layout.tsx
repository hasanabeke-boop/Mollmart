import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/landing/Header";
import SellerShell from "@/components/seller/SellerShell";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "Mollmart",
  description: "Buyer request, seller offer, and negotiation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f5f7fa] text-[#0d1b12]">
              <Header />
              <main className="flex min-h-0 flex-1 flex-col">
                <SellerShell>{children}</SellerShell>
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
