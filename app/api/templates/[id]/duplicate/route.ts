import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/** POST — дублировать шаблон (новый шаблон с тем же содержимым) */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: sourceId } = await params;

    const source = await prisma.workoutSession.findFirst({
      where: { id: sourceId, userId, date: null },
      include: {
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          include: {
            sets: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Шаблон не найден или доступ запрещён" },
        { status: 404 }
      );
    }

    const title = source.title ? `${source.title} (копия)` : null;

    const newTemplate = await prisma.workoutSession.create({
      data: {
        userId,
        date: null,
        folderId: source.folderId,
        title,
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
                note: set.note,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({
      template: { id: newTemplate.id },
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
