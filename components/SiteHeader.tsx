"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t, localePrefix, upperForLocale, type Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

/**
 * The language-switch link is computed from the current pathname rather
 * than passed down page-by-page: since every route shape mirrors 1:1
 * across locales (same slugs, same season/player ids, just with/without
 * the /en prefix), a pathname string transform gives an exact translated
 * counterpart for any page — home, a specific match, a specific player —
 * without prop-drilling through every layout and page component.
 *
 * This does mean switching languages on an EN post whose TR counterpart
 * doesn't exist (or vice versa) lands on a 404 — acceptable for now since
 * every published post is expected to exist in both locales; revisit if
 * that stops being true.
 */
export default function SiteHeader({ locale }: Props) {
  const dict = t(locale);
  const prefix = localePrefix(locale);
  const pathname = usePathname() ?? "/";
  const otherLocale: Locale = locale === "tr" ? "en" : "tr";

  const switchHref =
    locale === "tr"
      ? `/en${pathname === "/" ? "" : pathname}`
      : pathname.replace(/^\/en/, "") || "/";

  const homeHref = prefix || "/";

  // Pre-uppercase with the TARGET language's own rules, not the ambient
  // page's — "English" must always read "ENGLISH" (plain I), "Türkçe" must
  // always read "TÜRKÇE" (dotted İ), regardless of which page it's shown
  // on. See lib/i18n.ts's upperForLocale for why this can't be left to
  // CSS text-transform + <html lang>.
  const switchLabel = upperForLocale(dict.langSwitchLabel, otherLocale);

  return (
    <header className="site-header">
      <Link href={homeHref} className="site-header__wordmark">
        After the Whistle
      </Link>
      <nav className="site-header__nav">
        <Link href={`${prefix}/seasons/2026-27`}>{dict.navSeasons}</Link>
        <Link href={`${prefix}/90-plus`}>{dict.navNinetyPlus}</Link>
        <Link href={`${prefix}/about`}>{dict.navAbout}</Link>
        <Link href={switchHref} className="site-header__lang">
          {switchLabel}
        </Link>
      </nav>
    </header>
  );
}
