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
    <div className="min-h-screen bg-[#f7f9f5] text-[#183c2d]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:h-screen">
          <header className="flex min-h-[64px] items-center justify-between border-b border-[#e3ebe2] bg-white px-3 py-1.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3 sm:gap-7">
              <AdminMobileHeader adminName={session.user.name ?? "Admin"} />
              <Logo className="w-[125px] sm:w-[155px]" />
              <div className="hidden items-center gap-2 md:flex">
                <Leaf className="h-5 w-5 text-[#69be28]" />
                <span className="font-[cursive] text-base text-[#4f7f49]">Healthy Soil&nbsp; | &nbsp;Green Future</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <AdminNotifications />

              <AdminProfileMenu adminName={session.user.name ?? "Admin"} adminEmail={session.user.email ?? null} adminImage={session.user.image} />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
