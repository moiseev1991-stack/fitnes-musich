"use client";

import { BottomNav } from "./BottomNav";
import { LogoutButton } from "./LogoutButton";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MobileLayout({ children, title }: MobileLayoutProps) {
  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-4">
          {title ? (
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          ) : (
            <div />
          )}
          <LogoutButton />
        </div>
      </header>
      <main className="px-4 py-4 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
