import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ProfileImageUploadButton } from "@/components/account/profile-image-upload-button";
import { Mail, Phone, Calendar } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return null;

  return (
    <section aria-labelledby="profile-heading" className="glass rounded-[var(--radius-lg)] p-6 sm:p-8">
      <div className="flex items-center gap-4">
        {user.image ? (
          <Image
            src={user.image}
            alt={`${user.name ?? "User"} profile`}
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white/70 shadow-[var(--shadow-soft)]"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,var(--color-leaf),var(--color-canopy-dark))] font-display text-2xl font-semibold text-white ring-4 ring-white/70 shadow-[var(--shadow-soft)]"
          >
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        )}
        <div className="min-w-0">
          <h2 id="profile-heading" className="break-words font-display text-2xl font-semibold">{user.name}</h2>
          <p className="text-sm text-stone">Member since {formatDate(user.createdAt)}</p>
          <ProfileImageUploadButton />
        </div>
      </div>

      <div className="mt-7 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow icon={Phone} label="Phone" value={user.phone ?? "Not added"} />
        <InfoRow icon={Calendar} label="Account Type" value={user.role === "ADMIN" ? "Administrator" : "Customer"} />
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-canopy">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone">{label}</p>
        <p className="break-words text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
