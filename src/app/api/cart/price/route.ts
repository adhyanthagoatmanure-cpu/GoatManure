import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { priceCart } from "@/server/services/pricing.service";
import { z } from "zod";

const bodySchema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1) })),
  couponCode: z.string().optional(),
});

/**
 * The cart page sends only { variantId, quantity } pairs — never prices.
 * Everything shown to the customer (unit price, subtotal, discount, total)
 * comes back from this endpoint, computed fresh from the database.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });

  const session = await auth();
  const priced = await priceCart(parsed.data.items, {
    couponCode: parsed.data.couponCode,
    userId: session?.user?.id ?? null,
  });

  return NextResponse.json(priced);
}
