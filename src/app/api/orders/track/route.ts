import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatOrderNumber } from "@/lib/utils";
import { z } from "zod";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(1),
  contact: z.string().trim().min(3), // email or phone
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your order number and contact detail" }, { status: 400 });

  const { orderNumber, contact } = parsed.data;
  const normalized = formatOrderNumber(orderNumber);
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: { in: [normalized, orderNumber.toUpperCase()] },
    },
    include: { user: true },
  });

  const matches =
    order &&
    (order.guestEmail === contact ||
      order.guestPhone === contact ||
      order.user?.email === contact ||
      order.user?.phone === contact);

  if (!matches) {
    return NextResponse.json({ error: "No order found matching those details" }, { status: 404 });
  }

  return NextResponse.json({ orderId: order.id });
}
