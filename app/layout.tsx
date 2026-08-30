import "@/styles/globals.css";
import { fraunces, inter } from "@/lib/fonts";

export const metadata = {
  title: "After the Whistle",
  description: "Liverpool maç sonu notları",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
