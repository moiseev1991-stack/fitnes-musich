"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-400 min-h-[44px] min-w-[44px] px-2"
    >
      Выход
    </button>
  );
}
