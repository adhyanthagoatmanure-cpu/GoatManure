import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-medium sm:text-4xl">My Account</h1>
      <p className="mt-1 text-[var(--color-stone)]">Welcome back, {session.user.name?.split(" ")[0]}.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <div>{children}</div>
      </div>
    </div>
  );
}
