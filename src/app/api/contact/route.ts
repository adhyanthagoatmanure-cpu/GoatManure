import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactFormSchema } from "@/lib/validations/checkout";
import { createAdminNotification } from "@/server/services/admin-notification.service";

export async function POST(req: Request) {
  const parsed = contactFormSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const message = await prisma.contactMessage.create({ data: parsed.data });
  await createAdminNotification({
    type: "CONTACT",
    title: "New contact message",
    message: `${message.name}: ${message.subject}`,
    href: "/admin",
  });
  return NextResponse.json({ id: message.id }, { status: 201 });
}
