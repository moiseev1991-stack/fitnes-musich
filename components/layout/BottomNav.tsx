"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/calendar", label: "Календарь", icon: "📅" },
  { href: "/templates", label: "База", icon: "📂" },
  { href: "/history", label: "История", icon: "📋" },
  { href: "/progress", label: "Прогресс", icon: "📈" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full min-w-[44px]
                text-sm font-medium transition-colors
                ${isActive ? "text-emerald-600" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}
              `}
            >
              <span className="text-xl mb-0.5">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
