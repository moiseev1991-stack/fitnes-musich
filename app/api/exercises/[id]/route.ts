import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureExerciseAccessible } from "@/lib/permissions";
import { z } from "zod";

const updateExerciseSchema = z.object({
  name: z.string().min(1).optional(),
  muscleGroupIds: z.array(z.number()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureExerciseAccessible(id, userId);

    const userExercise = await prisma.exercise.findFirst({
      where: { id, userId },
    });
    if (!userExercise) {
      return NextResponse.json(
        { error: "Можно редактировать только свои упражнения" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = updateExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const { name, muscleGroupIds } = parsed.data;

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(muscleGroupIds && {
          exerciseMuscleGroups: {
            deleteMany: {},
            create: muscleGroupIds.map((mgId) => ({ muscleGroupId: mgId })),
          },
        }),
      },
      include: {
        exerciseMuscleGroups: {
          include: { muscleGroup: true },
        },
      },
    });

    return NextResponse.json({
      exercise: {
        ...exercise,
        muscleGroups: exercise.exerciseMuscleGroups.map((emg) => emg.muscleGroup),
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
