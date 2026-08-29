import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import type { MatchIndexEntry } from "@/lib/social";
import { SITE_URL } from "@/lib/social";

function readJson<T>(file: string): T[] {
  const full = path.join(process.cwd(), ".generated", file);
  if (!fs.existsSync(full)) return [];
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

function seasonSlugFor(date: string): string {
  const d = new Date(date);
  // Season runs Aug(year) → May(year+1); a match before July counts toward
  // the season that started the previous August.
  const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const matches = readJson<MatchIndexEntry>("matches.json");
  const players = readJson<{ playerId: string }>("players.json");
  const ninetyPlus = readJson<{ slug: string; date: string }>("ninety-plus.json");
  const seasons = new Set(matches.map((m) => seasonSlugFor(String(m.date))));

  return [
    { url: SITE_URL, lastModified: new Date() },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/90-plus` },
    ...matches.map((m) => ({ url: `${SITE_URL}/matches/${m.slug}`, lastModified: new Date(m.date) })),
    ...Array.from(seasons).map((s) => ({ url: `${SITE_URL}/seasons/${s}` })),
    ...players.map((p) => ({ url: `${SITE_URL}/players/${p.playerId}` })),
    ...ninetyPlus.map((n) => ({ url: `${SITE_URL}/90-plus/${n.slug}`, lastModified: new Date(n.date) })),
  ];
}
