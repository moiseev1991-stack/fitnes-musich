import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSessionBelongsToUser } from "@/lib/permissions";
import { isValidDateOnly, parseDateOnly, formatDateToUTC } from "@/lib/dateUtils";

/**
 * POST /api/workouts/apply
 * Единый endpoint применения тренировки на дату.
 * Body: { targetDate: "YYYY-MM-DD", source: "history" | "base", workoutId?: string, templateId?: string }, overwrite?: boolean
 * Ответ: { ok: true, workoutId: string, targetDate: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const targetDateStr = body.targetDate as string | undefined;
    const source = body.source as string | undefined;
    const workoutId = body.workoutId as string | undefined;
    const templateId = body.templateId as string | undefined;
    const overwrite = Boolean(body.overwrite);

    if (!targetDateStr || !isValidDateOnly(targetDateStr)) {
      return NextResponse.json(
        { error: "Некорректная дата targetDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const targetDate = parseDateOnly(targetDateStr);

    const sourceId =
      source === "history" ? workoutId : source === "base" ? templateId : undefined;
    if (!sourceId || (source !== "history" && source !== "base")) {
      return NextResponse.json(
        { error: "Укажите source: \"history\" или \"base\" и соответствующий workoutId или templateId" },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log("[workouts/apply] userId=%s targetDate=%s source=%s sourceId=%s overwrite=%s", userId, targetDateStr, source, sourceId, overwrite);
    }

    await ensureSessionBelongsToUser(sourceId, userId);

    const sourceSession = await prisma.workoutSession.findUnique({
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

    if (!sourceSession) {
      return NextResponse.json(
        { error: "Тренировка или шаблон не найдены" },
        { status: 404 }
      );
    }

    const existing = await prisma.workoutSession.findFirst({
      where: { userId, date: targetDate },
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

    const newSession = await prisma.workoutSession.create({
      data: {
        userId,
        date: targetDate,
        title: sourceSession.title,
        sessionExercises: {
          create: sourceSession.sessionExercises.map((se) => ({
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
                status: null,
              })),
            },
          })),
        },
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[workouts/apply] created workoutId=%s date=%s", newSession.id, newSession.date ? formatDateToUTC(newSession.date) : null);
    }

    return NextResponse.json({
      ok: true,
      workoutId: newSession.id,
      targetDate: formatDateToUTC(newSession.date!),
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if ((e as Error).message === "NOT_FOUND") {
      return NextResponse.json({ error: "Тренировка не найдена или доступ запрещён" }, { status: 404 });
    }
    console.error("[workouts/apply] error=%s stack=%s", (e as Error).message, (e as Error).stack);
    throw e;
  }
}
