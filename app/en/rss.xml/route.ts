import { NextResponse } from "next/server";
import { SITE_URL, getMatchesIndex } from "@/lib/social";
import { t } from "@/lib/i18n";

export async function GET() {
  const matches = getMatchesIndex("en");
  const dict = t("en");

  const items = matches
    .map(
      (m) => `
    <item>
      <title>${m.title}</title>
      <link>${SITE_URL}/en/matches/${m.slug}</link>
      <guid>${SITE_URL}/en/matches/${m.slug}</guid>
      <pubDate>${new Date(m.date).toUTCString()}</pubDate>
      <description><![CDATA[${m.excerpt}]]></description>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>After the Whistle</title>
    <link>${SITE_URL}/en</link>
    <description>${dict.tagline}</description>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
