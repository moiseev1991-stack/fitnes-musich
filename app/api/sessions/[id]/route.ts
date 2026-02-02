import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSessionBelongsToUser } from "@/lib/permissions";
import { updateSessionSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureSessionBelongsToUser(id, userId);

    const session = await prisma.workoutSession.findUnique({
      where: { id },
      include: {
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercise: true,
            sets: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }

    return NextResponse.json({ session });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureSessionBelongsToUser(id, userId);

    const body = await request.json();
    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const session = await prisma.workoutSession.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ session });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureSessionBelongsToUser(id, userId);

    await prisma.workoutSession.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
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
