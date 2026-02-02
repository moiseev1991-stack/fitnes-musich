"use client";

import { useState, useMemo, useEffect } from "react";
import { formatValueForDisplay, parseNote } from "@/lib/setType";

const STATUS_ICON_SIZE = 16;
const STATUS_ICON_STROKE = 2;

function IconCheckCircle({ size = 16, stroke = 2, className = "" }: { size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconXCircle({ size = 16, stroke = 2, className = "" }: { size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

export type SetStatus = "done" | "missed" | null;

export interface SetData {
  id: string;
  weight: number | null;
  reps: number;
  note: string | null;
  valueType?: "reps" | "time" | null;
  status?: SetStatus;
}

interface ExerciseRowData {
  id: string;
  name: string;
  plannedSets: number;
  sets: SetData[];
  supersetGroupId?: string | null;
  supersetOrder?: number | null;
}

interface WorkoutTableProps {
  mode?: "execute" | "edit";
  exercises: ExerciseRowData[];
  onCellClick?: (
    sessionExerciseId: string,
    set?: SetData,
    exerciseName?: string
  ) => void;
  onStatusToggle?: (set: SetData, nextStatus: SetStatus) => void;
  onEmptyCellClick?: () => void;
  onDeleteExercise: (sessionExerciseId: string, exerciseName: string) => void;
  onAddExercise: () => void;
  onDeleteSession?: () => void;
}

function formatSetCell(set: SetData): string {
  const val = formatValueForDisplay(set.reps, set.valueType ?? set.note);
  if (set.weight != null && set.weight > 0) {
    return `${set.weight}×${val}`;
  }
  return val;
}

function nextStatus(current: SetStatus): SetStatus {
  if (current === null) return "done";
  if (current === "done") return "missed";
  return null;
}

function statusBgClass(status: SetStatus): string {
  if (status === "done")
    return "bg-emerald-500/30 dark:bg-emerald-600/40 text-emerald-800 dark:text-emerald-100";
  if (status === "missed")
    return "bg-red-500/30 dark:bg-red-600/40 text-red-800 dark:text-red-100";
  return "";
}

export function WorkoutTable({
  mode = "edit",
  exercises,
  onCellClick,
  onStatusToggle,
  onEmptyCellClick,
  onDeleteExercise,
  onAddExercise,
  onDeleteSession,
}: WorkoutTableProps) {
  const initialDisplayCount = useMemo(() => {
    if (exercises.length === 0) return 1;
    return Math.max(
      ...exercises.map((e) => Math.max(e.plannedSets, e.sets.length)),
      1
    );
  }, [exercises]);

  const [displaySetCount, setDisplaySetCount] = useState(initialDisplayCount);
  const [showHiddenColumnsHint, setShowHiddenColumnsHint] = useState(false);
  const isExecute = mode === "execute";
  const showEditControls = !isExecute;

  const handleDecreaseSetCount = () => {
    if (displaySetCount <= 1) return;
    setDisplaySetCount((n) => n - 1);
    setShowHiddenColumnsHint(true);
  };
  const handleIncreaseSetCount = () => {
    setDisplaySetCount((n) => n + 1);
    setShowHiddenColumnsHint(false);
  };

  useEffect(() => {
    setDisplaySetCount((prev) => Math.max(prev, initialDisplayCount));
  }, [initialDisplayCount]);

  const handleCellClick = (
    sessionExerciseId: string,
    set: SetData | undefined,
    exerciseName?: string
  ) => {
    if (isExecute) {
      if (set) {
        const next = nextStatus((set.status ?? null) as SetStatus);
        onStatusToggle?.(set, next);
      } else {
        onEmptyCellClick?.();
      }
    } else {
      onCellClick?.(sessionExerciseId, set, exerciseName);
    }
  };

  const rows = useMemo(() => {
    const result: { ex: ExerciseRowData; supersetLabel?: string }[] = [];
    const processed = new Set<string>();
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let letterIdx = 0;
    for (const ex of exercises) {
      if (processed.has(ex.id)) continue;
      const gid = ex.supersetGroupId ?? null;
      if (gid) {
        const group = exercises.filter((e) => (e.supersetGroupId ?? null) === gid);
        group.sort((a, b) => (a.supersetOrder ?? 0) - (b.supersetOrder ?? 0));
        if (group.length >= 2) {
          const label = letters[letterIdx++] ?? String(letterIdx);
          for (let j = 0; j < group.length; j++) {
            result.push({ ex: group[j], supersetLabel: `${label}${j + 1}` });
            processed.add(group[j].id);
          }
          continue;
        }
      }
      result.push({ ex });
      processed.add(ex.id);
    }
    return result;
  }, [exercises]);

  if (exercises.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddExercise}
        disabled={!showEditControls}
        className={`w-full min-h-[44px] py-3 rounded-xl font-medium text-base inline-flex items-center justify-center gap-2 ${
          showEditControls
            ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
            : "pointer-events-none opacity-60 bg-slate-200 dark:bg-slate-700 text-slate-500"
        }`}
      >
        <span aria-hidden>+</span>
        Добавить упражнение
      </button>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 -mx-1">
      {showEditControls && (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Подходы
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDecreaseSetCount}
                disabled={displaySetCount <= 1}
                className="min-h-[36px] px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
              >
                − Подход
              </button>
              <button
                type="button"
                onClick={handleIncreaseSetCount}
                className="min-h-[36px] px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                + Подход
              </button>
            </div>
          </div>
          {showHiddenColumnsHint && (
            <p className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              Колонка скрыта. Данные не удалены.
            </p>
          )}
          {onDeleteSession && (
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={onDeleteSession}
                className="min-h-[36px] px-3 rounded-lg border border-red-300 dark:border-red-700 bg-transparent text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Удалить тренировку"
              >
                <span aria-hidden>🗑️</span> Удалить тренировку
              </button>
            </div>
          )}
        </>
      )}
      {isExecute && (
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block">
            Тап: сделал → не сделал → сброс
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-500 block flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              <IconCheckCircle
                size={STATUS_ICON_SIZE}
                stroke={STATUS_ICON_STROKE}
                className="shrink-0 text-emerald-600 dark:text-emerald-400 opacity-90"
              />
              Сделал
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <IconXCircle
                size={STATUS_ICON_SIZE}
                stroke={STATUS_ICON_STROKE}
                className="shrink-0 text-red-600 dark:text-red-400 opacity-90"
              />
              Не сделал
            </span>
            <span aria-hidden>·</span>
            <span>— Нет статуса.</span>
            <span>Отмечать можно только заполненные ячейки.</span>
          </span>
        </div>
      )}
      <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm min-w-[320px]">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <th className="w-28 sm:w-36 px-2 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10">
              Упражнение
            </th>
            {Array.from({ length: displaySetCount }, (_, i) => (
              <th
                key={i}
                className="min-w-[64px] px-1 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
                title={`Подход ${i + 1}`}
              >
                П{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ex, supersetLabel }) => (
            <tr
              key={ex.id}
              className="border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <td className="px-2 py-2 font-medium text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    {supersetLabel && (
                      <span
                        className="inline-flex shrink-0 w-5 h-5 rounded bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 text-[10px] font-bold mr-1.5 items-center justify-center"
                        title="Суперсет"
                      >
                        {supersetLabel.replace(/\d+$/, "")}
                      </span>
                    )}
                    <span className="block truncate">{ex.name}</span>
                    <span className="block text-xs text-slate-500 font-normal">
                      {ex.sets.length}/{ex.plannedSets}
                    </span>
                  </div>
                  {showEditControls && (
                    <button
                      type="button"
                      onClick={() =>
                        confirm("Удалить упражнение и все его подходы?") &&
                        onDeleteExercise(ex.id, ex.name)
                      }
                      className="shrink-0 min-w-[36px] min-h-[36px] p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                      aria-label="Удалить упражнение"
                      title="Удалить упражнение"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </td>
              {Array.from({ length: displaySetCount }, (_, i) => {
                const set = ex.sets[i];
                const status = (set?.status ?? null) as SetStatus;
                const statusClass = set ? statusBgClass(status) : "";
                const StatusIcon =
                  status === "done" ? (
                    <IconCheckCircle
                      size={STATUS_ICON_SIZE}
                      stroke={STATUS_ICON_STROKE}
                      className="shrink-0 absolute top-0.5 right-0.5 text-current opacity-90"
                    />
                  ) : status === "missed" ? (
                    <IconXCircle
                      size={STATUS_ICON_SIZE}
                      stroke={STATUS_ICON_STROKE}
                      className="shrink-0 absolute top-0.5 right-0.5 text-current opacity-90"
                    />
                  ) : null;
                return (
                  <td
                    key={i}
                    onClick={() => handleCellClick(ex.id, set, ex.name)}
                    className={`min-w-[64px] px-1 py-1.5 text-center border-r border-slate-50 dark:border-slate-800/50 last:border-r-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 min-h-[44px] align-top relative ${statusClass}`}
                  >
                    {set ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`font-medium ${statusClass ? "text-inherit" : "text-slate-900 dark:text-slate-100"}`}
                        >
                          {formatSetCell(set)}
                        </span>
                        {StatusIcon}
                        {!isExecute && parseNote(set.note).userNote && (
                          <span
                            className="text-amber-500 text-[10px]"
                            title={parseNote(set.note).userNote}
                          >
                            📝
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">
                        —
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {showEditControls && (
        <button
          type="button"
          onClick={onAddExercise}
          className="w-full min-h-[44px] py-3 rounded-b-xl border-t-0 font-medium text-base bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 inline-flex items-center justify-center gap-2"
        >
          <span aria-hidden>+</span>
          Добавить упражнение
        </button>
      )}
    </div>
  );
}
