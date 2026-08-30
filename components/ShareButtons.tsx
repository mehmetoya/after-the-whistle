import { SITE_URL, socialImageUrl } from "@/lib/social";
import { t, localePrefix, upperForLocale, type Locale } from "@/lib/i18n";

type Props = {
  slug: string;
  title: string;
  contentHash: string;
  locale: Locale;
};

export default function ShareButtons({ slug, title, contentHash, locale }: Props) {
  const dict = t(locale);
  const url = `${SITE_URL}${localePrefix(locale)}/matches/${slug}`;
  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  // Pre-uppercase with the button's own (correct) locale rather than
  // leaving it to CSS text-transform + the ambient <html lang> — which is
  // hardcoded "tr" at the root regardless of which locale route is being
  // rendered (see lib/i18n.ts's upperForLocale). Without this, English
  // labels containing "i" (e.g. "Instagram", "Download image") would come
  // out with a Turkish dotted İ on the /en pages.
  const label = (s: string) => upperForLocale(s, locale);

  return (
    <div className="share-buttons">
      <a
        className="share-buttons__link"
        href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label(dict.shareX)}
      </a>
      <a
        className="share-buttons__link"
        href={`https://wa.me/?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label(dict.shareWhatsApp)}
      </a>
      <a
        className="share-buttons__link"
        href={`https://bsky.app/intent/compose?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label(dict.shareBluesky)}
      </a>
      {/* Instagram doesn't support a direct share-URL intent — offer the
          generated asset for manual posting instead (see Bölüm 7). Hash
          keeps the download link pointed at the current version of the
          card, not a stale cached one. */}
      <a className="share-buttons__link" href={socialImageUrl(slug, "instagram", contentHash, locale)} download>
        {label(dict.shareInstagram)}
      </a>
      <a className="share-buttons__link" href={socialImageUrl(slug, "story", contentHash, locale)} download>
        {label(dict.shareInstagramStory)}
      </a>
    </div>
  );
}
