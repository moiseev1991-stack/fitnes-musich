"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface SessionListItem {
  id: string;
  date: string;
  title: string | null;
  exercisesCount: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <MobileLayout title="История">
      {loading ? (
        <div className="py-8 text-center text-slate-500">Загрузка...</div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center text-slate-500">
          Нет тренировок. Создайте первую на календаре.
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => router.push(`/session/${s.id}`)}
                className="w-full min-h-[44px] px-4 py-3 rounded-xl text-left flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors"
              >
                <div>
                  <span className="font-medium block">
                    {format(new Date(s.date), "d MMMM yyyy", { locale: ru })}
                  </span>
                  {s.title && (
                    <span className="text-sm text-slate-500">{s.title}</span>
                  )}
                </div>
                <span className="text-sm text-slate-500">
                  {s.exercisesCount} упр.
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </MobileLayout>
  );
}
