import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/layout/AppHeader";
import WorkspaceShell from "@/components/layout/WorkspaceShell";
import WorkspaceModeTransition from "@/components/nav/WorkspaceModeTransition";
import AutoTranslator from "@/components/i18n/AutoTranslator";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ToastProvider } from "@/context/ToastContext";
import AssistantWidget from "@/components/chatbot/AssistantWidget";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Mollmart",
  description: "Buyer request, seller offer, and negotiation platform",
  icons: {
    icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: "/brand/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mollmart_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(d?'dark':'light');}catch(e){}})();`,
          }}
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <WorkspaceProvider>
                <ToastProvider>
                  <AutoTranslator />
                  <div className="app-shell-bg relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
                    <AppHeader />
                    <main className="flex-1 self-stretch">
                      <WorkspaceShell>
                        <WorkspaceModeTransition>{children}</WorkspaceModeTransition>
                      </WorkspaceShell>
                    </main>
                    <AssistantWidget />
                  </div>
                </ToastProvider>
              </WorkspaceProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
