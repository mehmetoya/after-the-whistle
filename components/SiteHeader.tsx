import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__wordmark">
        After the Whistle
      </Link>
      <nav className="site-header__nav">
        <Link href="/seasons/2026-27">Sezonlar</Link>
        <Link href="/90-plus">90+</Link>
        <Link href="/about">Hakkında</Link>
      </nav>
    </header>
  );
}
