import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Mail, Phone, Calendar } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return null;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-canopy)] font-display text-2xl font-semibold text-white">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </span>
        <div>
          <h2 className="font-display text-xl font-medium">{user.name}</h2>
          <p className="text-sm text-[var(--color-stone)]">Member since {formatDate(user.createdAt)}</p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 border-t border-[var(--color-border)] pt-6 sm:grid-cols-2">
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow icon={Phone} label="Phone" value={user.phone ?? "Not added"} />
        <InfoRow icon={Calendar} label="Account Type" value={user.role === "ADMIN" ? "Administrator" : "Customer"} />
      </div>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-[var(--color-stone)]" />
      <div>
        <p className="text-xs text-[var(--color-stone)]">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
