import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isValidDateOnly, parseDateOnly, formatDateToUTC } from "@/lib/dateUtils";

/** Диапазон для списка "скопировать тренировку": только до targetDate, не включая её */
const RECENT_COPY_DAYS = 21;
const MAX_DAYS = 30;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const beforeParam = searchParams.get("before");

    if (!beforeParam || !isValidDateOnly(beforeParam)) {
      return NextResponse.json(
        { error: "Параметр before обязателен (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const days = Math.min(
      Math.max(1, daysParam ? parseInt(daysParam, 10) : RECENT_COPY_DAYS),
      MAX_DAYS
    );
    const before = parseDateOnly(beforeParam);
    const from = new Date(before);
    from.setUTCDate(from.getUTCDate() - days);

    // Все сессии в диапазоне — включая без упражнений и без подходов (без inner join на sets)
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        date: {
          gte: from,
          lt: before,
        },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          select: {
            exercise: { select: { name: true } },
          },
        },
      },
    });

    const list = sessions
      .filter((s): s is typeof s & { date: Date } => s.date != null)
      .map((s) => ({
        id: s.id,
        date: formatDateToUTC(s.date),
        exerciseCount: s.sessionExercises.length,
        preview: s.sessionExercises.slice(0, 3).map((se) => se.exercise.name),
      }));

    return NextResponse.json({ sessions: list });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
