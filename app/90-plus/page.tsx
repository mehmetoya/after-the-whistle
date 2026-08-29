import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

type NinetyPlusEntry = { slug: string; date: string; relatedMatch?: string };

function getEntries(): NinetyPlusEntry[] {
  const file = path.join(process.cwd(), ".generated", "ninety-plus.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export default function NinetyPlusIndexPage() {
  const entries = getEntries();

  return (
    <main className="ninety-plus-index">
      <h1>90+</h1>
      <ul>
        {entries.map((e) => (
          <li key={e.slug}>
            <Link href={`/90-plus/${e.slug}`}>
              {new Date(e.date).toLocaleDateString("tr-TR")}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
