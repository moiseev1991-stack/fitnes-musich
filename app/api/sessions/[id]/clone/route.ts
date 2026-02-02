import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSessionBelongsToUser } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: sourceId } = await params;

    await ensureSessionBelongsToUser(sourceId, userId);

    const body = await request.json().catch(() => ({}));
    const targetDate = body.targetDate as string | undefined;
    const overwrite = Boolean(body.overwrite);

    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return NextResponse.json(
        { error: "Некорректная дата targetDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // Одна и та же календарная дата в любой TZ: YYYY-MM-DD → UTC midnight
    const target = new Date(`${targetDate}T00:00:00.000Z`);

    const existing = await prisma.workoutSession.findFirst({
      where: { userId, date: target },
    });

    if (existing && !overwrite) {
      return NextResponse.json(
        { error: "На эту дату уже есть тренировка", code: "CONFLICT" },
        { status: 409 }
      );
    }

    if (existing) {
      await prisma.workoutSession.delete({
        where: { id: existing.id },
      });
    }

    const source = await prisma.workoutSession.findUnique({
      where: { id: sourceId },
      include: {
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Тренировка не найдена" },
        { status: 404 }
      );
    }

    const newSession = await prisma.workoutSession.create({
      data: {
        userId,
        date: target,
        title: source.title,
        sessionExercises: {
          create: source.sessionExercises.map((se) => ({
            exerciseId: se.exerciseId,
            plannedSets: se.plannedSets,
            orderIndex: se.orderIndex,
            supersetGroupId: se.supersetGroupId,
            supersetOrder: se.supersetOrder,
            sets: {
              create: se.sets.map((set) => ({
                weight: set.weight,
                reps: set.reps,
                valueType: set.valueType ?? "reps",
                note: null,
                status: null, // статусы выполнения не копируем — в новой тренировке всегда none
              })),
            },
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

    return NextResponse.json({
      session: {
        id: newSession.id,
        date: newSession.date.toISOString().slice(0, 10),
      },
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if ((e as Error).message === "NOT_FOUND") {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    throw e;
  }
}
