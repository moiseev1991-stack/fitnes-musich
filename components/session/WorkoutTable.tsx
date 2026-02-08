"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { parseNote } from "@/lib/setType";
import { WorkoutCell } from "./WorkoutCell";

const HINT_ICON_SIZE = 16;
const HINT_ICON_STROKE = 2;

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

function nextStatus(current: SetStatus): SetStatus {
  if (current === null) return "done";
  if (current === "done") return "missed";
  return null;
}

function statusBgClass(status: SetStatus): string {
  if (status === "done")
    return "bg-emerald-500/20 dark:bg-emerald-600/25 text-emerald-800 dark:text-emerald-200";
  if (status === "missed")
    return "bg-red-500/20 dark:bg-red-600/25 text-red-800 dark:text-red-200";
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
  const [fullNameModal, setFullNameModal] = useState<string | null>(null);
  const [noteViewText, setNoteViewText] = useState<string | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const hasNote = (set: SetData) => (parseNote(set.note).userNote ?? "").trim().length > 0;
  const isExecute = mode === "execute";
  const showEditControls = !isExecute;

  const updateCanScrollRight = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateCanScrollRight();
    el.addEventListener("scroll", updateCanScrollRight);
    const ro = new ResizeObserver(updateCanScrollRight);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateCanScrollRight);
      ro.disconnect();
    };
  }, [updateCanScrollRight, displaySetCount]);

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

  const scrollToLastSet = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 -mx-1 overflow-hidden">
      {showEditControls && (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap gap-1">
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block">
                Подходы
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Формат: повт/время × кг
              </span>
            </div>
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
      <div className="relative max-h-[60vh] overflow-y-auto">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden [overflow-scrolling:touch] max-w-full"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th
                  className="min-w-[160px] w-[180px] max-w-[210px] px-2 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/50 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)]"
                  scope="col"
                >
                  Упражнение
                </th>
                {Array.from({ length: displaySetCount }, (_, i) => (
                  <th
                    key={i}
                    className="min-w-[72px] w-[76px] max-w-[84px] px-1 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
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
              <td
                className="min-w-[160px] w-[180px] max-w-[210px] px-2 py-2 font-medium text-slate-900 dark:text-slate-100 sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)] border-r border-slate-200 dark:border-slate-700 align-top"
                style={{ breakInside: "avoid" }}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    {supersetLabel && (
                      <span
                        className="inline-flex shrink-0 w-5 h-5 rounded bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 text-[10px] font-bold mr-1.5 items-center justify-center"
                        title="Суперсет"
                      >
                        {supersetLabel.replace(/\d+$/, "")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullNameModal(ex.name);
                      }}
                      className="text-left w-full group flex items-start gap-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      title="Показать полное название"
                    >
                      <span
                        className="block min-w-0 line-clamp-2 break-words"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {ex.name}
                      </span>
                      <span
                        className="shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 text-sm leading-tight"
                        aria-hidden
                      >
                        ℹ︎
                      </span>
                    </button>
                    <span className="block text-xs text-slate-500 font-normal mt-0.5">
                      {ex.sets.length}/{ex.plannedSets}
                    </span>
                  </div>
                  {showEditControls && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Удалить упражнение и все его подходы?")) {
                          onDeleteExercise(ex.id, ex.name);
                        }
                      }}
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
                const set = ex.sets[i] ?? null;
                const status = (set?.status ?? null) as SetStatus;
                const statusClass = set ? statusBgClass(status) : "";
                return (
                  <td
                    key={i}
                    onClick={() => handleCellClick(ex.id, set ?? undefined, ex.name)}
                    className={`min-w-[72px] w-[76px] max-w-[84px] border-r border-slate-50 dark:border-slate-800/50 last:border-r-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 min-h-[52px] align-top relative ${statusClass}`}
                  >
                    <WorkoutCell
                      set={set}
                      status={status}
                      statusClass={statusClass}
                      isExecute={isExecute}
                      hasNote={set ? hasNote(set) : false}
                      onNoteClick={() => {
                        if (!set) return;
                        if (isExecute) {
                          setNoteViewText(parseNote(set.note).userNote);
                        } else {
                          onCellClick?.(ex.id, set, ex.name);
                        }
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
          </table>
        </div>
        {canScrollRight && (
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-slate-100/90 dark:from-slate-800/90 to-transparent z-[5]"
            aria-hidden
          />
        )}
        {displaySetCount > 3 && (
          <button
            type="button"
            onClick={scrollToLastSet}
            className="absolute right-2 top-14 z-[6] min-h-[32px] px-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            title="К последнему подходу"
          >
            → П{displaySetCount}
          </button>
        )}
      </div>
      {isExecute && (
        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block">
            Тап: сделал → не сделал → сброс
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-500 block">
            Значение: (повт или время) × кг
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-500 block flex flex-wrap items-center gap-x-1 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              <IconCheckCircle
                size={HINT_ICON_SIZE}
                stroke={HINT_ICON_STROKE}
                className="shrink-0 text-emerald-600 dark:text-emerald-400 opacity-90"
              />
              Сделал
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <IconXCircle
                size={HINT_ICON_SIZE}
                stroke={HINT_ICON_STROKE}
                className="shrink-0 text-red-600 dark:text-red-400 opacity-90"
              />
              Не сделал
            </span>
            <span aria-hidden>·</span>
            <span>— Нет статуса.</span>
            <span>Отмечать можно только заполненные ячейки.</span>
            <span className="inline-flex items-center gap-1 mt-1 block">
              <span aria-hidden>📝</span>
              Заметка к подходу — тап по иконке для просмотра.
            </span>
          </span>
        </div>
      )}
      {fullNameModal !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          onClick={() => setFullNameModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="full-name-title"
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="full-name-title" className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Упражнение
            </h2>
            <p className="text-slate-900 dark:text-slate-100 break-words mb-4">
              {fullNameModal}
            </p>
            <button
              type="button"
              onClick={() => setFullNameModal(null)}
              className="w-full min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
      {noteViewText !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          onClick={() => setNoteViewText(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-view-title"
        >
          <div
            className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="note-view-title" className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Заметка
            </h2>
            <p className="text-slate-900 dark:text-slate-100 break-words mb-4 whitespace-pre-wrap">
              {noteViewText}
            </p>
            <button
              type="button"
              onClick={() => setNoteViewText(null)}
              className="w-full min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
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
