import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const updateSchema = z.object({
  notificationId: z.string().min(1).optional(),
  markAll: z.boolean().optional(),
});

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.adminNotification.count({ where: { readAt: null } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const { ok } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.notificationId && !parsed.data.markAll)) {
    return NextResponse.json({ error: "Provide a notificationId or markAll" }, { status: 400 });
  }

  if (parsed.data.markAll) {
    await prisma.adminNotification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
  } else if (parsed.data.notificationId) {
    await prisma.adminNotification.updateMany({
      where: { id: parsed.data.notificationId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
