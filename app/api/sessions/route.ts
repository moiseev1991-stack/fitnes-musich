import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Параметры from и to обязательны" },
        { status: 400 }
      );
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId,
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        title: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const { date, title } = parsed.data;

    const existing = await prisma.workoutSession.findFirst({
      where: { userId, date: new Date(date) },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Тренировка на эту дату уже существует" },
        { status: 409 }
      );
    }

    const session = await prisma.workoutSession.create({
      data: {
        userId,
        date: new Date(date),
        title: title ?? null,
      },
    });

    return NextResponse.json({ session });
  } catch (e) {
    if ((e as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    throw e;
  }
}
