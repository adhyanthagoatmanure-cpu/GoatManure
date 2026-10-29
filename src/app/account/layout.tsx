import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminIdentity } from "@/lib/admin-identity";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { prisma } from "@/lib/prisma";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  if (isAdminIdentity(session.user.email, session.user.role)) redirect("/admin");

  const profileUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });
  if (!profileUser?.phone?.trim()) {
    redirect("/complete-profile?callbackUrl=/account");
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Account</p>
      <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">My Account</h1>
      <p className="mt-1 text-stone">Welcome back, {session.user.name?.split(" ")[0]}.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[250px_1fr] lg:gap-8">
        <AccountSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
