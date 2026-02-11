"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface WorkoutInFolder {
  id: string;
  title: string | null;
  exerciseCount: number;
  exercisePreview: string[];
  updatedAt: string;
}

interface FolderForModal {
  id: string;
  name: string;
  totalWorkouts: number;
  workouts: WorkoutInFolder[];
}

interface HistoryItem {
  id: string;
  date: string;
  exerciseCount: number;
  preview: string[];
}

interface ApplyTemplateModalProps {
  targetDate: string;
  targetDateLabel: string;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
  showToast: (msg: string) => void;
  onEmptyCreate?: () => void;
}

type TabKind = "base" | "history";

export function ApplyTemplateModal({
  targetDate,
  targetDateLabel,
  onClose,
  onSuccess,
  showToast,
  onEmptyCreate,
}: ApplyTemplateModalProps) {
  const [tab, setTab] = useState<TabKind>("base");
  const [folders, setFolders] = useState<FolderForModal[]>([]);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [search, setSearch] = useState("");
  const [overwriteConfirm, setOverwriteConfirm] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/library/folders")
      .then(async (r) => {
        if (!r.ok) return { folders: [] };
        return r.json().catch(() => ({}));
      })
      .then((data) => {
        setFolders(data.folders ?? []);
        if ((data.folders ?? []).length > 0) {
          setExpandedFolderId(data.folders[0].id);
        }
      })
      .catch(() => setFolders([]))
      .finally(() => setLoadingBase(false));
  }, []);

  useEffect(() => {
    if (tab !== "history") return;
    setLoadingHistory(true);
    fetch(`/api/sessions/recent?before=${encodeURIComponent(targetDate)}&days=21`)
      .then(async (r) => {
        if (!r.ok) return { sessions: [] };
        return r.json().catch(() => ({}));
      })
      .then((data) => {
        setHistoryList(data.sessions ?? []);
      })
      .catch(() => setHistoryList([]))
      .finally(() => setLoadingHistory(false));
  }, [tab, targetDate]);

  const allBaseWorkouts = folders.flatMap((f) =>
    f.workouts.map((w) => ({ ...w, folderName: f.name }))
  );
  const filteredBase = search.trim()
    ? allBaseWorkouts.filter((w) => {
        const q = search.toLowerCase();
        const title = (w.title ?? "").toLowerCase();
        const preview = w.exercisePreview.join(" ").toLowerCase();
        return title.includes(q) || preview.includes(q);
      })
    : allBaseWorkouts;

  const filteredHistory = search.trim()
    ? historyList.filter((h) => {
        const q = search.toLowerCase();
        const preview = (h.preview ?? []).join(" ").toLowerCase();
        return h.date.includes(q) || preview.includes(q);
      })
    : historyList;

  const doApply = async (withOverwrite: boolean) => {
    if (!selectedId) return;
    setApplying(true);
    const payload =
      tab === "history"
        ? { targetDate, source: "history" as const, workoutId: selectedId, overwrite: withOverwrite }
        : { targetDate, source: "base" as const, templateId: selectedId, overwrite: withOverwrite };
    try {
      const res = await fetch("/api/workouts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && !withOverwrite) {
        setOverwriteConfirm(true);
        setApplying(false);
        return;
      }
      if (!res.ok) {
        showToast(data.error ?? "Не удалось применить");
        setApplying(false);
        return;
      }
      const newWorkoutId = data.workoutId ?? data.session?.id;
      if (newWorkoutId) {
        showToast("Тренировка создана на выбранную дату");
        onSuccess(newWorkoutId);
        onClose();
      } else {
        showToast("Ошибка: сервер не вернул id тренировки");
      }
    } catch {
      showToast("Ошибка сети");
    } finally {
      setApplying(false);
    }
  };

  const handleApply = () => doApply(false);

  const loading = tab === "base" ? loadingBase : loadingHistory;
  const hasBase = folders.length > 0 && allBaseWorkouts.length > 0;
  const hasHistory = historyList.length > 0;
  const emptyBase = !loadingBase && folders.length === 0;
  const showEmptyCreate = emptyBase && !search.trim() && onEmptyCreate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md max-h-[85vh] rounded-xl bg-white dark:bg-slate-800 shadow-xl flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Выбрать тренировку
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Применить на {targetDateLabel}
          </p>

          <div className="flex mt-3 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => { setTab("base"); setSelectedId(null); }}
              className={`flex-1 min-h-[36px] rounded-md text-sm font-medium ${
                tab === "base"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Из базы (папки)
            </button>
            <button
              type="button"
              onClick={() => { setTab("history"); setSelectedId(null); }}
              className={`flex-1 min-h-[36px] rounded-md text-sm font-medium ${
                tab === "history"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Из истории (21 день)
            </button>
          </div>

          <input
            type="text"
            placeholder="Поиск по названию или упражнению"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3 w-full min-h-[40px] px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              Загрузка…
            </p>
          ) : tab === "base" ? (
            <>
              {emptyBase && !search.trim() ? (
                <div className="py-6 px-4 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    В базе пока нет тренировок
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Создайте тренировку или заполните существующую
                  </p>
                  {showEmptyCreate && (
                    <Button variant="primary" size="sm" onClick={onEmptyCreate} className="mt-2">
                      Создать тренировку
                    </Button>
                  )}
                </div>
              ) : search.trim() ? (
                <ul className="space-y-1">
                  {filteredBase.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(w.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedId === w.id
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <span className="font-medium">{w.title || "Тренировка без названия"}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">· {w.folderName}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">· {w.exerciseCount} упр.</span>
                        {w.exercisePreview.length > 0 && (
                          <span className="text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                            {w.exercisePreview.join(", ")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                  {filteredBase.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                      Ничего не найдено
                    </p>
                  )}
                </ul>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => {
                    const isExpanded = expandedFolderId === folder.id;
                    const workouts = folder.workouts.filter((w) => w.exerciseCount > 0);
                    if (workouts.length === 0) return null;
                    return (
                      <div key={folder.id} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="font-medium text-slate-900 dark:text-slate-100">{folder.name}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{folder.totalWorkouts}</span>
                          <span className={`shrink-0 text-slate-400 text-xs ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                        </button>
                        {isExpanded && (
                          <ul className="border-t border-slate-200 dark:border-slate-700">
                            {workouts.map((w) => (
                              <li key={w.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(w.id)}
                                  className={`w-full text-left px-3 py-2.5 rounded-none text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                                    selectedId === w.id
                                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  }`}
                                >
                                  <span className="font-medium">{w.title || "Тренировка без названия"}</span>
                                  <span className="text-slate-500 dark:text-slate-400 ml-1">· {w.exerciseCount} упр.</span>
                                  {w.exercisePreview.length > 0 && (
                                    <span className="text-slate-500 dark:text-slate-400 truncate block mt-0.5 text-xs">
                                      {w.exercisePreview.slice(0, 3).join(", ")}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredHistory.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                  {search.trim() ? "Ничего не найдено" : "За последние 21 день тренировок нет"}
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredHistory.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(h.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedId === h.id
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                        }`}
                      >
                        <span className="font-medium">{h.date}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">· {h.exerciseCount} упр.</span>
                        {h.preview?.length > 0 && (
                          <span className="text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                            {h.preview.join(", ")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
            onClick={handleApply}
            disabled={!selectedId || applying}
            loading={applying}
          >
            Применить
          </Button>
        </div>
      </div>

      {overwriteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Перезаписать?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              На эту дату уже есть тренировка. Перезаписать?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setOverwriteConfirm(false)} disabled={applying}>
                Отмена
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setOverwriteConfirm(false);
                  doApply(true);
                }}
                disabled={applying}
                loading={applying}
              >
                Перезаписать
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
