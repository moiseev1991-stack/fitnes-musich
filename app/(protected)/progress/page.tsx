"use client";

import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ExerciseSelect } from "@/components/progress/ExerciseSelect";
import { ProgressChart } from "@/components/progress/ProgressChart";

interface DataPoint {
  date: string;
  maxWeight: number;
  max1RM: number;
}

export default function ProgressPage() {
  const [exerciseId, setExerciseId] = useState("");
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    if (!exerciseId) {
      setData([]);
      return;
    }
    fetch(`/api/progress?exerciseId=${exerciseId}`)
      .then((r) => r.json())
      .then((res) => setData(res.data ?? []))
      .catch(() => setData([]));
  }, [exerciseId]);

  return (
    <MobileLayout title="Прогресс">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Упражнение
          </label>
          <ExerciseSelect value={exerciseId} onChange={setExerciseId} />
        </div>
        <p className="text-sm text-slate-500">
          График: максимальный вес за тренировку по датам
        </p>
        <ProgressChart data={data} />
      </div>
    </MobileLayout>
  );
}
