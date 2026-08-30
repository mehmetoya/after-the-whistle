export type Locale = "tr" | "en";
export const LOCALES: Locale[] = ["tr", "en"];
export const DEFAULT_LOCALE: Locale = "tr";

type Dictionary = {
  tagline: string;
  navSeasons: string;
  navNinetyPlus: string;
  navAbout: string;
  langSwitchLabel: string; // label for the link to the OTHER locale
  previousMatches: string;
  seasonAverage: string;
  ninetyPlusTitle: string;
  relatedMatch: string;
  shareX: string;
  shareWhatsApp: string;
  shareBluesky: string;
  shareInstagram: string;
  shareInstagramStory: string;
  resultLabel: Record<"W" | "D" | "L", string>;
  seasonHeading: (season: string) => string;
};

const dictionaries: Record<Locale, Dictionary> = {
  tr: {
    tagline: "Liverpool maç sonu notları",
    navSeasons: "Sezonlar",
    navNinetyPlus: "90+",
    navAbout: "Hakkında",
    langSwitchLabel: "English",
    previousMatches: "Önceki maçlar",
    seasonAverage: "Sezon ortalaması",
    ninetyPlusTitle: "90+",
    relatedMatch: "İlgili maç",
    shareX: "X'te paylaş",
    shareWhatsApp: "WhatsApp'ta paylaş",
    shareBluesky: "Bluesky'de paylaş",
    shareInstagram: "Instagram için görseli indir",
    shareInstagramStory: "Instagram Story için görseli indir",
    resultLabel: { W: "GALİBİYET", D: "BERABERLİK", L: "MAĞLUBİYET" },
    seasonHeading: (season) => `${season} Sezonu`,
  },
  en: {
    tagline: "Liverpool match-day notes",
    navSeasons: "Seasons",
    navNinetyPlus: "90+",
    navAbout: "About",
    langSwitchLabel: "Türkçe",
    previousMatches: "Previous matches",
    seasonAverage: "Season average",
    ninetyPlusTitle: "90+",
    relatedMatch: "Related match",
    shareX: "Share on X",
    shareWhatsApp: "Share on WhatsApp",
    shareBluesky: "Share on Bluesky",
    shareInstagram: "Download image for Instagram",
    shareInstagramStory: "Download image for Instagram Story",
    resultLabel: { W: "WIN", D: "DRAW", L: "LOSS" },
    seasonHeading: (season) => `${season} Season`,
  },
};

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** URL prefix for a locale's routes — "" for the default (tr), "/en" otherwise. */
export function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

export const HOME_AWAY_LABEL: Record<Locale, { Home: string; Away: string }> = {
  tr: { Home: "Ev Sahibi", Away: "Deplasman" },
  en: { Home: "Home", Away: "Away" },
};

/**
 * Uppercases text with an explicit locale rather than relying on the
 * browser's ambient one. This matters because CSS `text-transform:
 * uppercase` on a page with `lang="tr"` applies Turkish dotting rules to
 * EVERYTHING under it — including English proper nouns like "Anfield" or
 * "Premier League", which then wrongly come out as "ANFİELD" / "PREMİER
 * LEAGUE" with a dotted İ. Proper nouns (competition, venue names, the
 * language-switch label) should always uppercase as plain Latin regardless
 * of the page's language; only genuinely-Turkish words (like the
 * translated "Ev Sahibi") should get Turkish dotting.
 */
export function upperLatin(s: string): string {
  return s.toLocaleUpperCase("en-US");
}

export function upperForLocale(s: string, locale: Locale): string {
  return s.toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US");
}
