import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";

const DIR = path.join(process.cwd(), "content", "ninety-plus", "tr");

export default async function NinetyPlusPage({ params }: { params: { slug: string } }) {
  if (!fs.existsSync(DIR)) return notFound();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".mdx"));
  const match = files
    .map((f) => ({ file: f, raw: fs.readFileSync(path.join(DIR, f), "utf8") }))
    .map(({ file, raw }) => ({ file, ...matter(raw) }))
    .find((entry) => entry.data.slug === params.slug && !entry.data.draft);

  if (!match) return notFound();

  const { default: Content } = await evaluate(match.content, {
    ...runtime,
    Fragment: runtime.Fragment,
  } as never);

  const dict = t("tr");

  return (
    <article className="ninety-plus-page">
      <p className="ninety-plus-page__date">{new Date(match.data.date).toLocaleDateString("tr-TR")}</p>
      <Content />
      {match.data.relatedMatch && (
        <p>
          {dict.relatedMatch}: <Link href={`/matches/${match.data.relatedMatch}`}>{match.data.relatedMatch}</Link>
        </p>
      )}
    </article>
  );
}
