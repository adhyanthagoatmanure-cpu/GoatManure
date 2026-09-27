import type { SVGProps } from "react";

/**
 * lucide-react (installed version) ships no brand/logo icons at all — verified
 * against the actual package exports, not assumed. These are minimal,
 * hand-drawn glyphs in lucide's own thin-stroke style, not reproductions of
 * any official logo artwork.
 */
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function Instagram(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Facebook(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v6h3v-6h2.5l.5-3H12V8a1 1 0 0 1 1-1h2Z" />
    </svg>
  );
}

export function Youtube(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <path d="M11 10.5v3l3-1.5Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
