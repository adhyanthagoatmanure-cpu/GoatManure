import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  designation: z.string().trim().min(2, "Enter your designation").max(80, "Designation is too long"),
  bio: z.string().trim().max(500, "About Me must be 500 characters or less"),
  image: z.string().trim().refine((value) => value.startsWith("/"), "Invalid profile image").max(500).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "You must be signed in" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, designation: true, bio: true, image: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid mobile number" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      designation: parsed.data.designation,
      bio: parsed.data.bio,
      ...(parsed.data.image !== undefined ? { image: parsed.data.image } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, designation: true, bio: true, image: true },
  });

  return NextResponse.json(user);
}
