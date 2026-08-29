import Link from "next/link";
import type { MatchIndexEntry } from "@/lib/social";
import { socialImageUrl } from "@/lib/social";
import StampBadge from "@/components/StampBadge";

type Props = {
  match: MatchIndexEntry;
  size?: "large" | "regular";
};

export default function MatchCard({ match, size = "regular" }: Props) {
  const scoreLabel = `${match.score.home}–${match.score.away}`;
  const dateLabel = new Date(match.date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Cover image / generated-hero contract (spec Bölüm 9): coverImage if
  // licensed and provided, otherwise the auto-generated match card.
  const thumbSrc = match.coverImage ?? socialImageUrl(match.slug, "og", match.contentHash);

  return (
    <Link href={`/matches/${match.slug}`} className={`match-card match-card--${size}`}>
      <img className="match-card__thumb" src={thumbSrc} alt={match.title} />
      <div className="match-card__meta">
        <span className="eyebrow">{match.competition}</span>
        <span className="eyebrow">{dateLabel}</span>
      </div>
      <h2 className="match-card__title">{match.title}</h2>
      <div className="match-card__score">
        <StampBadge kind="result" result={match.result} size="small" />
        <span>{scoreLabel}</span>
        <span className="match-card__opponent">{match.opponent}</span>
      </div>
      <p className="match-card__excerpt">{match.excerpt}</p>
    </Link>
  );
}
