import MatchCard from "@/components/MatchCard";
import { getMatchesIndex } from "@/lib/social";
import { t } from "@/lib/i18n";

export default function HomePage() {
  const matches = getMatchesIndex("tr"); // already sorted newest-first by compile-content.ts
  const [latest, ...previous] = matches;
  const dict = t("tr");

  return (
    <main className="home">
      <p className="eyebrow home__tagline">{dict.tagline}</p>

      {latest && (
        <section className="home__latest">
          <MatchCard match={latest} locale="tr" size="large" />
        </section>
      )}

      {previous.length > 0 && (
        <section className="home__previous">
          <h2>{dict.previousMatches}</h2>
          <div className="home__previous-grid">
            {previous.map((m) => (
              <MatchCard key={m.slug} match={m} locale="tr" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
