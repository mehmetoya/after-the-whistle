import Link from "next/link";
import { getNinetyPlusIndex } from "@/lib/social";
import { t } from "@/lib/i18n";

export default function NinetyPlusIndexPage() {
  const entries = getNinetyPlusIndex("tr");
  const dict = t("tr");

  return (
    <main className="ninety-plus-index">
      <h1>{dict.ninetyPlusTitle}</h1>
      <ul>
        {entries.map((e) => (
          <li key={e.slug}>
            <Link href={`/90-plus/${e.slug}`}>{new Date(e.date).toLocaleDateString("tr-TR")}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
