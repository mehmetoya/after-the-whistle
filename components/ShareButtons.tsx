import { SITE_URL, socialImageUrl } from "@/lib/social";

type Props = {
  slug: string;
  title: string;
  contentHash: string;
};

export default function ShareButtons({ slug, title, contentHash }: Props) {
  const url = `${SITE_URL}/matches/${slug}`;
  const text = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="share-buttons">
      <a
        className="share-buttons__link"
        href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X'te paylaş
      </a>
      <a
        className="share-buttons__link"
        href={`https://wa.me/?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp'ta paylaş
      </a>
      <a
        className="share-buttons__link"
        href={`https://bsky.app/intent/compose?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Bluesky'de paylaş
      </a>
      {/* Instagram doesn't support a direct share-URL intent — offer the
          generated asset for manual posting instead (see Bölüm 7). Hash
          keeps the download link pointed at the current version of the
          card, not a stale cached one. */}
      <a className="share-buttons__link" href={socialImageUrl(slug, "instagram", contentHash)} download>
        Instagram için görseli indir
      </a>
      <a className="share-buttons__link" href={socialImageUrl(slug, "story", contentHash)} download>
        Instagram Story için görseli indir
      </a>
    </div>
  );
}
