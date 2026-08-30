import localFont from "next/font/local";

// Archivo: the display voice — bold geometric grotesk, the "modern sports
// media" register (The Athletic / ESPN direction) rather than the earlier
// fanzine-era serif. Used for headlines, scorelines, and the wordmark.
export const archivo = localFont({
  src: [
    { path: "../assets/fonts/site/Archivo-Bold.woff2", weight: "700", style: "normal" },
    { path: "../assets/fonts/site/Archivo-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// Inter: the utility voice. Body copy, nav, labels, data (ratings, dates).
export const inter = localFont({
  src: [
    { path: "../assets/fonts/site/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/site/Inter-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});
