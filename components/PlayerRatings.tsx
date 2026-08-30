import type { PlayerRating } from "@/lib/schema";
import StampBadge from "@/components/StampBadge";
import type { Locale } from "@/lib/i18n";

type Props = {
  ratings: PlayerRating[];
  /**
   * playerId of the match's motm (frontmatter.motm). Injected by the page
   * layer via a component override, e.g.:
   *
   *   <MDXContent components={{
   *     PlayerRatings: (props) => <PlayerRatings {...props} motm={frontmatter.motm} locale={locale} />
   *   }} />
   *
   * Never authored directly in the MDX body — frontmatter.motm is the only
   * source of truth for who the match's player of the match was.
   */
  motm?: string;
  locale: Locale;
};

export default function PlayerRatings({ ratings, motm, locale }: Props) {
  return (
    <ul className="player-ratings">
      {ratings.map((r) => (
        <li key={r.playerId} className={r.playerId === motm ? "player-ratings__item is-motm" : "player-ratings__item"}>
          <span className="player-ratings__name">
            {r.name}
            {r.playerId === motm && <StampBadge kind="motm" size="small" locale={locale} />}
          </span>
          <span className="player-ratings__score">{r.rating}</span>
        </li>
      ))}
    </ul>
  );
}
