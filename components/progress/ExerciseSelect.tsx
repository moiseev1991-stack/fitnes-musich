"use client";

import { useState, useEffect } from "react";

interface Exercise {
  id: string;
  name: string;
}

interface ExerciseSelectProps {
  value: string;
  onChange: (exerciseId: string) => void;
}

export function ExerciseSelect({ value, onChange }: ExerciseSelectProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => setExercises(data.exercises ?? []))
      .catch(() => {});
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
    >
      <option value="">Выберите упражнение</option>
      {exercises.map((ex) => (
        <option key={ex.id} value={ex.id}>
          {ex.name}
        </option>
      ))}
    </select>
  );
}
