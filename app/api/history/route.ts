import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { formatDateToUTC } from "@/lib/dateUtils";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const sessions = await prisma.workoutSession.findMany({
      where: { userId, date: { not: null } },
      orderBy: { date: "desc" },
      take: limit,
      select: {
        id: true,
        date: true,
        title: true,
        _count: {
          select: { sessionExercises: true },
        },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        id: s.id,
        date: s.date ? formatDateToUTC(s.date) : "",
        title: s.title,
        exercisesCount: s._count.sessionExercises,
      })),
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
