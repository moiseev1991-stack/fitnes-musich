import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isValidDateOnly, parseDateOnly, formatDateToUTC } from "@/lib/dateUtils";

/** POST — применить шаблон на дату (создать тренировку на targetDate по шаблону, статусы сброшены) */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const templateId = body.templateId as string | undefined;
    const targetDateStr = body.targetDate as string | undefined;

    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json(
        { error: "Укажите templateId" },
        { status: 400 }
      );
    }
    if (!targetDateStr || !isValidDateOnly(targetDateStr)) {
      return NextResponse.json(
        { error: "Некорректная дата targetDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnly(targetDateStr);

    const template = await prisma.workoutSession.findFirst({
      where: { id: templateId, userId, date: null },
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

    if (!template) {
      return NextResponse.json(
        { error: "Шаблон не найден или доступ запрещён" },
        { status: 404 }
      );
    }

    const existing = await prisma.workoutSession.findFirst({
      where: { userId, date: targetDate },
    });
    if (existing) {
      return NextResponse.json(
        { error: "На эту дату уже есть тренировка" },
        { status: 409 }
      );
    }

    const newSession = await prisma.workoutSession.create({
      data: {
        userId,
        date: targetDate,
        title: template.title,
        sessionExercises: {
          create: template.sessionExercises.map((se) => ({
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
                note: set.note,
                status: null,
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
        date: newSession.date ? formatDateToUTC(newSession.date) : null,
      },
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
