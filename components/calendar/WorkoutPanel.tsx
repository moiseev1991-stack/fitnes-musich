"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { WorkoutTable, type SetData } from "@/components/session/WorkoutTable";
import { ExercisePicker } from "@/components/exercises/ExercisePicker";
import { SetFormModal } from "@/components/session/SetFormModal";
import { CopySessionModal } from "./CopySessionModal";

export interface SessionExerciseData {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string };
  plannedSets: number;
  supersetGroupId?: string | null;
  supersetOrder?: number | null;
  sets: (SetData & { status?: string | null; valueType?: string | null })[];
}

export interface SessionData {
  id: string;
  date: string;
  title: string | null;
  sessionExercises: SessionExerciseData[];
}

interface WorkoutPanelProps {
  sessionId: string | null;
  sessionData: SessionData | null;
  sessionLoading: boolean;
  selectedDate: Date;
  onOpenSession: (id: string) => void;
  onCreateSession: (date: string) => void;
  onCopyPrevious: (date: string) => void;
  onCopySessionSuccess?: (sessionId: string) => void;
  showToast: (msg: string) => void;
  mode: "execute" | "edit";
  onModeChange: (mode: "execute" | "edit") => void;
  onRefreshSession: (sessionId: string) => void;
  onSessionDataUpdate: (sessionId: string, data: SessionData) => void;
}

