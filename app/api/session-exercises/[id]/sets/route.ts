import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSetSchema } from "@/lib/validators";

async function ensureSessionExerciseBelongsToUser(
  sessionExerciseId: string,
  userId: string
) {
  const se = await prisma.sessionExercise.findFirst({
    where: {
      id: sessionExerciseId,
      session: { userId },
    },
  });
  if (!se) throw new Error("NOT_FOUND");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: sessionExerciseId } = await params;

    await ensureSessionExerciseBelongsToUser(sessionExerciseId, userId);

    const body = await request.json();
    const parsed = createSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const { weight, reps, note, valueType } = parsed.data;

    // Store type in note prefix if time (valueType column may not exist in Prisma client yet)
    const finalNote =
      valueType === "time" ? `@type=time;${note ?? ""}` : note ?? null;

    const set = await prisma.set.create({
      data: {
        sessionExercise: { connect: { id: sessionExerciseId } },
        weight: weight ?? null,
        reps,
        note: finalNote,
      },
    });

    return NextResponse.json({ set });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    return NextResponse.json(
      { error: msg || "Ошибка при создании подхода" },
      { status: 500 }
    );
  }
}
