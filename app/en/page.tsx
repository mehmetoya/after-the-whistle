import MatchCard from "@/components/MatchCard";
import { getMatchesIndex } from "@/lib/social";
import { t } from "@/lib/i18n";

export default function HomePageEn() {
  const matches = getMatchesIndex("en");
  const [latest, ...previous] = matches;
  const dict = t("en");

  return (
    <main className="home">
      <p className="eyebrow home__tagline">{dict.tagline}</p>

      {latest && (
        <section className="home__latest">
          <MatchCard match={latest} locale="en" size="large" />
        </section>
      )}

      {previous.length > 0 && (
        <section className="home__previous">
          <h2>{dict.previousMatches}</h2>
          <div className="home__previous-grid">
            {previous.map((m) => (
              <MatchCard key={m.slug} match={m} locale="en" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
