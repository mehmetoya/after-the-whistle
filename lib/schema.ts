import { z } from "zod";

export const CompetitionEnum = z.enum([
  "Premier League",
  "Champions League",
  "FA Cup",
  "Carabao Cup",
]);

export const PlayerRatingSchema = z.object({
  playerId: z.string().min(1), // stable slug, e.g. "virgil-van-dijk"
  name: z.string().min(1), // display name, e.g. "Virgil van Dijk"
  rating: z.number().int().min(1).max(10),
});
export type PlayerRating = z.infer<typeof PlayerRatingSchema>;

export const SocialSchema = z
  .object({
    notes: z.array(z.string().min(1)).min(1).max(5).optional(),
  })
  .optional();

export const MatchFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  date: z.coerce.date(),
  opponent: z.string().min(1),
  competition: CompetitionEnum,
  venue: z.string().min(1),
  homeAway: z.enum(["Home", "Away"]),
  score: z.object({
    home: z.number().int().nonnegative(),
    away: z.number().int().nonnegative(),
  }),
  result: z.enum(["W", "D", "L"]),
  motm: z.string().min(1), // playerId — must exist in this match's playerRatings, checked in compile-content.ts
  tags: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  excerpt: z.string().min(1),
  social: SocialSchema,
  draft: z.boolean().default(false),
});
export type MatchFrontmatter = z.infer<typeof MatchFrontmatterSchema>;

export const NinetyPlusFrontmatterSchema = z.object({
  type: z.literal("ninety-plus"),
  date: z.coerce.date(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  relatedMatch: z.string().optional(), // slug reference, checked in compile-content.ts
  draft: z.boolean().default(false),
});
export type NinetyPlusFrontmatter = z.infer<typeof NinetyPlusFrontmatterSchema>;

/**
 * Cross-cutting rules that a single-document Zod schema can't express.
 * Enforced in lib/compile-content.ts against the full collection:
 *
 *  - `result` must be consistent with `score` (Liverpool's side derived from `homeAway`)
 *  - `motm` playerId must appear in this match's playerRatings export
 *  - every `relatedMatch` in ninety-plus content must resolve to a real match slug
 *  - no duplicate slugs across the whole `matches` collection
 */
