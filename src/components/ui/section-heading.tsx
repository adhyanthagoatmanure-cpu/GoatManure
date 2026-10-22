import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="text-balance text-3xl font-medium leading-[1.12] sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-3.5 text-balance text-base leading-relaxed text-[var(--color-stone)]">
          {description}
        </p>
      )}
    </div>
  );
}
