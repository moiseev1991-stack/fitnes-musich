import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isValidDateOnly, parseDateOnly } from "@/lib/dateUtils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { date } = await params;

    if (!isValidDateOnly(date)) {
      return NextResponse.json(
        { error: "Некорректная дата (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnly(date);

    const existing = await prisma.workoutSession.findFirst({
      where: { userId, date: targetDate },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Тренировка на эту дату уже существует" },
        { status: 409 }
      );
    }

    const lastSession = await prisma.workoutSession.findFirst({
      where: {
        userId,
        date: { lt: targetDate },
      },
      orderBy: { date: "desc" },
      include: {
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!lastSession) {
      return NextResponse.json(
        { error: "Нет предыдущих тренировок для копирования" },
        { status: 404 }
      );
    }

    const newSession = await prisma.workoutSession.create({
      data: {
        userId,
        date: targetDate,
        title: lastSession.title,
        sessionExercises: {
          create: lastSession.sessionExercises.map((se) => ({
            exerciseId: se.exerciseId,
            plannedSets: se.plannedSets,
            orderIndex: se.orderIndex,
          })),
        },
      },
      include: {
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          include: { exercise: true },
        },
      },
    });

    return NextResponse.json({ session: newSession });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
