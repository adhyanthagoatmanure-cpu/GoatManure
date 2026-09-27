/**
 * A clean, flat illustration of a stand-up kraft pouch — used everywhere a
 * product photo would normally go. The brief calls for clean/premium/natural
 * with no clutter, and real product photography wasn't part of the provided
 * assets, so an illustrated system (bag + soil/leaf motifs) was the more
 * honest choice than faking photography. Swap for real photos any time by
 * replacing usages of this component with next/image.
 */
export function ProductBagIllustration({
  className,
  bagColor = "#C7A46B",
  bagColorDark = "#AD8752",
}: {
  className?: string;
  bagColor?: string;
  bagColorDark?: string;
}) {
  return (
    <svg viewBox="0 0 400 480" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of an ADHYANTHA goat manure fertilizer bag">
      <ellipse cx="200" cy="440" rx="130" ry="18" fill="#2A2A22" opacity="0.06" />
      {/* fold */}
      <path d="M120 70 Q200 30 280 70 L272 110 Q200 82 128 110 Z" fill={bagColorDark} />
      {/* bag body */}
      <path
        d="M128 108 L272 108 L296 400 Q296 424 272 424 L128 424 Q104 424 104 400 Z"
        fill={bagColor}
      />
      {/* side crease shadows */}
      <path d="M128 108 L152 108 L158 424 L128 424 Q104 424 104 400 Z" fill="#000" opacity="0.06" />
      <path d="M272 108 L248 108 L242 424 L272 424 Q296 424 296 400 Z" fill="#000" opacity="0.06" />
      {/* stitch line */}
      <path
        d="M118 130 L282 130"
        stroke="#000"
        strokeOpacity="0.12"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      {/* label */}
      <rect x="150" y="180" width="100" height="100" rx="8" fill="var(--color-parchment, #FAF6EC)" />
      <circle cx="200" cy="215" r="26" fill="none" stroke="var(--color-gold, #C9A227)" strokeWidth="3" />
      <path
        d="M188 208 Q192 195 200 195 Q208 195 212 208 Q214 214 210 222 L200 232 L190 222 Q186 214 188 208 Z"
        fill="var(--color-bronze, #A15C1E)"
      />
      <path d="M178 236 L200 250 L222 236 L200 244 Z" fill="var(--color-canopy, #2B4C1F)" />
      <text
        x="200"
        y="268"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        letterSpacing="1"
        fill="var(--color-canopy, #2B4C1F)"
        fontFamily="ui-sans-serif, system-ui"
      >
        ADHYANTHA
      </text>
      {/* weight chip */}
      <rect x="164" y="320" width="72" height="28" rx="14" fill="#00000010" />
    </svg>
  );
}

export function LeafMotif({ className, color = "var(--color-canopy)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 100 C20 50 50 20 100 20 C100 70 70 100 20 100 Z"
        fill="none"
        stroke={color}
        strokeWidth="3"
        opacity="0.35"
      />
      <path d="M20 100 C50 90 80 60 100 20" fill="none" stroke={color} strokeWidth="2" opacity="0.35" />
    </svg>
  );
}

export function SoilTexture({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" className={className} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M0 30 Q50 10 100 28 T200 26 T300 32 T400 24 V60 H0 Z"
        fill="var(--color-canopy-dark)"
      />
    </svg>
  );
}
