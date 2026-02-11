import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { seedUserLibraryIfEmpty } from "@/lib/seedLibrary";

const isPrismaMissingTableOrColumn = (e: unknown): boolean => {
  const code = (e as { code?: string })?.code;
  return code === "P2021" || code === "P2022"; // table does not exist / column does not exist
};

/** GET — папки со всеми шаблонами. Ленивый сидинг: при отсутствии папок создаются 3 папки и 9 шаблонов. */
export async function GET(_request: NextRequest) {
  let userId: string;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }

  try {
    try {
      await seedUserLibraryIfEmpty(userId);
    } catch (seedErr) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[library/folders] seed failed:", seedErr);
      }
      if (isPrismaMissingTableOrColumn(seedErr)) {
        return NextResponse.json({ folders: [] });
      }
    }

    const folders = await prisma.workoutFolder.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
      include: {
        sessions: {
          where: { date: null },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            updatedAt: true,
            sessionExercises: {
              orderBy: { orderIndex: "asc" },
              select: {
                exercise: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const totalByFolder = await Promise.all(
      folders.map((f) =>
        prisma.workoutSession.count({
          where: { folderId: f.id, date: null },
        })
      )
    );

    const uncategorized = await prisma.workoutSession.findMany({
      where: { userId, date: null, folderId: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          select: { exercise: { select: { name: true } } },
        },
      },
    });
    const uncategorizedCount = uncategorized.length;

    const list = folders.map((folder, i) => ({
      id: folder.id,
      name: folder.name,
      sortOrder: folder.sortOrder,
      totalWorkouts: totalByFolder[i] ?? 0,
      workouts: folder.sessions.map((s) => ({
        id: s.id,
        title: s.title ?? null,
        exerciseCount: s.sessionExercises.length,
        exercisePreview: s.sessionExercises.slice(0, 4).map((se) => se.exercise.name),
        updatedAt: s.updatedAt.toISOString(),
      })),
    }));

    if (uncategorizedCount > 0) {
      list.push({
        id: "__none__",
        name: "Без папки",
        sortOrder: 999,
        totalWorkouts: uncategorizedCount,
        workouts: uncategorized.map((s) => ({
          id: s.id,
          title: s.title ?? null,
          exerciseCount: s.sessionExercises.length,
          exercisePreview: s.sessionExercises.slice(0, 4).map((se) => se.exercise.name),
          updatedAt: s.updatedAt.toISOString(),
        })),
      });
    }

    return NextResponse.json({ folders: list });
  } catch (e) {
    if (isPrismaMissingTableOrColumn(e)) {
      console.warn("[library/folders] DB schema missing (run migrations):", (e as Error).message);
      return NextResponse.json({ folders: [] });
    }
    console.error("[library/folders] GET", "userId=", userId, (e as Error).message, (e as Error).stack);
    throw e;
  }
}
