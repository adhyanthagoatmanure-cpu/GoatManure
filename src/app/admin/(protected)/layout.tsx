import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminIdentity } from "@/lib/admin-identity";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";
import { AdminProfileMenu } from "@/components/admin/admin-profile-menu";
import { Leaf } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminNotifications } from "@/components/admin/admin-notifications";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || !isAdminIdentity(session.user.email, session.user.role)) {
    redirect("/admin/login");
  }

  return (
    // No opaque page colour here: the soft green/gold colour field from globals.css shows through,
    // which is what the frosted header and summary cards blur.
    <div className="min-h-screen text-ink">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:h-screen">
          {/* Frosted top bar: translucent + blurred where supported, near-opaque white elsewhere. */}
          <header className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-3 border-b border-[var(--glass-edge)] bg-white/95 px-3 py-1.5 shadow-[inset_0_-1px_0_rgba(255,255,255,0.6),0_12px_32px_-24px_rgba(28,51,20,0.45)] supports-[backdrop-filter]:bg-white/[0.78] supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 sm:px-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-7">
              <AdminMobileHeader adminName={session.user.name ?? "Admin"} />
              <Logo className="w-[125px] sm:w-[155px]" />
              <div className="hidden items-center gap-2 md:flex">
                <Leaf className="h-5 w-5 text-leaf" aria-hidden />
                <span className="font-display text-base italic text-leaf">Healthy Soil&nbsp; | &nbsp;Green Future</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <AdminNotifications />

              <AdminProfileMenu adminName={session.user.name ?? "Admin"} adminEmail={session.user.email ?? null} adminImage={session.user.image} />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
