import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSessionBelongsToUser } from "@/lib/permissions";

/** POST: разъединить суперсет. Тело: { supersetGroupId: string }. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id: sessionId } = await params;
    await ensureSessionBelongsToUser(sessionId, userId);

    const body = await request.json();
    const groupId = body?.supersetGroupId;
    if (typeof groupId !== "string" || !groupId) {
      return NextResponse.json(
        { error: "Укажите supersetGroupId" },
        { status: 400 }
      );
    }

    const count = await prisma.sessionExercise.updateMany({
      where: { sessionId, supersetGroupId: groupId },
      data: { supersetGroupId: null, supersetOrder: null },
    });

    return NextResponse.json({ updated: count.count });
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
