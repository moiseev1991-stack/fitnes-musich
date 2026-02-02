import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureSessionExerciseBelongsToUser(id, userId);

    await prisma.sessionExercise.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
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
