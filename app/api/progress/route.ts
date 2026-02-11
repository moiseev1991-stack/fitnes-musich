import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { formatDateToUTC } from "@/lib/dateUtils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get("exerciseId");

    if (!exerciseId) {
      return NextResponse.json(
        { error: "Параметр exerciseId обязателен" },
        { status: 400 }
      );
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        date: { not: null },
        sessionExercises: {
          some: { exerciseId },
        },
      },
      include: {
        sessionExercises: {
          where: { exerciseId },
          include: {
            sets: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const data = sessions.map((s) => {
      const se = s.sessionExercises[0];
      if (!se) return null;
      const weights = se.sets
        .map((set) => set.weight)
        .filter((w): w is number => w != null);
      const maxWeight =
        weights.length > 0 ? Math.max(...weights) : 0;
      const max1RM = se.sets.reduce((best, set) => {
        if (set.weight == null) return best;
        const rm =
          set.reps === 1
            ? set.weight
            : set.weight * (1 + set.reps / 30); // Epley approximation
        return Math.max(best, rm);
      }, 0);
      return {
        date: formatDateToUTC(s.date),
        maxWeight,
        max1RM: Math.round(max1RM * 10) / 10,
      };
    }).filter(Boolean) as { date: string; maxWeight: number; max1RM: number }[];

    return NextResponse.json({ data });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
