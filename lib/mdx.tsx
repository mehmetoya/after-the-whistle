import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import PlayerRatings from "@/components/PlayerRatings";
import { MatchFrontmatterSchema, type MatchFrontmatter } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

function matchesDir(locale: Locale) {
  return path.join(process.cwd(), "content", "matches", locale);
}

export async function getMatchSource(slug: string, locale: Locale) {
  const dir = matchesDir(locale);
  if (!fs.existsSync(dir)) return null;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    if (data.slug === slug) {
      const frontmatter = MatchFrontmatterSchema.parse(data);
      // Draft posts are excluded from .generated/* (home, sitemap, RSS,
      // season archive) by compile-content.ts, but that alone doesn't stop
      // someone hitting the direct URL — enforce the same rule here so a
      // draft is genuinely unpublished, not just unlisted.
      if (frontmatter.draft) return null;
      return { frontmatter, content };
    }
  }
  return null;
}

/**
 * A post exists in a given locale only if a file with that slug exists
 * under content/matches/{locale}/ and isn't draft. Used to decide whether
 * the language-switch link in the header should point at the exact
 * translated counterpart of the current match page.
 */
export async function matchExistsInLocale(slug: string, locale: Locale): Promise<boolean> {
  return (await getMatchSource(slug, locale)) !== null;
}

/**
 * Renders a match's MDX body. `PlayerRatings` is overridden here so that
 * `motm` is always injected from frontmatter — MDX authors never repeat it
 * in the body (single source of truth, see spec Bölüm 3.1 / 3.3).
 */
export async function renderMatchMdx(content: string, frontmatter: MatchFrontmatter, locale: Locale) {
  const { default: Content } = await evaluate(content, {
    ...runtime,
    Fragment: runtime.Fragment,
    useMDXComponents: () => ({
      PlayerRatings: (props: React.ComponentProps<typeof PlayerRatings>) => (
        <PlayerRatings {...props} motm={frontmatter.motm} locale={locale} />
      ),
    }),
  } as never);

  return <Content />;
}
