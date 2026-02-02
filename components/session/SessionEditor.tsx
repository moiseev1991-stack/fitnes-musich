"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { WorkoutTable, type SetData } from "./WorkoutTable";
import { ExercisePicker } from "@/components/exercises/ExercisePicker";
import { SetFormModal } from "./SetFormModal";
import { Button } from "@/components/ui/Button";

interface SessionExerciseData {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string };
  plannedSets: number;
  supersetGroupId?: string | null;
  supersetOrder?: number | null;
  sets: (SetData & { status?: string | null; valueType?: string | null })[];
}

interface SessionData {
  id: string;
  date: string;
  title: string | null;
  sessionExercises: SessionExerciseData[];
}

interface SessionEditorProps {
  session: SessionData;
  onBack: () => void;
  onRefresh: () => void;
  onSessionDeleted?: (dateStr: string) => void;
  showToast?: (msg: string) => void;
}

export function SessionEditor({
  session,
  onBack,
  onRefresh,
  onSessionDeleted,
  showToast = (m) => alert(m),
}: SessionEditorProps) {
  const [mode, setMode] = useState<"execute" | "edit">("edit");
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    try {
      await fetch(`/api/sessions/${session.id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: exercise.id, plannedSets }),
      });
      setShowPicker(false);
      onRefresh();
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
    if (!formFor) return;
    const { sessionExerciseId, editingSet } = formFor;
    const weightTrimmed = data.weight != null ? data.weight : null;
    const payload = {
      reps: data.reps,
      weight: weightTrimmed,
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
      setSaveError(null);
      onRefresh();
    } catch {
      setSaveError("Ошибка сети");
    }
  };

  const handleDeleteSet = async (set: SetData) => {
    if (!confirm("Удалить подход?")) return;
    try {
      await fetch(`/api/sets/${set.id}`, { method: "DELETE" });
      setFormFor(null);
      onRefresh();
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
      onRefresh();
    } catch {
      showToast("Ошибка при удалении упражнения");
    }
  };

  const handleStatusToggle = async (
    set: SetData,
    nextStatus: "done" | "missed" | null
  ) => {
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) onRefresh();
    } catch {
      showToast("Ошибка при обновлении статуса");
    }
  };

  const handleEmptyCellClick = () => {
    showToast("Сначала внесите значение подхода");
  };

  const handleDeleteSession = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        showToast(json.error ?? "Не удалось удалить тренировку. Попробуйте ещё раз.");
        setDeleteLoading(false);
        return;
      }
      setShowDeleteConfirm(false);
      const dateStr = format(new Date(session.date), "yyyy-MM-dd");
      onSessionDeleted?.(dateStr);
    } catch {
      showToast("Не удалось удалить тренировку. Попробуйте ещё раз.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exercises = session.sessionExercises.map((se) => ({
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
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 min-w-[44px] min-h-[44px] p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          ←
        </button>
        <h2 className="font-semibold text-sm sm:text-base truncate max-w-[calc(100%-60px)]">
          {session.title ||
            format(new Date(session.date), "d MMM yyyy", { locale: ru })}{" "}
          — {session.sessionExercises.length} упр.
        </h2>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4">
        <button
          type="button"
          onClick={() => setMode("execute")}
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
          onClick={() => setMode("edit")}
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
        onDeleteSession={
          mode === "edit" && onSessionDeleted
            ? () => setShowDeleteConfirm(true)
            : undefined
        }
      />

      {showPicker && (
        <ExercisePicker
          onSelect={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Удалить тренировку?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Тренировка будет удалена без возможности восстановления.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSession}
                disabled={deleteLoading}
                loading={deleteLoading}
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
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
