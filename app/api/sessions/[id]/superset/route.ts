import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSessionBelongsToUser } from "@/lib/permissions";
import { randomUUID } from "crypto";

/** POST: объединить 2+ упражнений в суперсет. Тело: { sessionExerciseIds: string[] }. Порядок в группе — по orderIndex в тренировке. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: sessionId } = await params;
    await ensureSessionBelongsToUser(sessionId, userId);

    const body = await request.json();
    const ids = body?.sessionExerciseIds;
    if (!Array.isArray(ids) || ids.length < 2 || ids.some((x: unknown) => typeof x !== "string")) {
      return NextResponse.json(
        { error: "Нужно минимум два id упражнений: sessionExerciseIds: [id1, id2, ...]" },
        { status: 400 }
      );
    }

    const uniqueIds = [...new Set(ids)] as string[];
    const exercises = await prisma.sessionExercise.findMany({
      where: {
        id: { in: uniqueIds },
        sessionId,
      },
      orderBy: { orderIndex: "asc" },
    });

    if (exercises.length !== uniqueIds.length) {
      return NextResponse.json(
        { error: "Все упражнения должны принадлежать этой тренировке" },
        { status: 400 }
      );
    }

    const plannedSets = exercises[0].plannedSets;
    if (exercises.some((e) => e.plannedSets !== plannedSets)) {
      return NextResponse.json(
        { error: "У упражнений должно быть одинаковое количество подходов" },
        { status: 400 }
      );
    }

    const groupId = randomUUID();
    await prisma.$transaction(
      exercises.map((ex, i) =>
        prisma.sessionExercise.update({
          where: { id: ex.id },
          data: { supersetGroupId: groupId, supersetOrder: i + 1 },
        })
      )
    );

    return NextResponse.json({ supersetGroupId: groupId });
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
