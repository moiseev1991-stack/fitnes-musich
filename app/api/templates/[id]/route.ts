import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateSessionSchema } from "@/lib/validators";

async function ensureTemplateBelongsToUser(templateId: string, userId: string) {
  const t = await prisma.workoutSession.findFirst({
    where: { id: templateId, userId, date: null },
  });
  if (!t) throw new Error("NOT_FOUND");
}

/** GET — один шаблон (полная структура для редактирования) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureTemplateBelongsToUser(id, userId);

    const session = await prisma.workoutSession.findUnique({
      where: { id },
      include: {
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercise: true,
            sets: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!session || session.date !== null) {
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

/** PUT — обновить шаблон (title, note) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureTemplateBelongsToUser(id, userId);

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

/** DELETE — удалить шаблон */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureTemplateBelongsToUser(id, userId);

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
