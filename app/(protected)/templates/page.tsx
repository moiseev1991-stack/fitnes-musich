"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/Button";

interface WorkoutPreview {
  id: string;
  title: string | null;
  exerciseCount: number;
  exercisePreview: string[];
  updatedAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  sortOrder: number;
  totalWorkouts: number;
  workouts: WorkoutPreview[];
}

const PREVIEW_COUNT = 3;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TemplatesPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadFolders = async () => {
    try {
      const res = await fetch("/api/library/folders");
      const data = await res.json().catch(() => ({}));
      setFolders(data.folders ?? []);
      const list = data.folders ?? [];
      if (list.length > 0 && !expandedFolderId) {
        const first = list.find((f: { id: string }) => f.id !== "__none__") ?? list[0];
        setExpandedFolderId(first.id);
      }
    } catch {
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Ошибка создания");
        return;
      }
      if (data.template?.id) {
        router.push(`/session/${data.template.id}`);
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = (id: string) => {
    setMenuOpenId(null);
    router.push(`/session/${id}`);
  };

  const handleDuplicate = async (id: string) => {
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Ошибка дублирования");
        return;
      }
      if (data.template?.id) {
        loadFolders();
        router.push(`/session/${data.template.id}`);
      }
    } catch {
      alert("Ошибка сети");
    }
  };

  const handleDelete = async (id: string) => {
    setMenuOpenId(null);
    if (!confirm("Удалить тренировку из базы?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Ошибка удаления");
        return;
      }
      loadFolders();
    } catch {
      alert("Ошибка сети");
    }
  };

  return (
    <MobileLayout title="База">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Мои тренировки
        </h2>

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="w-full min-h-[44px] py-3 rounded-xl font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {creating ? "Создание…" : "+ Создать тренировку"}
        </button>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
            Загрузка…
          </p>
        ) : folders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6 text-center space-y-3">
            <p className="text-slate-600 dark:text-slate-400">
              У вас пока нет сохранённых тренировок
            </p>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={creating}>
              Создать тренировку
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {folders.map((folder) => {
              const isExpanded = expandedFolderId === folder.id;
              const showWorkouts = isExpanded ? folder.workouts : folder.workouts.slice(0, PREVIEW_COUNT);
              return (
                <section
                  key={folder.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFolderId(isExpanded ? null : folder.id)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {folder.name}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {folder.totalWorkouts} тренировок
                    </span>
                    <span
                      className={`shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {showWorkouts.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        Пока нет тренировок в папке
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {showWorkouts.map((w) => (
                          <li key={w.id}>
                            <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <button
                                type="button"
                                onClick={() => router.push(`/session/${w.id}`)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                  {w.title || "Тренировка без названия"}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {w.exerciseCount} упр.
                                  {w.exercisePreview.length > 0 && (
                                    <span className="ml-1 truncate inline-block max-w-[200px] align-bottom">
                                      · {w.exercisePreview.slice(0, 2).join(", ")}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                  Обновлено: {formatDate(w.updatedAt)}
                                </p>
                              </button>
                              <div className="relative shrink-0" ref={menuOpenId === w.id ? menuRef : undefined}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(menuOpenId === w.id ? null : w.id);
                                  }}
                                  className="min-w-[36px] min-h-[36px] p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                  aria-label="Меню"
                                >
                                  ⋯
                                </button>
                                {menuOpenId === w.id && (
                                  <div className="absolute right-0 top-full mt-1 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-20 min-w-[160px]">
                                    <button type="button" onClick={() => handleOpen(w.id)} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                      Открыть
                                    </button>
                                    <button type="button" onClick={() => handleDuplicate(w.id)} className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                      Дублировать
                                    </button>
                                    <button type="button" onClick={() => handleDelete(w.id)} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                      Удалить
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isExpanded && folder.workouts.length > PREVIEW_COUNT && (
                      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setExpandedFolderId(folder.id)}
                          className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Показать все ({folder.totalWorkouts})
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
