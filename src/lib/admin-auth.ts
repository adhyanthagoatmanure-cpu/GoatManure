import { auth } from "@/lib/auth";
import { isAdminIdentity } from "@/lib/admin-identity";

/** Every /api/admin/* route calls this first. Middleware already blocks
 * unauthenticated browser navigation to /admin/*, but API routes are called
 * directly too, so they re-check independently rather than relying on the
 * middleware alone. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminIdentity(session.user.email, session.user.role)) {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}
