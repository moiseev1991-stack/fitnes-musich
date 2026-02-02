import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createExerciseSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim().toLowerCase();

    let exercises = await prisma.exercise.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      include: {
        exerciseMuscleGroups: {
          include: { muscleGroup: true },
        },
      },
      orderBy: { name: "asc" },
    });

    if (query) {
      const q = query.toLowerCase();
      exercises = exercises
        .filter((e) => e.name.toLowerCase().includes(q))
        .slice(0, 20);
    } else {
      exercises = exercises.slice(0, 50);
    }

    return NextResponse.json({
      exercises: exercises.map((e) => ({
        ...e,
        muscleGroups: e.exerciseMuscleGroups.map((emg) => emg.muscleGroup),
      })),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    return NextResponse.json(
      { error: msg || "Ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = createExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const { muscleGroupIds } = parsed.data;

    const allExercises = await prisma.exercise.findMany({
      where: { OR: [{ userId: null }, { userId }] },
    });
    const existing = allExercises.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      const full = await prisma.exercise.findUnique({
        where: { id: existing.id },
        include: {
          exerciseMuscleGroups: { include: { muscleGroup: true } },
        },
      });
      if (full) {
        return NextResponse.json({
          exercise: {
            ...full,
            muscleGroups: full.exerciseMuscleGroups.map((emg) => emg.muscleGroup),
          },
        });
      }
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        userId,
        exerciseMuscleGroups: muscleGroupIds?.length
          ? {
              create: muscleGroupIds.map((mgId) => ({
                muscleGroupId: mgId,
              })),
            }
          : undefined,
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
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    return NextResponse.json(
      { error: msg || "Ошибка сервера" },
      { status: 500 }
    );
  }
}
