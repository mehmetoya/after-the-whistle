import localFont from "next/font/local";

// Fraunces: the display voice. A serif with real personality (soft, slightly
// wonky terminals) — deliberately not a neutral sports-site sans. Used only
// for headlines, scorelines, and the stamp badge, never for body copy or UI
// chrome. That restriction is what keeps it feeling editorial rather than
// decorative.
export const fraunces = localFont({
  src: [
    { path: "../assets/fonts/site/Fraunces-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/site/Fraunces-Black.woff2", weight: "900", style: "normal" },
    { path: "../assets/fonts/site/Fraunces-Italic.woff2", weight: "500", style: "italic" },
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