export function WorkoutPanel({
  sessionId,
  sessionData,
  sessionLoading,
  selectedDate,
  onOpenSession,
  onCreateSession,
  onCopyPrevious,
  onCopySessionSuccess,
  showToast,
  mode,
  onModeChange,
  onRefreshSession,
  onSessionDataUpdate,
}: WorkoutPanelProps) {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const [showPicker, setShowPicker] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<{
    sessionExerciseId: string;
    editingSet?: SetData;
    exerciseName?: string;
  } | null>(null);

  const handleAddExercise = async (
    exercise: { id: string; name: string },
    plannedSets: number
  ) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, plannedSets }),
      });
      setShowPicker(false);
      onRefreshSession(sessionId);
    } catch {
      showToast("Ошибка при добавлении упражнения");
    }
  };

  const handleCellClick = (
    sessionExerciseId: string,
    set?: SetData,
    exerciseName?: string
  ) => {
    setSaveError(null);
    setFormFor({ sessionExerciseId, editingSet: set, exerciseName });
  };

  const handleSaveSet = async (data: {
    weight?: number | null;
    reps: number;
    note?: string;
    valueType?: "reps" | "time";
  }) => {
    if (!formFor || !sessionId || !sessionData) return;
    const { sessionExerciseId, editingSet } = formFor;
    const payload = {
      reps: data.reps,
      weight: data.weight ?? null,
      note: data.note ?? undefined,
      valueType: data.valueType ?? "reps",
    };
    setSaveError(null);
    try {
      const url = editingSet
        ? `/api/sets/${editingSet.id}`
        : `/api/session-exercises/${sessionExerciseId}/sets`;
      const res = await fetch(url, {
        method: editingSet ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(json.error ?? "Ошибка при сохранении");
        return;
      }
      setFormFor(null);
      onRefreshSession(sessionId);
    } catch {
      setSaveError("Ошибка сети");
    }
  };

  const handleDeleteSet = async (set: SetData) => {
    if (!confirm("Удалить подход?")) return;
    try {
      await fetch(`/api/sets/${set.id}`, { method: "DELETE" });
      setFormFor(null);
      onRefreshSession(sessionId!);
    } catch {
      showToast("Ошибка при удалении");
    }
  };

  const handleDeleteExercise = async (
    sessionExerciseId: string,
    _exerciseName: string
  ) => {
    try {
      await fetch(`/api/session-exercises/${sessionExerciseId}`, {
        method: "DELETE",
      });
      onRefreshSession(sessionId!);
    } catch {
      showToast("Ошибка при удалении");
    }
  };

  const handleStatusToggle = async (
    set: SetData,
    nextStatus: "done" | "missed" | null
  ) => {
    if (!sessionId || !sessionData) return;
    const prevSession = sessionData;
    const updatedSession: SessionData = {
      ...prevSession,
      sessionExercises: prevSession.sessionExercises.map((se) => ({
        ...se,
        sets: se.sets.map((s) =>
          s.id === set.id ? { ...s, status: nextStatus } : s
        ),
      })),
    };
    onSessionDataUpdate(sessionId, updatedSession);
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        onSessionDataUpdate(sessionId, prevSession);
        showToast("Ошибка при обновлении статуса");
      }
    } catch {
      onSessionDataUpdate(sessionId, prevSession);
      showToast("Ошибка при обновлении статуса");
    }
  };

  const handleEmptyCellClick = () => {
    showToast("Сначала внесите значение подхода");
  };

  if (!sessionId) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6 space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          На эту дату тренировки нет
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onCreateSession(dateStr)}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            Создать тренировку
          </button>
          <button
            type="button"
            onClick={() => setShowCopyModal(true)}
            className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Скопировать тренировку
          </button>
          {showCopyModal && (
            <CopySessionModal
              targetDate={dateStr}
              onClose={() => setShowCopyModal(false)}
              onSuccess={(sessionId) => {
                onCopySessionSuccess?.(sessionId);
                setShowCopyModal(false);
              }}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    );
  }

  if (sessionLoading && !sessionData) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
        <p className="text-slate-500 dark:text-slate-400">Загрузка…</p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
        <p className="text-slate-500 dark:text-slate-400">
          Не удалось загрузить тренировку
        </p>
      </div>
    );
  }

  const exercises = sessionData.sessionExercises.map((se) => ({
    id: se.id,
    name: se.exercise.name,
    plannedSets: se.plannedSets,
    supersetGroupId: se.supersetGroupId,
    supersetOrder: se.supersetOrder,
    sets: se.sets.map((s) => ({
      id: s.id,
      weight: s.weight,
      reps: s.reps,
      note: s.note,
      valueType: (s.valueType ?? null) as "reps" | "time" | null,
      status: (s.status ?? null) as "done" | "missed" | null,
    })),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          Тренировка на {format(selectedDate, "dd.MM.yy")}
        </h3>
        <button
          type="button"
          onClick={() => onOpenSession(sessionId)}
          className="shrink-0 min-h-[36px] px-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          Открыть на отдельной странице
        </button>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => onModeChange("execute")}
          className={`flex-1 min-h-[40px] rounded-lg font-medium transition-colors ${
            mode === "execute"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Выполнение
        </button>
        <button
          type="button"
          onClick={() => onModeChange("edit")}
          className={`flex-1 min-h-[40px] rounded-lg font-medium transition-colors ${
            mode === "edit"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Редактирование
        </button>
      </div>

      <WorkoutTable
        mode={mode}
        exercises={exercises}
        onCellClick={handleCellClick}
        onStatusToggle={handleStatusToggle}
        onEmptyCellClick={handleEmptyCellClick}
        onDeleteExercise={handleDeleteExercise}
        onAddExercise={() => setShowPicker(true)}
      />

      {showPicker && (
        <ExercisePicker
          onSelect={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      )}

      {formFor && (
        <SetFormModal
          onSave={handleSaveSet}
          saveError={saveError}
          onClose={() => setFormFor(null)}
          onDelete={
            formFor.editingSet
              ? async () => {
                  await handleDeleteSet(formFor.editingSet!);
                }
              : undefined
          }
          initialWeight={formFor.editingSet?.weight}
          initialReps={formFor.editingSet?.reps}
          initialNote={formFor.editingSet?.note}
          initialValueType={
            (formFor.editingSet?.valueType ?? null) as "reps" | "time" | null
          }
          exerciseName={formFor.exerciseName}
        />
      )}
    </div>
  );
}
