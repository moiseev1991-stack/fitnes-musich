"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { parseNote } from "@/lib/setType";

const TIME_EXERCISES = [
  "планка",
  "боковая планка",
  "велосипед",
  "подъём ног",
];

function isTimeExercise(exerciseName: string): boolean {
  const name = exerciseName.toLowerCase();
  return TIME_EXERCISES.some((t) => name.includes(t));
}

function parseTimeInput(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const v = parseInt(s, 10);
    return v >= 1 ? v : null;
  }
  const mmss = s.match(/^(\d{1,3}):(\d{2})$/);
  if (mmss) {
    const m = parseInt(mmss[1], 10);
    const sec = parseInt(mmss[2], 10);
    if (sec < 60 && m >= 0) return m * 60 + sec;
  }
  return null;
}

function formatSecondsToInput(seconds: number): string {
  if (seconds < 60) return String(seconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface SetFormModalProps {
  onSave: (data: {
    weight?: number | null;
    reps: number;
    note?: string;
    valueType?: "reps" | "time";
  }) => void;
  onClose: () => void;
  onDelete?: () => void;
  saveError?: string | null;
  initialWeight?: number | null;
  initialReps?: number;
  initialNote?: string | null;
  initialValueType?: "reps" | "time" | null;
  exerciseName?: string;
}

export function SetFormModal({
  onSave,
  onClose,
  onDelete,
  saveError,
  initialWeight,
  initialReps,
  initialNote,
  initialValueType,
  exerciseName = "",
}: SetFormModalProps) {
  const [valueType, setValueType] = useState<"reps" | "time">("reps");
  const [weight, setWeight] = useState(
    initialWeight != null ? String(initialWeight) : ""
  );
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialReps != null && initialReps > 0) {
      const type =
        initialValueType ?? parseNote(initialNote ?? "").type;
      const userNote = parseNote(initialNote ?? "").userNote;
      setValueType(type);
      setValue(
        type === "time" ? formatSecondsToInput(initialReps) : String(initialReps)
      );
      setNote(userNote);
    } else if (initialValueType === "time" || isTimeExercise(exerciseName)) {
      setValueType("time");
      setValue("");
      setNote(parseNote(initialNote ?? "").userNote);
    } else {
      setValueType(initialValueType ?? "reps");
      setValue("");
      setNote(parseNote(initialNote ?? "").userNote);
    }
  }, [initialReps, initialNote, initialValueType, exerciseName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let repsValue: number;

    if (valueType === "reps") {
      const r = parseInt(value, 10);
      if (!value || isNaN(r) || r < 1 || r > 200) {
        setError("Повторы: 1–200");
        return;
      }
      repsValue = r;
    } else {
      const parsed = parseTimeInput(value);
      if (parsed === null || parsed < 1 || parsed > 7200) {
        setError("Время: число секунд (45, 60) или mm:ss (1:00, 2:30)");
        return;
      }
      repsValue = parsed;
    }

    const w = weight.trim() ? parseFloat(weight) : null;
    if (weight.trim() && (isNaN(w as number) || (w as number) <= 0)) {
      setError("Вес должен быть > 0 или пусто");
      return;
    }

    setError("");
    const userNote = note.trim();
    onSave({
      weight: weight.trim() ? (w as number) : null,
      reps: repsValue,
      note: userNote || undefined,
      valueType,
    });
  };

  const label =
    valueType === "reps"
      ? "Повторы (обязательно)"
      : "Время (обязательно)";
  const placeholder = valueType === "reps" ? "10" : "60 или 1:00";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">
          {initialReps !== undefined && initialReps !== null
            ? "Редактировать подход"
            : "Добавить подход"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              Тип
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValueType("reps")}
                className={`flex-1 min-h-[44px] rounded-xl font-medium transition-colors ${
                  valueType === "reps"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                Повторы
              </button>
              <button
                type="button"
                onClick={() => setValueType("time")}
                className={`flex-1 min-h-[44px] rounded-xl font-medium transition-colors ${
                  valueType === "time"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                Время
              </button>
            </div>
          </div>
          <Input
            label={label}
            type="text"
            inputMode={valueType === "reps" ? "numeric" : "text"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Input
            label="Вес (кг, необязательно)"
            type="number"
            step="0.1"
            min="0.1"
            placeholder="50 или пусто"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            label="Заметка (необязательно)"
            placeholder="До 280 символов"
            maxLength={280}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {(error || saveError) && (
            <p className="text-sm text-red-600">{error || saveError}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="primary" className="flex-1 min-w-0">
              Сохранить
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (confirm("Удалить подход?")) {
                    onDelete();
                  }
                }}
                className="w-full sm:w-auto"
              >
                Удалить подход
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
