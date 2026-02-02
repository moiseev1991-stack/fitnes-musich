"use client";

import { SetList } from "./SetList";

interface SetData {
  id: string;
  weight: number;
  reps: number;
  note: string | null;
}

interface ExerciseBlockProps {
  id: string;
  name: string;
  plannedSets: number;
  sets: SetData[];
  onAddSet: () => void;
  onEditSet: (set: SetData) => void;
  onDeleteSet: (set: SetData) => void;
}

export function ExerciseBlock({
  name,
  plannedSets,
  sets,
  onAddSet,
  onEditSet,
  onDeleteSet,
}: ExerciseBlockProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
      <div className="mb-3">
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-slate-500">
          План: {sets.length}/{plannedSets} подходов
        </p>
      </div>
      <SetList
        sets={sets}
        onAdd={onAddSet}
        onEdit={onEditSet}
        onDelete={onDeleteSet}
      />
    </div>
  );
}
