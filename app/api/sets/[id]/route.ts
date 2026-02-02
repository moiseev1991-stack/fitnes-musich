import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ensureSetBelongsToUser } from "@/lib/permissions";
import { updateSetSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    await ensureSetBelongsToUser(id, userId);

    const body = await request.json();
    const parsed = updateSetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Неверные данные" },
        { status: 400 }
      );
    }

    const { valueType, note, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    // Store type in note prefix (valueType column may not exist in Prisma client yet)
    if (valueType !== undefined || note !== undefined) {
      if (valueType === "time") {
        data.note = `@type=time;${note ?? ""}`;
      } else {
        data.note = note ?? null;
      }
    }

    const set = await prisma.set.update({
      where: { id },
      data: data as Parameters<typeof prisma.set.update>[0]["data"],
    });

    return NextResponse.json({ set });
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

    await ensureSetBelongsToUser(id, userId);

    await prisma.set.delete({
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
