"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  maxWeight: number;
  max1RM: number;
}

interface ProgressChartProps {
  data: DataPoint[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-700">
        Нет данных для графика
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [`${value} кг`, "Макс вес"]}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Макс вес за тренировку"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
