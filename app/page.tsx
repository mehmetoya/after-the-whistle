import fs from "node:fs";
import path from "node:path";
import MatchCard from "@/components/MatchCard";
import type { MatchIndexEntry } from "@/lib/social";

function getMatches(): MatchIndexEntry[] {
  const file = path.join(process.cwd(), ".generated", "matches.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export default function HomePage() {
  const matches = getMatches(); // already sorted newest-first by compile-content.ts
  const [latest, ...previous] = matches;

  return (
    <main className="home">
      <p className="eyebrow home__tagline">Liverpool maç sonu notları</p>

      {latest && (
        <section className="home__latest">
          <MatchCard match={latest} size="large" />
        </section>
      )}

      {previous.length > 0 && (
        <section className="home__previous">
          <h2>Önceki maçlar</h2>
          <div className="home__previous-grid">
            {previous.map((m) => (
              <MatchCard key={m.slug} match={m} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
