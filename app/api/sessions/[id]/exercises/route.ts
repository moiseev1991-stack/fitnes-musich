import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSessionBelongsToUser } from "@/lib/permissions";
import { createSessionExerciseSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: sessionId } = await params;

    await ensureSessionBelongsToUser(sessionId, userId);

    const body = await request.json();
    const parsed = createSessionExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const { exerciseId, plannedSets } = parsed.data;

    const maxOrder = await prisma.sessionExercise.aggregate({
      where: { sessionId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const sessionExercise = await prisma.sessionExercise.create({
      data: {
        sessionId,
        exerciseId,
        plannedSets,
        orderIndex,
      },
      include: {
        exercise: true,
        sets: true,
      },
    });

    return NextResponse.json({ sessionExercise });
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
