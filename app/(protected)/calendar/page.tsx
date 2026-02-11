"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { SessionData } from "@/components/calendar/WorkoutPanel";

function CalendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);

  const [sessionsIndex, setSessionsIndex] = useState<Record<string, string>>({});
  const [selectedSessionData, setSelectedSessionData] = useState<SessionData | null>(null);
  const [selectedSessionLoading, setSelectedSessionLoading] = useState(false);
  const [mode, setMode] = useState<"execute" | "edit">("execute");
  const sessionCacheRef = useRef<Record<string, SessionData>>({});

  const deletedDate = searchParams.get("deleted");
  useEffect(() => {
    if (!deletedDate) return;
    const dateStr = deletedDate;
    const removedId = sessionsIndex[dateStr];
    setSessionsIndex((prev) => {
      const next = { ...prev };
      if (prev[dateStr]) {
        delete sessionCacheRef.current[prev[dateStr]];
        delete next[dateStr];
      }
      return next;
    });
    if (removedId) {
      delete sessionCacheRef.current[removedId];
    }
    setSelectedDate(new Date(dateStr + "T12:00:00"));
    setSelectedSessionData(null);
    setToast("Тренировка удалена");
    setTimeout(() => setToast(null), 4000);
    router.replace("/calendar", { scroll: false });
  }, [deletedDate]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedSessionId = sessionsIndex[selectedDateStr] ?? null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadSelectedSession = useCallback(
    async (sessionId: string, forceRefresh = false) => {
      const cached = sessionCacheRef.current[sessionId];
      if (cached && !forceRefresh) {
        setSelectedSessionData(cached);
        setSelectedSessionLoading(false);
        return;
      }
      setSelectedSessionLoading(true);
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        const ct = res.headers.get("content-type") ?? "";
        const text = await res.text();
        if (!ct.includes("application/json") || !text) {
          setSelectedSessionData(null);
          return;
        }
        const data = JSON.parse(text) as { session?: SessionData; error?: string };
        const s = data.session ?? null;
        if (s) {
          sessionCacheRef.current[sessionId] = s;
          setSelectedSessionData(s);
        } else {
          delete sessionCacheRef.current[sessionId];
          setSelectedSessionData(null);
          if (!res.ok && data.error) {
            showToast(data.error);
          }
        }
      } catch {
        setSelectedSessionData(null);
      } finally {
        setSelectedSessionLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    if (!selectedSessionId) {
      setSelectedSessionData(null);
      return;
    }
    const cached = sessionCacheRef.current[selectedSessionId];
    if (cached) {
      setSelectedSessionData(cached);
      setSelectedSessionLoading(false);
      return;
    }
    loadSelectedSession(selectedSessionId, true);
  }, [selectedSessionId, loadSelectedSession]);

  const handleCreateSession = async (date: string) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const ct = res.headers.get("content-type") ?? "";
      const text = await res.text();
      let data: { session?: { id: string }; error?: string } = {};
      if (ct.includes("application/json") && text) {
        try {
          data = JSON.parse(text);
        } catch {
          showToast("Ошибка ответа сервера");
          return;
        }
      }
      if (!res.ok) {
        showToast(data.error ?? "Ошибка сервера");
        return;
      }
      if (data.session?.id) {
        router.push(`/session/${data.session.id}`);
      } else {
        showToast("Ошибка: нет id сессии");
      }
    } catch {
      showToast("Ошибка сети");
    }
  };

  const handleOpenSession = (id: string) => {
    router.push(`/session/${id}`);
  };

  const handleCopyPrevious = async (date: string) => {
    try {
      const res = await fetch(`/api/copy/${date}`, { method: "POST" });
      const ct = res.headers.get("content-type") ?? "";
      const text = await res.text();
      let data: { session?: { id: string }; error?: string } = {};
      if (ct.includes("application/json") && text) {
        try {
          data = JSON.parse(text);
        } catch {
          showToast("Ошибка ответа сервера");
          return;
        }
      }
      if (!res.ok) {
        showToast(data.error ?? "Ошибка сервера");
        return;
      }
      if (data.session?.id) {
        setSessionsIndex((prev) => ({ ...prev, [date]: data.session!.id }));
        router.push(`/session/${data.session.id}`);
      } else {
        showToast("Ошибка: нет id сессии");
      }
    } catch {
      showToast("Ошибка сети");
    }
  };

  const handleCopySessionSuccess = (sessionId: string) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setSessionsIndex((prev) => ({ ...prev, [dateStr]: sessionId }));
    router.push(`/session/${sessionId}`);
  };

  const onRefreshSession = useCallback(
    (sessionId: string) => {
      loadSelectedSession(sessionId, true);
    },
    [loadSelectedSession]
  );

  const onSessionDataUpdate = useCallback(
    (sessionId: string, data: SessionData) => {
      sessionCacheRef.current[sessionId] = data;
      if (selectedSessionId === sessionId) {
        setSelectedSessionData(data);
      }
    },
    [selectedSessionId]
  );

  return (
    <MobileLayout title="Календарь">
      <CalendarView
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onCreateSession={handleCreateSession}
        onOpenSession={handleOpenSession}
        onCopyPrevious={handleCopyPrevious}
        onCopySessionSuccess={handleCopySessionSuccess}
        showToast={showToast}
        sessionsIndex={sessionsIndex}
        setSessionsIndex={setSessionsIndex}
        selectedSessionId={selectedSessionId}
        selectedSessionData={selectedSessionData}
        selectedSessionLoading={selectedSessionLoading}
        mode={mode}
        onModeChange={setMode}
        onRefreshSession={onRefreshSession}
        onSessionDataUpdate={onSessionDataUpdate}
      />
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 px-4 py-3 rounded-xl bg-slate-800 text-white shadow-lg animate-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </MobileLayout>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <MobileLayout title="Календарь">
          <div className="py-8 text-center text-slate-500">Загрузка…</div>
        </MobileLayout>
      }
    >
      <CalendarPageContent />
    </Suspense>
  );
}
