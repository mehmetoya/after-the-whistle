import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import PlayerRatings from "@/components/PlayerRatings";
import { MatchFrontmatterSchema, type MatchFrontmatter } from "@/lib/schema";

const MATCHES_DIR = path.join(process.cwd(), "content", "matches");

export async function getMatchSource(slug: string) {
  const files = fs.readdirSync(MATCHES_DIR).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(MATCHES_DIR, file), "utf8");
    const { data, content } = matter(raw);
    if (data.slug === slug) {
      const frontmatter = MatchFrontmatterSchema.parse(data);
      return { frontmatter, content };
    }
  }
  return null;
}

/**
 * Renders a match's MDX body. `PlayerRatings` is overridden here so that
 * `motm` is always injected from frontmatter — MDX authors never repeat it
 * in the body (single source of truth, see spec Bölüm 3.1 / 3.3).
 */
export async function renderMatchMdx(content: string, frontmatter: MatchFrontmatter) {
  const { default: Content } = await evaluate(content, {
    ...runtime,
    Fragment: runtime.Fragment,
    useMDXComponents: () => ({
      PlayerRatings: (props: React.ComponentProps<typeof PlayerRatings>) => (
        <PlayerRatings {...props} motm={frontmatter.motm} />
      ),
    }),
  } as never);

  return <Content />;
}
