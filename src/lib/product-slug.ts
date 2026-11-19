export function getProductSlugLookupCandidates(slug: string): string[] {
  try {
    const decoded = decodeURIComponent(slug);
    return decoded === slug ? [slug] : [slug, decoded];
  } catch {
    return [slug];
  }
}
