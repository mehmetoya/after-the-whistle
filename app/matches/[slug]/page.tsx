import { notFound } from "next/navigation";
import { getMatchSource, renderMatchMdx } from "@/lib/mdx";
import ShareButtons from "@/components/ShareButtons";
import StampBadge from "@/components/StampBadge";
import { SITE_URL, computeContentHash, socialImageUrl, absoluteUrl } from "@/lib/social";

export default async function MatchPage({ params }: { params: { slug: string } }) {
  const source = await getMatchSource(params.slug);
  if (!source) return notFound();

  const { frontmatter, content } = source;
  const body = await renderMatchMdx(content, frontmatter);
  const hash = computeContentHash(frontmatter);

  // Cover image / generated-hero contract (spec Bölüm 9): if the post has no
  // licensed coverImage, the auto-generated match card becomes the hero —
  // never a scraped/unlicensed photo by default. coverImage may itself be
  // absolute (a CDN URL) or relative (a local asset) — absoluteUrl() handles
  // both without double-prefixing SITE_URL.
  const heroSrc = frontmatter.coverImage ?? socialImageUrl(frontmatter.slug, "og", hash);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    datePublished: new Date(frontmatter.date).toISOString(),
    description: frontmatter.excerpt,
    image: absoluteUrl(heroSrc),
    author: { "@type": "Person", name: "After the Whistle" },
    mainEntityOfPage: `${SITE_URL}/matches/${frontmatter.slug}`,
  };

  return (
    <article className="match-page">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <header className="match-page__header">
        <p className="eyebrow">
          {frontmatter.competition} · {frontmatter.venue} · {frontmatter.homeAway}
        </p>
        <h1>{frontmatter.title}</h1>
        <div className="match-page__score-row">
          <StampBadge kind="result" result={frontmatter.result} />
          <p className="match-page__score">
            {frontmatter.score.home}–{frontmatter.score.away}
          </p>
          <span className="eyebrow">{frontmatter.opponent}</span>
        </div>
      </header>

      <img className="match-page__hero" src={heroSrc} alt={frontmatter.title} />

      <div className="match-page__body">{body}</div>

      <ShareButtons slug={frontmatter.slug} title={frontmatter.title} contentHash={hash} />
    </article>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const source = await getMatchSource(params.slug);
  if (!source) return {};
  const { frontmatter } = source;
  const hash = computeContentHash(frontmatter);
  const heroSrc = frontmatter.coverImage ?? socialImageUrl(frontmatter.slug, "og", hash);
  const ogImage = absoluteUrl(heroSrc);

  return {
    title: frontmatter.title,
    description: frontmatter.excerpt,
    alternates: { canonical: `${SITE_URL}/matches/${frontmatter.slug}` },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      images: [ogImage],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
    },
  };
}
