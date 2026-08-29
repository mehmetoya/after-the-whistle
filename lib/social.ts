import crypto from "node:crypto";
import type { MatchFrontmatter } from "./schema";

// Trailing slash is stripped defensively: if the env var is set with one
// (e.g. copied straight from a browser address bar — confirmed to happen
// on the real Netlify deploy), naive `${SITE_URL}/path` concatenation
// elsewhere would produce a double slash in canonical/OG/JSON-LD URLs.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://afterthewhistle.example").replace(
  /\/+$/,
  ""
);

export type SocialVariant = "og" | "instagram" | "story";

/**
 * Deterministic content hash used for OG/social image cache-busting
 * (spec Bölüm 6.1). Computed identically at build time (compile-content.ts,
 * stored as `contentHash` in .generated/matches.json) and at request time
 * (app/api/social/[slug]/route.ts), so a post edit changes the hash and
 * therefore the URL — no stale CDN/X/WhatsApp preview.
 */
export function computeContentHash(frontmatter: MatchFrontmatter): string {
  return crypto.createHash("sha256").update(JSON.stringify(frontmatter)).digest("hex").slice(0, 12);
}

export function socialImageUrl(slug: string, variant: SocialVariant, hash: string): string {
  return `/api/social/${slug}?variant=${variant}&v=${hash}`;
}

/**
 * Resolves a possibly-relative URL against SITE_URL. Generated social
 * images are always relative (`/api/social/...`); a licensed `coverImage`
 * may be absolute (a CDN URL) or relative (a local asset). Naively
 * prefixing SITE_URL onto an already-absolute URL produces
 * "https://domain.comhttps://cdn.example.com/..." — this is the one place
 * that concatenation happens, so every consumer (JSON-LD, OG/Twitter
 * metadata, and any future RSS image use) goes through it instead of
 * repeating the string-join.
 */
export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export type MatchIndexEntry = MatchFrontmatter & { contentHash: string };
