/**
 * Content compiler.
 *
 * Reads content/matches/*.mdx and content/ninety-plus/*.mdx, validates
 * frontmatter with Zod, evaluates each MDX body to pull out its named
 * `playerRatings` export, cross-validates the whole collection, and writes
 * the result to .generated/*.json.
 *
 * .generated/ is a build artifact — never commit it, never hand-edit it.
 * This script is chained into `npm run build` (see package.json) so local
 * and Netlify builds always run the same pipeline against the same source.
 *
 * Run: tsx lib/compile-content.ts
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import {
  MatchFrontmatterSchema,
  NinetyPlusFrontmatterSchema,
  PlayerRatingSchema,
  type MatchFrontmatter,
  type NinetyPlusFrontmatter,
  type PlayerRating,
} from "./schema";
import { computeContentHash } from "./social";

const CONTENT_DIR = path.join(process.cwd(), "content");
const OUT_DIR = path.join(process.cwd(), ".generated");

type Problem = { file: string; message: string };
const problems: Problem[] = [];

function fail(file: string, message: string) {
  problems.push({ file, message });
}

async function evaluateMdxExports(source: string, file: string) {
  try {
    const mod = await evaluate(source, { ...runtime, Fragment: runtime.Fragment });
    return mod as Record<string, unknown>;
  } catch (err) {
    fail(file, `MDX evaluate failed: ${(err as Error).message}`);
    return {};
  }
}

async function loadMatches() {
  const dir = path.join(CONTENT_DIR, "matches");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const matches: Array<{
    frontmatter: MatchFrontmatter;
    playerRatings: PlayerRating[];
    file: string;
  }> = [];

  const seenSlugs = new Set<string>();

  for (const file of files) {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);

    const parsed = MatchFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      fail(file, `Frontmatter invalid: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const frontmatter = parsed.data;

    if (frontmatter.draft) continue;

    if (seenSlugs.has(frontmatter.slug)) {
      fail(file, `Duplicate slug "${frontmatter.slug}"`);
      continue;
    }
    seenSlugs.add(frontmatter.slug);

    const exports = await evaluateMdxExports(content, file);
    const rawRatings = (exports.playerRatings ?? []) as unknown[];
    const playerRatings: PlayerRating[] = [];

    for (const r of rawRatings) {
      const rp = PlayerRatingSchema.safeParse(r);
      if (!rp.success) {
        fail(file, `Invalid playerRatings entry: ${rp.error.issues.map((i) => i.message).join("; ")}`);
        continue;
      }
      playerRatings.push(rp.data);
    }

    // Cross-check: motm must reference a playerId present in this match's ratings
    if (!playerRatings.some((r) => r.playerId === frontmatter.motm)) {
      fail(
        file,
        `motm "${frontmatter.motm}" does not match any playerId in this match's playerRatings`
      );
    }

    // Cross-check: result must agree with the scoreline (Liverpool is always one side)
    const liverpoolGoals = frontmatter.homeAway === "Home" ? frontmatter.score.home : frontmatter.score.away;
    const opponentGoals = frontmatter.homeAway === "Home" ? frontmatter.score.away : frontmatter.score.home;
    const derivedResult =
      liverpoolGoals > opponentGoals ? "W" : liverpoolGoals < opponentGoals ? "L" : "D";
    if (derivedResult !== frontmatter.result) {
      fail(
        file,
        `result "${frontmatter.result}" is inconsistent with score (derived "${derivedResult}" from ${frontmatter.homeAway.toLowerCase()} scoreline)`
      );
    }

    matches.push({ frontmatter, playerRatings, file });
  }

  return matches;
}

async function loadNinetyPlus(matchSlugs: Set<string>) {
  const dir = path.join(CONTENT_DIR, "ninety-plus");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  const entries: Array<{ frontmatter: NinetyPlusFrontmatter; file: string }> = [];
  const seenSlugs = new Set<string>();

  for (const file of files) {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data } = matter(raw);

    const parsed = NinetyPlusFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      fail(file, `Frontmatter invalid: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
      continue;
    }
    const frontmatter = parsed.data;
    if (frontmatter.draft) continue;

    if (seenSlugs.has(frontmatter.slug)) {
      fail(file, `Duplicate slug "${frontmatter.slug}"`);
      continue;
    }
    seenSlugs.add(frontmatter.slug);

    if (frontmatter.relatedMatch && !matchSlugs.has(frontmatter.relatedMatch)) {
      fail(file, `relatedMatch "${frontmatter.relatedMatch}" does not resolve to a known match slug`);
    }

    entries.push({ frontmatter, file });
  }

  return entries;
}

function buildPlayersIndex(
  matches: Array<{ frontmatter: MatchFrontmatter; playerRatings: PlayerRating[] }>
) {
  const players = new Map<
    string,
    { playerId: string; name: string; allRatings: Array<{ matchSlug: string; rating: number; date: string }> }
  >();

  for (const m of matches) {
    for (const r of m.playerRatings) {
      if (!players.has(r.playerId)) {
        players.set(r.playerId, { playerId: r.playerId, name: r.name, allRatings: [] });
      }
      players.get(r.playerId)!.allRatings.push({
        matchSlug: m.frontmatter.slug,
        rating: r.rating,
        date: m.frontmatter.date.toISOString(),
      });
    }
  }

  return Array.from(players.values()).map((p) => ({
    ...p,
    average: Number((p.allRatings.reduce((sum, x) => sum + x.rating, 0) / p.allRatings.length).toFixed(2)),
  }));
}

async function main() {
  const matches = await loadMatches();
  const matchSlugs = new Set(matches.map((m) => m.frontmatter.slug));
  const ninetyPlus = await loadNinetyPlus(matchSlugs);

  if (problems.length > 0) {
    console.error(`\ncontent:build failed with ${problems.length} problem(s):\n`);
    for (const p of problems) console.error(`  [${p.file}] ${p.message}`);
    console.error("");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUT_DIR, "matches.json"),
    JSON.stringify(
      matches
        .map((m) => ({ ...m.frontmatter, contentHash: computeContentHash(m.frontmatter) }))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "ratings.json"),
    JSON.stringify(
      matches.map((m) => ({ matchSlug: m.frontmatter.slug, ratings: m.playerRatings })),
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "players.json"),
    JSON.stringify(buildPlayersIndex(matches), null, 2)
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "ninety-plus.json"),
    JSON.stringify(
      ninetyPlus.map((n) => n.frontmatter).sort((a, b) => b.date.getTime() - a.date.getTime()),
      null,
      2
    )
  );

  console.log(
    `content:build OK — ${matches.length} match(es), ${ninetyPlus.length} 90+ note(s) → .generated/`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
