"use client";

import { useState, useEffect } from "react";
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
} from "date-fns";
import { ru } from "date-fns/locale";
import { DayCell } from "./DayCell";
import { WorkoutPanel } from "./WorkoutPanel";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface CalendarViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onCreateSession: (date: string) => void;
  onOpenSession: (id: string) => void;
  onCopyPrevious: (date: string) => void;
  onCopySessionSuccess?: (sessionId: string) => void;
  showToast: (msg: string) => void;
  sessionsIndex: Record<string, string>;
  setSessionsIndex: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedSessionId: string | null;
  selectedSessionData: import("./WorkoutPanel").SessionData | null;
  selectedSessionLoading: boolean;
  mode: "execute" | "edit";
  onModeChange: (mode: "execute" | "edit") => void;
  onRefreshSession: (sessionId: string) => void;
  onSessionDataUpdate: (
    sessionId: string,
    data: import("./WorkoutPanel").SessionData
  ) => void;
}

export function CalendarView({
  selectedDate,
  onSelectDate,
  onCreateSession,
  onOpenSession,
  onCopyPrevious,
  onCopySessionSuccess,
  showToast,
  sessionsIndex,
  setSessionsIndex,
  selectedSessionId,
  selectedSessionData,
  selectedSessionLoading,
  mode,
  onModeChange,
  onRefreshSession,
  onSessionDataUpdate,
}: CalendarViewProps) {
  const [calendarExpanded, setCalendarExpanded] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );

  useEffect(() => {
    const rangeStart = calendarExpanded
      ? startOfMonth(currentMonth)
      : currentWeekStart;
    const rangeEnd = calendarExpanded
      ? endOfMonth(currentMonth)
      : endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const from = format(rangeStart, "yyyy-MM-dd");
    const to = format(rangeEnd, "yyyy-MM-dd");
    fetch(`/api/sessions?from=${from}&to=${to}`)
      .then(async (r) => {
        const ct = r.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) return { sessions: [] };
        const text = await r.text();
        if (!text) return { sessions: [] };
        try {
          return JSON.parse(text) as {
            sessions?: { id: string; date: string }[];
          };
        } catch {
          return { sessions: [] };
        }
      })
      .then((data) => {
        const map: Record<string, string> = {};
        for (const s of data.sessions ?? []) {
          map[format(new Date(s.date), "yyyy-MM-dd")] = s.id;
        }
        setSessionsIndex((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
  }, [currentMonth, currentWeekStart, calendarExpanded, setSessionsIndex]);

  useEffect(() => {
    if (!calendarExpanded) {
      setCurrentWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
    } else {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate, calendarExpanded]);

  const handlePrev = () => {
    if (calendarExpanded) {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    }
  };

  const handleNext = () => {
    if (calendarExpanded) {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else {
      setCurrentWeekStart(addWeeks(currentWeekStart, 1));
    }
  };

  const days: Date[] = [];
  if (calendarExpanded) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
  } else {
    const weekStart = currentWeekStart;
    let day = weekStart;
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
  }

  const headerTitle = calendarExpanded
    ? format(currentMonth, "LLLL yyyy", { locale: ru })
    : `Неделя ${format(currentWeekStart, "d")}–${format(addDays(currentWeekStart, 6), "d MMM", { locale: ru })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label={
              calendarExpanded ? "Предыдущий месяц" : "Предыдущая неделя"
            }
          >
            ←
          </button>
          <h2 className="text-lg font-semibold capitalize min-w-[160px]">
            {headerTitle}
          </h2>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 min-w-[44px] min-h-[44px] rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label={
              calendarExpanded ? "Следующий месяц" : "Следующая неделя"
            }
          >
            →
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCalendarExpanded((e) => !e)}
          className="shrink-0 min-h-[40px] px-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
          title={calendarExpanded ? "Свернуть" : "Развернуть"}
        >
          {calendarExpanded ? "Свернуть" : "Развернуть"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-xs font-medium text-slate-500 py-1"
          >
            {wd}
          </div>
        ))}
        {days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const sid = sessionsIndex[dateStr];
          const hasWorkout = !!sid;
          const isInView = calendarExpanded
            ? isSameMonth(d, currentMonth)
            : isWithinInterval(d, {
                start: currentWeekStart,
                end: addDays(currentWeekStart, 6),
              });
          return (
            <DayCell
              key={d.toISOString()}
              date={d}
              hasWorkout={hasWorkout}
              isSelected={isSameDay(d, selectedDate)}
              isToday={isToday(d)}
              isCurrentMonth={isInView}
              onClick={() => onSelectDate(d)}
            />
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <WorkoutPanel
          sessionId={selectedSessionId}
          sessionData={selectedSessionData}
          sessionLoading={selectedSessionLoading}
          selectedDate={selectedDate}
          onOpenSession={onOpenSession}
          onCreateSession={onCreateSession}
          onCopyPrevious={onCopyPrevious}
          onCopySessionSuccess={onCopySessionSuccess}
          showToast={showToast}
          mode={mode}
          onModeChange={onModeChange}
          onRefreshSession={onRefreshSession}
          onSessionDataUpdate={onSessionDataUpdate}
        />
      </div>
    </div>
  );
}
