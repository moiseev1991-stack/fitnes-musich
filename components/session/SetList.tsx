"use client";

import { Button } from "@/components/ui/Button";

interface SetData {
  id: string;
  weight: number;
  reps: number;
  note: string | null;
}

interface SetListProps {
  sets: SetData[];
  onAdd: () => void;
  onEdit: (set: SetData) => void;
  onDelete: (set: SetData) => void;
}

export function SetList({ sets, onAdd, onEdit, onDelete }: SetListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Подходы ({sets.length})
        </span>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          + Подход
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <th className="w-8 px-2 py-1.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                #
              </th>
              <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                Повторы
              </th>
              <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                Кг
              </th>
              <th className="w-20 px-1 py-1.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, i) => (
              <tr
                key={set.id}
                onClick={() => onEdit(set)}
                className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer"
              >
                <td className="px-2 py-2.5 text-slate-500 dark:text-slate-400">
                  {i + 1}
                </td>
                <td className="px-3 py-2.5 font-medium">{set.reps}</td>
                <td className="px-3 py-2.5 font-medium">{set.weight}</td>
                <td className="px-1 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <span className="inline-flex items-center gap-0.5">
                    {set.note && (
                      <button
                        type="button"
                        onClick={() => onEdit(set)}
                        className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        title={set.note}
                        aria-label="Редактировать заметку"
                      >
                        📝
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(set)}
                      className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                      aria-label="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(set);
                      }}
                      className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                      aria-label="Удалить"
                    >
                      🗑️
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
