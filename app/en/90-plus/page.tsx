import Link from "next/link";
import { getNinetyPlusIndex } from "@/lib/social";
import { t } from "@/lib/i18n";

export default function NinetyPlusIndexPageEn() {
  const entries = getNinetyPlusIndex("en");
  const dict = t("en");

  return (
    <main className="ninety-plus-index">
      <h1>{dict.ninetyPlusTitle}</h1>
      <ul>
        {entries.map((e) => (
          <li key={e.slug}>
            <Link href={`/en/90-plus/${e.slug}`}>{new Date(e.date).toLocaleDateString("en-GB")}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
