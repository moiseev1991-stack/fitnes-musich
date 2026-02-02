import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/** Диапазон для списка "скопировать тренировку": только до targetDate, не включая её */
const RECENT_COPY_DAYS = 21;
const MAX_DAYS = 30;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const beforeParam = searchParams.get("before");

    if (!beforeParam || !/^\d{4}-\d{2}-\d{2}$/.test(beforeParam)) {
      return NextResponse.json(
        { error: "Параметр before обязателен (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const days = Math.min(
      Math.max(1, daysParam ? parseInt(daysParam, 10) : RECENT_COPY_DAYS),
      MAX_DAYS
    );
    // Только до выбранной даты (не включая targetDate): [targetDate - days, targetDate), в UTC
    const before = new Date(`${beforeParam}T00:00:00.000Z`);
    const from = new Date(before);
    from.setUTCDate(from.getUTCDate() - days);

    // Все сессии в диапазоне — включая без упражнений и без подходов (sets не требуются)
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

    const list = sessions.map((s) => {
      const preview = s.sessionExercises
        .slice(0, 3)
        .map((se) => se.exercise.name);
      const d = s.date;
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      return {
        id: s.id,
        date: dateStr,
        exerciseCount: s.sessionExercises.length,
        preview,
      };
    });

    return NextResponse.json({ sessions: list });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
