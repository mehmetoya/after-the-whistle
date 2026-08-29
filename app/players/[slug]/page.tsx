import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/social";

type PlayerIndexEntry = {
  playerId: string;
  name: string;
  average: number;
  allRatings: Array<{ matchSlug: string; rating: number; date: string }>;
};

function getPlayer(slug: string): PlayerIndexEntry | null {
  const file = path.join(process.cwd(), ".generated", "players.json");
  if (!fs.existsSync(file)) return null;
  const all: PlayerIndexEntry[] = JSON.parse(fs.readFileSync(file, "utf8"));
  return all.find((p) => p.playerId === slug) ?? null;
}

export default function PlayerPage({ params }: { params: { slug: string } }) {
  const player = getPlayer(params.slug);
  if (!player) return notFound();

  return (
    <main className="player-page">
      <h1>{player.name}</h1>
      <p className="player-page__average">Sezon ortalaması: {player.average}</p>
      <ul className="player-page__ratings">
        {player.allRatings
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((r) => (
            <li key={r.matchSlug}>
              <Link href={`/matches/${r.matchSlug}`}>{r.matchSlug}</Link> — {r.rating}
            </li>
          ))}
      </ul>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const player = getPlayer(params.slug);
  if (!player) return {};
  const title = `${player.name} — After the Whistle`;
  const description = `${player.name} için tüm maç notları ve ortalama: ${player.average}.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/players/${params.slug}` },
    openGraph: { title, description },
  };
}
