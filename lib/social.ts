import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { MatchFrontmatter } from "./schema";
import type { Locale } from "./i18n";

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
 * stored as `contentHash` in .generated/{locale}/matches.json) and at
 * request time (app/api/social/[slug]/route.ts), so a post edit changes the
 * hash and therefore the URL — no stale CDN/X/WhatsApp preview.
 */
export function computeContentHash(frontmatter: MatchFrontmatter): string {
  return crypto.createHash("sha256").update(JSON.stringify(frontmatter)).digest("hex").slice(0, 12);
}

export function socialImageUrl(slug: string, variant: SocialVariant, hash: string, locale: Locale): string {
  return `/api/social/${slug}?variant=${variant}&v=${hash}&locale=${locale}`;
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

export type PlayerIndexEntry = {
  playerId: string;
  name: string;
  average: number;
  allRatings: Array<{ matchSlug: string; rating: number; date: string }>;
};

export type NinetyPlusIndexEntry = {
  type: "ninety-plus";
  date: string;
  slug: string;
  relatedMatch?: string;
};

function readGenerated<T>(locale: Locale, file: string): T[] {
  const full = path.join(process.cwd(), ".generated", locale, file);
  if (!fs.existsSync(full)) return [];
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

export const getMatchesIndex = (locale: Locale) => readGenerated<MatchIndexEntry>(locale, "matches.json");
export const getPlayersIndex = (locale: Locale) => readGenerated<PlayerIndexEntry>(locale, "players.json");
export const getNinetyPlusIndex = (locale: Locale) =>
  readGenerated<NinetyPlusIndexEntry>(locale, "ninety-plus.json");
