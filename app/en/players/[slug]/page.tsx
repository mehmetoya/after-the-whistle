import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, getPlayersIndex } from "@/lib/social";
import { t } from "@/lib/i18n";

export default function PlayerPageEn({ params }: { params: { slug: string } }) {
  const player = getPlayersIndex("en").find((p) => p.playerId === params.slug);
  if (!player) return notFound();
  const dict = t("en");

  return (
    <main className="player-page">
      <h1>{player.name}</h1>
      <p className="player-page__average">
        {dict.seasonAverage}: {player.average}
      </p>
      <ul className="player-page__ratings">
        {player.allRatings
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((r) => (
            <li key={r.matchSlug}>
              <Link href={`/en/matches/${r.matchSlug}`}>{r.matchSlug}</Link> — {r.rating}
            </li>
          ))}
      </ul>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const player = getPlayersIndex("en").find((p) => p.playerId === params.slug);
  if (!player) return {};
  const title = `${player.name} — After the Whistle`;
  const description = `All match ratings for ${player.name} — season average: ${player.average}.`;
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/en/players/${params.slug}`,
      languages: {
        tr: `${SITE_URL}/players/${params.slug}`,
        en: `${SITE_URL}/en/players/${params.slug}`,
      },
    },
    openGraph: { title, description },
  };
}
