import type { MetadataRoute } from "next";
import { SITE_URL, getMatchesIndex, getPlayersIndex, getNinetyPlusIndex } from "@/lib/social";
import { LOCALES, localePrefix } from "@/lib/i18n";

function seasonSlugFor(date: string): string {
  const d = new Date(date);
  // Season runs Aug(year) → May(year+1); a match before July counts toward
  // the season that started the previous August.
  const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const prefix = localePrefix(locale);
    const matches = getMatchesIndex(locale);
    const players = getPlayersIndex(locale);
    const ninetyPlus = getNinetyPlusIndex(locale);
    const seasons = new Set(matches.map((m) => seasonSlugFor(String(m.date))));

    entries.push(
      { url: `${SITE_URL}${prefix || "/"}`, lastModified: new Date() },
      { url: `${SITE_URL}${prefix}/about` },
      { url: `${SITE_URL}${prefix}/90-plus` },
      ...matches.map((m) => ({ url: `${SITE_URL}${prefix}/matches/${m.slug}`, lastModified: new Date(m.date) })),
      ...Array.from(seasons).map((s) => ({ url: `${SITE_URL}${prefix}/seasons/${s}` })),
      ...players.map((p) => ({ url: `${SITE_URL}${prefix}/players/${p.playerId}` })),
      ...ninetyPlus.map((n) => ({ url: `${SITE_URL}${prefix}/90-plus/${n.slug}`, lastModified: new Date(n.date) }))
    );
  }

  return entries;
}
