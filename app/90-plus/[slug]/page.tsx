import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { notFound } from "next/navigation";
import Link from "next/link";

const DIR = path.join(process.cwd(), "content", "ninety-plus");

export default async function NinetyPlusPage({ params }: { params: { slug: string } }) {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".mdx"));
  const match = files
    .map((f) => ({ file: f, raw: fs.readFileSync(path.join(DIR, f), "utf8") }))
    .map(({ file, raw }) => ({ file, ...matter(raw) }))
    .find((entry) => entry.data.slug === params.slug);

  if (!match) return notFound();

  const { default: Content } = await evaluate(match.content, {
    ...runtime,
    Fragment: runtime.Fragment,
  } as never);

  return (
    <article className="ninety-plus-page">
      <p className="ninety-plus-page__date">{new Date(match.data.date).toLocaleDateString("tr-TR")}</p>
      <Content />
      {match.data.relatedMatch && (
        <p>
          İlgili maç: <Link href={`/matches/${match.data.relatedMatch}`}>{match.data.relatedMatch}</Link>
        </p>
      )}
    </article>
  );
}
