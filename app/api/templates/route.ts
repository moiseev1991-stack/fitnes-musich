import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/** GET — список шаблонов (тренировок без даты) текущего пользователя */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const templates = await prisma.workoutSession.findMany({
      where: { userId, date: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        sessionExercises: {
          orderBy: { orderIndex: "asc" },
          select: {
            exercise: { select: { name: true } },
          },
        },
      },
    });

    const list = templates.map((t) => ({
      id: t.id,
      title: t.title ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      exerciseCount: t.sessionExercises.length,
      preview: t.sessionExercises.slice(0, 5).map((se) => se.exercise.name),
    }));

    return NextResponse.json({ templates: list });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}

/** POST — создать шаблон (тренировку без даты). body: { title?, folderId? } */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() || null : null;
    let folderId: string | null = typeof body.folderId === "string" ? body.folderId : null;
    if (folderId) {
      const folder = await prisma.workoutFolder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) folderId = null;
    }
    if (!folderId) {
      const first = await prisma.workoutFolder.findFirst({
        where: { userId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      folderId = first?.id ?? null;
    }

    const template = await prisma.workoutSession.create({
      data: {
        userId,
        date: null,
        folderId,
        title,
      },
    });

    return NextResponse.json({
      template: {
        id: template.id,
        title: template.title,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
