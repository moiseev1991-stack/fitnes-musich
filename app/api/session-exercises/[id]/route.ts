import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const se = await prisma.sessionExercise.findFirst({
      where: { id, session: { userId } },
      select: { id: true, sessionId: true, supersetGroupId: true },
    });
    if (!se) throw new Error("NOT_FOUND");

    await prisma.sessionExercise.delete({
      where: { id },
    });

    if (se.supersetGroupId) {
      const leftInGroup = await prisma.sessionExercise.count({
        where: { sessionId: se.sessionId, supersetGroupId: se.supersetGroupId },
      });
      if (leftInGroup === 1) {
        await prisma.sessionExercise.updateMany({
          where: { sessionId: se.sessionId, supersetGroupId: se.supersetGroupId },
          data: { supersetGroupId: null, supersetOrder: null },
        });
      }
    }

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
