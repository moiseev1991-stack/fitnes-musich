"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

/** Диапазон списка источников: только до выбранной даты, по умолчанию 3 недели */
const RECENT_COPY_DAYS = 21;

const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Форматирует строку YYYY-MM-DD без создания Date — избегает сдвига по TZ (5-е не превращается в 6-е) */
function formatDateOnly(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [, m, d] = parts;
  const monthIdx = parseInt(m, 10) - 1;
  const day = parseInt(d, 10);
  if (monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) return dateStr;
  return `${day} ${MONTHS_RU[monthIdx]}. ${parts[0]}`;
}

export interface RecentSessionItem {
  id: string;
  date: string;
  exerciseCount: number;
  /** Первые 2–3 названия упражнений для превью */
  preview: string[];
}

interface CopySessionModalProps {
  targetDate: string;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
  showToast: (msg: string) => void;
}

export function CopySessionModal({
  targetDate,
  onClose,
  onSuccess,
  showToast,
}: CopySessionModalProps) {
  const [sessions, setSessions] = useState<RecentSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [copyingLast, setCopyingLast] = useState(false);
  const [overwriteConfirm, setOverwriteConfirm] = useState(false);

  useEffect(() => {
    const url = `/api/sessions/recent?before=${targetDate}&days=${RECENT_COPY_DAYS}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) return { sessions: [] };
        const data = await r.json().catch(() => ({}));
        return data;
      })
      .then((data) => {
        const raw = data.sessions ?? [];
        setSessions(
          raw.map((s: { id: string; date: string; exerciseCount?: number; preview?: string[]; exercisePreview?: string[] }) => ({
            id: s.id,
            date: s.date,
            exerciseCount: s.exerciseCount ?? 0,
            preview: s.preview ?? s.exercisePreview ?? [],
          }))
        );
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [targetDate]);

  const handleCopyLast = async () => {
    const first = sessions[0];
    if (!first) return;
    setCopyingLast(true);
    try {
      const res = await fetch(`/api/sessions/${first.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate, overwrite: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setSelectedId(first.id);
        setOverwriteConfirm(true);
        setCopyingLast(false);
        return;
      }
      if (!res.ok) {
        showToast(data.error ?? "Не удалось скопировать");
        setCopyingLast(false);
        return;
      }
      if (data.session?.id) {
        showToast("Тренировка скопирована");
        onSuccess(data.session.id);
        onClose();
      } else {
        showToast("Ошибка: нет id сессии");
      }
    } catch {
      showToast("Ошибка сети");
    } finally {
      setCopyingLast(false);
    }
  };

  const handleCopy = async (withOverwrite = false) => {
    if (!selectedId) return;
    setCopying(true);
    try {
      const res = await fetch(`/api/sessions/${selectedId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate,
          overwrite: withOverwrite,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && !withOverwrite) {
        setOverwriteConfirm(true);
        setCopying(false);
        return;
      }

      if (!res.ok) {
        showToast(data.error ?? "Не удалось скопировать тренировку");
        setCopying(false);
        return;
      }

      if (data.session?.id) {
        showToast("Тренировка скопирована");
        onSuccess(data.session.id);
        onClose();
      } else {
        showToast("Ошибка: нет id сессии");
      }
    } catch {
      showToast("Ошибка сети");
    } finally {
      setCopying(false);
    }
  };

  if (overwriteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Перезаписать?
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            На эту дату уже есть тренировка. Перезаписать?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setOverwriteConfirm(false);
              }}
              disabled={copying}
            >
              Отмена
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleCopy(true)}
              disabled={copying}
              loading={copying}
            >
              Перезаписать
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md max-h-[85vh] rounded-xl bg-white dark:bg-slate-800 shadow-xl flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Скопировать тренировку
          </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Выберите тренировку за последние {RECENT_COPY_DAYS} дней (до выбранной даты)
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Загрузка…
            </p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              За последние {RECENT_COPY_DAYS} дней тренировок нет
            </p>
          ) : (
            <>
              {sessions.length > 0 && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={handleCopyLast}
                    disabled={copyingLast}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 disabled:opacity-50"
                  >
                    {copyingLast ? "Копирование…" : "Скопировать последнюю"}
                  </button>
                </div>
              )}
              <ul className="space-y-1">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedId === s.id
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                    }`}
                  >
                    <span className="font-medium" title={s.date}>
                      {formatDateOnly(s.date)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 mx-1">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {s.exerciseCount} упражн.
                    </span>
                    {s.preview.length > 0 && (
                      <>
                        <span className="text-slate-400 dark:text-slate-500 mx-1">
                          ·
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 truncate block sm:inline">
                          {s.preview.join(", ")}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
              </ul>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 justify-end shrink-0">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCopy(false)}
            disabled={!selectedId || copying || sessions.length === 0}
            loading={copying}
          >
            Скопировать
          </Button>
        </div>
      </div>
    </div>
  );
}
