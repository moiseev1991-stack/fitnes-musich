import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isValidDateOnly, parseDateOnly, formatDateToUTC } from "@/lib/dateUtils";

const DEFAULT_DAYS = 21;
const MAX_DAYS = 90;

/**
 * GET /api/workouts/library
 * Единый список тренировок для выбора в модалке "Выбрать из базы":
 * - тренировки по датам за последние N дней ДО toDate (история),
 * - плюс шаблоны (без даты).
 * Включает пустые тренировки (без подходов/значений).
 *
 * Query: toDate (YYYY-MM-DD), days (default 21)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const toDateParam = searchParams.get("toDate");
    const daysParam = searchParams.get("days");

    if (!toDateParam || !isValidDateOnly(toDateParam)) {
      return NextResponse.json(
        { error: "Параметр toDate обязателен (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const toDate = parseDateOnly(toDateParam);
    const days = Math.min(
      Math.max(1, daysParam ? parseInt(daysParam, 10) : DEFAULT_DAYS),
      MAX_DAYS
    );
    const from = new Date(toDate);
    from.setUTCDate(from.getUTCDate() - days);

    // 1) Тренировки по датам в диапазоне [from, toDate) — строго до toDate
    const datedSessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        date: {
          gte: from,
          lt: toDate,
        },
      },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        date: true,
        title: true,
        updatedAt: true,
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          select: {
            exercise: { select: { name: true } },
          },
        },
      },
    });

    // 2) Шаблоны (без даты)
    const templates = await prisma.workoutSession.findMany({
      where: { userId, date: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        date: true,
        title: true,
        updatedAt: true,
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          select: {
            exercise: { select: { name: true } },
          },
        },
      },
    });

    const mapItem = (
      s: {
        id: string;
        date: Date | null;
        title: string | null;
        updatedAt: Date;
        sessionExercises: { exercise: { name: string } }[];
      }
    ) => ({
      id: s.id,
      date: s.date ? formatDateToUTC(s.date) : null,
      title: s.title ?? null,
      exerciseCount: s.sessionExercises.length,
      exercisePreview: s.sessionExercises.slice(0, 4).map((se) => se.exercise.name),
      updatedAt: s.updatedAt.toISOString(),
    });

    const list = [
      ...datedSessions.map(mapItem),
      ...templates.map(mapItem),
    ];

    return NextResponse.json({ workouts: list });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
