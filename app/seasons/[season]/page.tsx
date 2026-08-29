import fs from "node:fs";
import path from "node:path";
import MatchCard from "@/components/MatchCard";
import type { MatchIndexEntry } from "@/lib/social";
import { SITE_URL } from "@/lib/social";

function getMatchesForSeason(season: string): MatchIndexEntry[] {
  const file = path.join(process.cwd(), ".generated", "matches.json");
  if (!fs.existsSync(file)) return [];
  const all: MatchIndexEntry[] = JSON.parse(fs.readFileSync(file, "utf8"));

  // season slug format: "2026-27" — a match's season starts in August of its
  // first year and runs to May of the second.
  const [startYear] = season.split("-");
  const seasonStart = new Date(`${startYear}-07-01`);
  const seasonEnd = new Date(`${Number(startYear) + 1}-07-01`);

  return all
    .filter((m) => {
      const d = new Date(m.date);
      return d >= seasonStart && d < seasonEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // chronological for archive view
}

export default function SeasonPage({ params }: { params: { season: string } }) {
  const matches = getMatchesForSeason(params.season);

  return (
    <main className="season-archive">
      <h1>{params.season} Sezonu</h1>
      <div className="season-archive__list">
        {matches.map((m) => (
          <MatchCard key={m.slug} match={m} />
        ))}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { season: string } }) {
  const title = `${params.season} Sezonu — After the Whistle`;
  const description = `Liverpool ${params.season} sezonu maç sonu notları, kronolojik arşiv.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/seasons/${params.season}` },
    openGraph: { title, description },
  };
}
