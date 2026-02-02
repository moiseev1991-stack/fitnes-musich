"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface DayCellProps {
  date: Date;
  hasWorkout: boolean;
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
}

export function DayCell({
  date,
  hasWorkout,
  isSelected,
  isToday,
  isCurrentMonth,
  onClick,
}: DayCellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl
        text-sm font-medium transition-colors
        ${!isCurrentMonth ? "text-slate-300 dark:text-slate-600" : ""}
        ${isToday ? "ring-2 ring-emerald-500 ring-offset-2" : ""}
        ${isSelected ? "bg-emerald-600 text-white" : "hover:bg-slate-200 dark:hover:bg-slate-700"}
      `}
    >
      <span>{format(date, "d", { locale: ru })}</span>
      {hasWorkout && (
        <span
          className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
            isSelected ? "bg-white" : "bg-emerald-500"
          }`}
          aria-hidden
        />
      )}
    </button>
  );
}
