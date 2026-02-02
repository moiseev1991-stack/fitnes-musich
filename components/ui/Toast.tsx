"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = "info",
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const styles = {
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-slate-800 text-white dark:bg-slate-700",
  };

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg ${styles[type]} animate-in slide-in-from-bottom-4`}
      role="alert"
    >
      {message}
    </div>
  );
}
