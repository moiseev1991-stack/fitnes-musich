"use client";

import { getSetCellColumns } from "@/lib/setType";
import type { SetData, SetStatus } from "./WorkoutTable";

const STATUS_ICON_SIZE = 14;
const STATUS_ICON_STROKE = 1.5;

function IconCheckCircle({ size = 14, stroke = 1.5, className = "" }: { size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconXCircle({ size = 14, stroke = 1.5, className = "" }: { size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

interface WorkoutCellProps {
  set: SetData | null;
  status: SetStatus;
  statusClass: string;
  isExecute: boolean;
  hasNote: boolean;
  onNoteClick: () => void;
}

export function WorkoutCell({
  set,
  status,
  statusClass,
  isExecute,
  hasNote,
  onNoteClick,
}: WorkoutCellProps) {
  if (!set) {
    return (
      <div className="cell flex min-h-[48px] items-center justify-center">
        <span className="text-slate-400 dark:text-slate-500">—</span>
      </div>
    );
  }

  const { mainNumber, mainLabel, weightNumber, showSeparator } = getSetCellColumns(set);
  const StatusIcon =
    status === "done" ? (
      <IconCheckCircle size={STATUS_ICON_SIZE} stroke={STATUS_ICON_STROKE} className="shrink-0 text-emerald-600/80 dark:text-emerald-400/80" />
    ) : status === "missed" ? (
      <IconXCircle size={STATUS_ICON_SIZE} stroke={STATUS_ICON_STROKE} className="shrink-0 text-red-600/80 dark:text-red-400/80" />
    ) : null;

  const numberClass = `leading-[20px] ${statusClass ? "text-inherit" : "text-slate-900 dark:text-slate-100"}`;
  const labelClass = "text-[11px] font-medium leading-[14px] opacity-65 text-slate-600 dark:text-slate-400";

  return (
    <div className="cell relative flex min-h-[48px] w-full items-center justify-center pt-1 pr-[22px] pb-[18px] pl-2">
      {/* Строка 1: число × вес; Строка 2: подписи под своими числами */}
      {showSeparator ? (
        <div className="cellInner flex flex-row items-center justify-center gap-0">
          {/* Левая колонка: число + подпись */}
          <div className="flex flex-col items-center justify-center">
            <span className={`text-[16px] font-semibold ${numberClass}`}>{mainNumber}</span>
            <span className={labelClass}>{mainLabel}</span>
          </div>
          <span className="px-1 text-[13px] font-medium leading-[20px] opacity-70 text-slate-500 dark:text-slate-400" aria-hidden>×</span>
          {/* Правая колонка: вес + кг */}
          <div className="flex flex-col items-center justify-center">
            <span className={`text-[15px] font-semibold leading-[20px] ${numberClass}`}>{weightNumber}</span>
            <span className={labelClass}>кг</span>
          </div>
        </div>
      ) : (
        <div className="cellInner flex flex-col items-center justify-center gap-0">
          <span className={`text-[16px] font-semibold leading-[20px] ${numberClass}`}>{mainNumber}</span>
          {mainLabel && <span className={labelClass}>{mainLabel}</span>}
        </div>
      )}

      {/* status: правый верхний угол, не сдвигает контент */}
      {StatusIcon && (
        <div className="status absolute right-[6px] top-[6px] z-10" aria-hidden>
          {StatusIcon}
        </div>
      )}

      {/* note: bottom-right — показываем в обоих режимах (выполнение и редактирование) */}
      {hasNote && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNoteClick();
          }}
          className="note absolute bottom-1.5 right-1.5 z-10 flex h-[14px] w-[14px] items-center justify-center rounded p-0 text-[14px] leading-none text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 bg-white/80 dark:bg-slate-800/80 shadow-sm border border-slate-200/80 dark:border-slate-600/80"
          title={isExecute ? "Просмотр заметки" : "Редактировать подход"}
          aria-label="Заметка"
        >
          📝
        </button>
      )}
    </div>
  );
}
