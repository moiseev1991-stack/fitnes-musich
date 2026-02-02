"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Exercise {
  id: string;
  name: string;
  muscleGroups?: { id: number; name: string }[];
}

interface ExercisePickerProps {
  onSelect: (exercise: Exercise, plannedSets: number) => void;
  onClose: () => void;
}

async function safeFetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, init);
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");

    if (!res.ok) {
      if (isJson) {
        const body = await res.json();
        return { error: body.error ?? `Ошибка ${res.status}` };
      }
      const text = await res.text();
      return { error: text || `Ошибка ${res.status}` };
    }

    if (!isJson) {
      const text = await res.text();
      return { error: text ? "Неверный формат ответа" : "Пустой ответ" };
    }

    const data = await res.json();
    return { data };
  } catch (err) {
    return { error: (err as Error).message || "Ошибка сети" };
  }
}

export function ExercisePicker({ onSelect, onClose }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [plannedSets, setPlannedSets] = useState("3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/exercises?query=${encodeURIComponent(query)}`
        : "/api/exercises";
      const result = await safeFetchJson<{ exercises?: Exercise[] }>(url);
      if (result.error) {
        setError(
          "Не удалось загрузить список упражнений. Повторите попытку."
        );
        setExercises([]);
      } else {
        setExercises(result.data?.exercises ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleSelect = (ex: Exercise) => {
    const sets = parseInt(plannedSets, 10);
    if (sets >= 1 && sets <= 30) {
      onSelect(ex, sets);
    } else {
      onSelect(ex, 3);
    }
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (name.length < 2) {
      setError("Название должно быть не менее 2 символов");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const result = await safeFetchJson<{ exercise?: Exercise }>(
        "/api/exercises",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );
      if (result.error) {
        setError(result.error);
      } else if (result.data?.exercise) {
        handleSelect(result.data.exercise);
      }
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    query.trim().length >= 2 &&
    !exercises.some(
      (e) => e.name.toLowerCase() === query.trim().toLowerCase()
    );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Добавить упражнение</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>
      <div className="mb-4">
        <Input
          label="Поиск"
          placeholder="Название упражнения..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Плановых подходов:</label>
        <input
          type="number"
          min={1}
          max={30}
          value={plannedSets}
          onChange={(e) => setPlannedSets(e.target.value)}
          className="w-16 min-h-[44px] px-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center"
        />
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <ul className="flex-1 overflow-auto space-y-1">
        {loading ? (
          <li className="text-slate-500 py-4">Загрузка...</li>
        ) : canCreate ? (
          <>
            <li>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full min-h-[44px] px-4 py-2 text-left rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-medium border border-emerald-200 dark:border-emerald-800"
              >
                {creating ? "Создание..." : `Создать «${query.trim()}»`}
              </button>
            </li>
            {exercises.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(ex)}
                  className="w-full min-h-[44px] px-4 py-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center"
                >
                  <span className="font-medium">{ex.name}</span>
                  {ex.muscleGroups?.length ? (
                    <span className="text-xs text-slate-500">
                      {ex.muscleGroups.map((mg) => mg.name).join(", ")}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </>
        ) : exercises.length === 0 ? (
          <li className="text-slate-500 py-4">
            Нет упражнений. Введите название и создайте новое (от 2 символов).
          </li>
        ) : (
          exercises.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => handleSelect(ex)}
                className="w-full min-h-[44px] px-4 py-2 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center"
              >
                <span className="font-medium">{ex.name}</span>
                {ex.muscleGroups?.length ? (
                  <span className="text-xs text-slate-500">
                    {ex.muscleGroups.map((mg) => mg.name).join(", ")}
                  </span>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
