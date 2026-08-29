import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import matter from "gray-matter";
import { MatchFrontmatterSchema } from "@/lib/schema";
import { computeContentHash, SITE_URL } from "@/lib/social";

// This is a plain Next.js Route Handler (app/api/social/[slug]/route.ts) —
// NOT a hand-written netlify/functions/api-social.ts. Netlify's OpenNext
// adapter provisions this as a serverless function automatically. Only if
// @resvg/resvg-js bundling breaks under that path do we fall back to an
// explicit Netlify Function (see spec Bölüm 10).

// Brand tokens, kept in sync with styles/globals.css by hand (satori can't
// read CSS custom properties, so these are the same hex values restated).
const TOKENS = {
  ink: "#14120f",
  paper: "#f2ede2",
  paperDim: "#9c9482",
  liverRed: "#c8102e",
};

const SIZES = {
  og: { width: 1200, height: 630 },
  instagram: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;

type Variant = keyof typeof SIZES;

function isVariant(v: string | null): v is Variant {
  return v === "og" || v === "instagram" || v === "story";
}

function loadMatch(slug: string) {
  const dir = path.join(process.cwd(), "content", "matches");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data } = matter(raw);
    if (data.slug === slug) return MatchFrontmatterSchema.parse(data);
  }
  return null;
}

function cardText(frontmatter: ReturnType<typeof loadMatch> & object) {
  // Deterministic fallback chain — never algorithmically mined from body copy.
  // social.notes → excerpt → title (spec Bölüm 6.3).
  if (frontmatter.social?.notes?.length) return frontmatter.social.notes;
  if (frontmatter.excerpt) return [frontmatter.excerpt];
  return [frontmatter.title];
}

function template(frontmatter: NonNullable<ReturnType<typeof loadMatch>>, variant: Variant) {
  const notes = cardText(frontmatter);
  const scoreLabel = `${frontmatter.score.home}–${frontmatter.score.away}`;
  const isStory = variant === "story";
  const siteLabel = SITE_URL.replace(/^https?:\/\//, "");

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isStory ? 96 : 64,
        backgroundColor: TOKENS.ink,
        color: TOKENS.paper,
        fontFamily: "Inter, InterExt",
      },
      children: [
        // Eyebrow row — competition label + rotated result stamp, echoing
        // the same signature device used on the site itself.
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: 24 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: isStory ? 34 : 26,
                    color: TOKENS.paperDim,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    fontWeight: 700,
                  },
                  children: frontmatter.competition,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Fraunces, FrauncesExt",
                    fontWeight: 700,
                    fontSize: isStory ? 40 : 30,
                    color: TOKENS.liverRed,
                    border: `3px dashed ${TOKENS.liverRed}`,
                    borderRadius: 999,
                    padding: isStory ? "8px 22px" : "6px 18px",
                    transform: "rotate(-4deg)",
                  },
                  children: frontmatter.result,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 20 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "Fraunces, FrauncesExt",
                    fontSize: isStory ? 92 : 68,
                    fontWeight: 700,
                    lineHeight: 1.05,
                  },
                  children: `${frontmatter.opponent} ${scoreLabel}`,
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: isStory ? 34 : 26, color: TOKENS.paperDim, lineHeight: 1.4 },
                  children: notes.join("  ·  "),
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: isStory ? 28 : 20,
              color: TOKENS.paperDim,
              textTransform: "uppercase",
              letterSpacing: 3,
            },
            children: siteLabel,
          },
        },
      ],
    },
  };
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(req.url);
  const variantParam = searchParams.get("variant");
  const variant: Variant = isVariant(variantParam) ? variantParam : "og";

  const frontmatter = loadMatch(params.slug);
  if (!frontmatter) {
    return NextResponse.json({ error: "match not found" }, { status: 404 });
  }

  const { width, height } = SIZES[variant];

  // Loaded once per cold start in a real deployment; fonts live in
  // assets/fonts/ and are bundled via netlify.toml `included_files`.
  // WOFF (not WOFF2 — satori doesn't decompress WOFF2). Fraunces carries
  // the headline/stamp (matching the site's display face), Inter carries
  // everything else — the same two-role type system as styles/globals.css.
  const fontDir = path.join(process.cwd(), "assets", "fonts");
  const interRegular = path.join(fontDir, "Inter-Regular.woff");
  const interBold = path.join(fontDir, "Inter-Bold.woff");
  const frauncesBold = path.join(fontDir, "Fraunces-Bold.woff");
  // Latin-ext fallbacks — Turkish characters like İ, ğ live outside the base
  // Latin subset. Unlike a browser, Satori has no OS-level font fallback,
  // and (confirmed against this scaffold) registering two font buffers
  // under the *same* family name does NOT give per-glyph fallback — Satori
  // only uses the first. The fix is a CSS-style font-family stack: the ext
  // file gets its own family name ("InterExt"/"FrauncesExt") and the
  // template's fontFamily is set to "Inter, InterExt" etc., exactly like a
  // browser font stack.
  const interRegularExt = path.join(fontDir, "Inter-Regular-Ext.woff");
  const interBoldExt = path.join(fontDir, "Inter-Bold-Ext.woff");
  const frauncesBoldExt = path.join(fontDir, "Fraunces-Bold-Ext.woff");

  const required = [interRegular, interBold, frauncesBold, interRegularExt, interBoldExt, frauncesBoldExt];
  if (!required.every(fs.existsSync)) {
    return NextResponse.json(
      { error: "font assets missing under assets/fonts/ — see README for the full required set" },
      { status: 500 }
    );
  }

  const svg = await satori(template(frontmatter, variant) as never, {
    width,
    height,
    fonts: [
      { name: "Inter", data: fs.readFileSync(interRegular), weight: 400, style: "normal" },
      { name: "InterExt", data: fs.readFileSync(interRegularExt), weight: 400, style: "normal" },
      { name: "Inter", data: fs.readFileSync(interBold), weight: 700, style: "normal" },
      { name: "InterExt", data: fs.readFileSync(interBoldExt), weight: 700, style: "normal" },
      { name: "Fraunces", data: fs.readFileSync(frauncesBold), weight: 700, style: "normal" },
      { name: "FrauncesExt", data: fs.readFileSync(frauncesBoldExt), weight: 700, style: "normal" },
    ],
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();

  // Canonical hash, computed the same way as compile-content.ts writes into
  // .generated/matches.json's `contentHash`. If the caller's `?v=` doesn't
  // match (stale link to an edited post), we still serve the *current*
  // image under the *current* hash's ETag — callers should be requesting
  // the URL from matches.json / page metadata, which always carries the
  // fresh hash, so a mismatch here means the linking page is stale, not
  // this endpoint.
  const hash = computeContentHash(frontmatter);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: hash,
    },
  });
}
