# After the Whistle — v1 Teknik & Business Spesifikasyonu

**Amaç:** Liverpool maç sonu notlarının yayınlandığı, Markdown/MDX tabanlı, Netlify üzerinde host edilen, sosyal paylaşım odaklı kişisel/editorial bir futbol blogu.

**Statüsü:** FROZEN — mimari tartışma tamamlandı, scaffold aşamasına geçildi. DB yok, login yok, comment yok. Bu doküman implementation contract'tır.

**İlk implementasyon sırası:** content schema + compiler → validation → generated indexes → MDX rendering → route'lar → PlayerRatings → social image endpoint → SEO/RSS → visual system → Netlify deploy. Bu sıra bilinçli: önce UI yapıp sonra content modelini oturtmak gereksiz refactor'a yol açar.

---

## 1. Kapsam (MVP Scope)

### Var
- Next.js + MDX içerik + Netlify deploy (OpenNext adapter)
- Ana sayfa, maç yazısı sayfası, sezon arşivi, oyuncu sayfaları, "90+" kısa not bölümü, hakkında sayfası
- Frontmatter tabanlı maç metadata + MDX içinde named export ile yapılandırılmış oyuncu notu verisi
- Build-time Zod validation
- Otomatik sosyal görsel üretimi (OG + Instagram feed + Instagram Story) tek template'ten, tek Netlify Function üzerinden
- RSS feed + sitemap
- Cover image / asset licensing policy

### Yok (bilinçli olarak v1 dışı)
- Veritabanı / kullanıcı girişi
- Yorum sistemi
- **Reaksiyon UI'ı dahil değil** — backend'e yazmayan, sadece görsel geri bildirim veren bir buton gerçek bir etkileşim izlenimi verip karşılığını vermez. Reaksiyon/MOTM voting tamamı v1.1'e ertelendi (bkz. Bölüm 11).
- CMS admin paneli (Decap CMS v1.2)
- Çok dilli içerik

---

## 2. Mimari Özet

```
                    Git Repository
                         │
               ┌─────────┴──────────┐
               │                    │
          Match MDX              90+ MDX
               │
               ▼
        Content compiler
        (named export'ları toplar)
               │
         Zod validation (build fail-fast)
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
 matches    ratings    players
  index      index      index      → .generated/*.json
     │
     └─────────┬─────────┘
               ▼
             Next.js
          App Router / SSG (OpenNext / Netlify)
               │
     ┌─────────┴──────────┐
     │                    │
     ▼                    ▼
 HTML pages       /api/social/[slug] Function
                          │
                       Satori (JSX → SVG)
                          │
                       resvg (SVG → PNG)
                          │
                 ┌────────┼────────┐
                OG      Feed     Story
             (1200×630)(1080×1350)(1080×1920)
```

**Neden bu yığın:**
- Next.js + MDX: içerik Git'te, veritabanı gerekmiyor, `posts/2026-09-04-ipswich.mdx` push edince Netlify otomatik deploy ediyor.
- `satori` + `@resvg/resvg-js`: Vercel'in `@vercel/og`'si Netlify'da native çalışmadığı için, aynı JSX-tabanlı yaklaşımı Netlify Functions içinde bağımsız olarak kurmak gerekiyor — normal Node Function olarak (Edge Function değil), çünkü `@resvg/resvg-js` native bir bağımlılık.
- **Content compiler + `.generated/*` ayrımı**: MDX dosyaları kaynak veri, `.generated/matches.json` / `ratings.json` / `players.json` / `ninety-plus.json` ise build sırasında üretilen sorgulanabilir "query model". Bu ayrım, oyuncu ve sezon istatistik sayfalarını MDX AST'ini tekrar parse etmeden, düz JSON üzerinden inşa etmeyi sağlar.

---

## 3. İçerik Şeması

### 3.1 Post Frontmatter

```yaml
---
title: "Arsenal 1–2 Liverpool: Sabır, Szoboszlai ve üç puan"
slug: arsenal-1-2-liverpool
date: 2026-08-30
opponent: Arsenal
competition: Premier League      # Premier League | Champions League | FA Cup | Carabao Cup
venue: Emirates Stadium
homeAway: Away                   # Home | Away
score:
  home: 1
  away: 2
result: W                        # W | D | L
motm: dominik-szoboszlai         # stable player slug — tek source of truth
tags:
  - Premier League
  - Away
  - Szoboszlai
coverImage: /images/matches/arsenal-1-2-liverpool.jpg   # opsiyonel — yoksa bkz. Bölüm 9, generated card hero olarak kullanılır
excerpt: "Deplasmanda sabırlı bir performans, Szoboszlai'nin iki asisti ve kritik üç puan."
social:
  notes:                          # sosyal kartta çıkacak metin — editoryal olarak elle yazılır, otomatik türetilmez
    - "İkinci yarıda orta saha kontrolü."
    - "Szoboszlai maçın kırılma noktasıydı."
    - "Üç puandan fazlasını anlatan bir deplasman."
draft: false
---
```

**Kural — skor:** `score` her zaman yapılandırılmış obje (`home`/`away`) olarak tutulur, ekranda `"1–2"` formatı render aşamasında üretilir.

**Kural — MOTM tek source of truth:** MOTM bilgisi **yalnızca** frontmatter'da `motm: <player-slug>` olarak tutulur. `PlayerRating` tipinde ayrı bir `motm` alanı **yoktur** — iki farklı yerde aynı bilginin tutulması (frontmatter + ratings listesi) zamanla drift eder. Component, `ratings` listesini ve `metadata.motm` slug'ını ayrı prop olarak alıp eşleştirmeyi render sırasında yapar.

**Kural — oyuncu kimliği:** Oyuncular display-name yerine stabil `playerId` (slug) ile referanslanır. "Van Dijk" / "Virgil van Dijk" gibi yazım farkları `/players/virgil-van-dijk` istatistiklerinin parçalanmasına yol açar.

### 3.2 MDX Gövdesi — Named Export Yaklaşımı

Oyuncu notları JSX prop'u içine gömülü bir expression olarak değil, **MDX'in named export'u** olarak tanımlanır:

```mdx
---
title: "Arsenal 1–2 Liverpool..."
...
---

export const playerRatings = [
  { playerId: "alisson", name: "Alisson", rating: 7 },
  { playerId: "virgil-van-dijk", name: "Virgil van Dijk", rating: 8 },
  { playerId: "dominik-szoboszlai", name: "Dominik Szoboszlai", rating: 9 }
]

## 90 dakikanın ardından
Maçla ilgili kişisel değerlendirme metni burada...

<PlayerRatings ratings={playerRatings} motm={metadata.motm} />

## İyi
...
```

**Neden JSX prop içine gömülü array değil:** `ratings={[{...}, {...}]}` şeklinde inline literal, bugün için AST'den çıkarılabilir ama biri `const ratings = [...]; <PlayerRatings ratings={ratings} />` yazdığı an extractor kırılır. Named export (`export const playerRatings = ...`) ise hem component'e prop olarak geçilebilir hem de build-time'da modül olarak import edilip `.generated/ratings.json` içine toplanabilir — aynı veri iki farklı tüketici (render + istatistik pipeline) için tek kaynaktan gelir.

### 3.3 `PlayerRating` Tipi

```ts
type PlayerRating = {
  playerId: string;   // stable slug — "virgil-van-dijk"
  name: string;        // display name — "Virgil van Dijk"
  rating: number;       // 1-10
};
// motm burada YOK — bkz. Bölüm 3.1, tek kaynak frontmatter.motm

type PlayerRatingsProps = {
  ratings: PlayerRating[];
  motm: string;   // frontmatter.motm — playerId eşleşmesiyle render sırasında işaretlenir
};
```

### 3.4 Build-Time Toplama

Ayrı bir `_data/<slug>.json` side-car üretmek yerine, build script tüm MDX modüllerinin named export'larını (`playerRatings`, frontmatter metadata) tek geçişte toplayıp merkezi index dosyalarına yazar:

```
.generated/
├── matches.json       # tüm maç frontmatter'ları, slug'a göre
├── ratings.json        # her maç için playerRatings, matchSlug referansıyla
├── players.json         # playerId → { name, allRatings: [{matchSlug, rating, date}], average }
└── ninety-plus.json      # tüm 90+ notları
```

Bu, oyuncu sayfalarını (`/players/[slug]`) ve sezon istatistik sayfasını (`/seasons/[season]/stats`, v1.1) doğrudan bu JSON'lardan inşa etmeyi sağlar; MDX'i tekrar parse etmeye gerek kalmaz.

**Kural — `.generated/` bir build artifact'tır, kaynak değil:**
- `.generated/` Git'e commit **edilmez** (`.gitignore`'a eklenir).
- `.generated/` yalnızca build sırasında üretilir, elle düzenlenmez.
- `package.json` içinde content compiler, `next build`'den önce zorunlu bir adım olarak zincirlenir, böylece lokal build ile Netlify build aynı pipeline'ı kullanır ve stale generated JSON riski kalmaz:

```json
{
  "scripts": {
    "content:build": "tsx lib/compile-content.ts",
    "build": "npm run content:build && next build"
  }
}
```

### 3.5 90+ Notu Şeması

```yaml
---
type: ninety-plus
date: 2026-09-04
relatedMatch: ipswich-town-0-1-liverpool   # slug referansı, opsiyonel
---
- Üç kısa gözlem
- Maçın anı
- Tek oyuncu yorumu
- Bir sonraki maça not
```

`90+` ayrı bir içerik tipi (`content/ninety-plus/*.mdx`) olarak tutulur, maç yazılarıyla aynı listede karışmaz ama arşiv ve RSS'te birlikte görünebilir (tip etiketiyle ayırt edilir).

---

## 4. Build-Time Validation (Zod)

Bu projede CMS yokken ve içerik doğrudan Markdown olarak yazıldığı için, **content validation MVP'nin bir parçasıdır**, sonradan eklenecek bir iyileştirme değil.

```ts
const MatchSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: z.coerce.date(),
  opponent: z.string(),
  competition: z.enum([
    "Premier League",
    "Champions League",
    "FA Cup",
    "Carabao Cup",
  ]),
  homeAway: z.enum(["Home", "Away"]),
  score: z.object({
    home: z.number().int().nonnegative(),
    away: z.number().int().nonnegative(),
  }),
  result: z.enum(["W", "D", "L"]),
  motm: z.string(),          // playerId
  draft: z.boolean().default(false),
});
```

**Build şu durumlarda fail etmeli:**
- `result` skorla tutarsız (örn. `result: W` ama Liverpool skoru rakipten düşük)
- `rating` 1-10 aralığı dışında (örn. `rating: 11`)
- `relatedMatch` (90+ notlarında) referans verdiği slug bulunamıyor
- Aynı `slug` iki kez kullanılmış
- `motm` alanındaki `playerId`, o maçın `playerRatings` listesinde yok
- `date` geçersiz veya parse edilemiyor
- `competition` enum dışında bir değer

Bu kurallar build script içinde (Next.js build'i tetikleyen bir pre-build adımı olarak) çalıştırılır; herhangi biri fail ederse Netlify deploy'u durur.

---

## 5. Route Yapısı

```
/
/matches/[slug]
/seasons/[season]
/players/[slug]
/90-plus
/90-plus/[slug]
/about
/rss.xml
/sitemap.xml
/api/social/[slug]?variant=og           (1200×630)
/api/social/[slug]?variant=instagram    (1080×1350)
/api/social/[slug]?variant=story        (1080×1920)
```

`/og/[slug]/instagram` gibi ayrı route'lar yerine **tek endpoint + `variant` enum parametresi** implementasyon açısından daha sade — tek fonksiyon, tek route handler, tek cache stratejisi.

Public-facing güzel URL isteniyorsa Netlify rewrite ile:

```
/social/{slug}/og.png        → /api/social/{slug}?variant=og
/social/{slug}/instagram.png → /api/social/{slug}?variant=instagram
/social/{slug}/story.png     → /api/social/{slug}?variant=story
```

`/seasons/[season]/stats` v1.1'e ertelendi (bkz. Bölüm 11).

---

## 6. Sosyal Görsel Üretim Pipeline'ı

### 6.1 Model: Runtime Function + CDN Cache (v1)

Build-time statik PNG üretimi + runtime fallback gibi iki ayrı deployment modelini v1'de aynı anda taşımıyoruz — bu gereksiz karmaşıklık. v1'de tek model:

```
GET /api/social/{slug}?variant=og&v={contentHash}
                    │
                    ▼
             Netlify Function
                    │
                    ▼
            Satori → SVG → resvg → PNG
                    │
                    ▼
             CDN cache (immutable)
```

**Content-hash tabanlı cache-busting:** URL'e sabit slug yerine `?v=<contentHash>` (post içeriğinden türetilen kısa hash) eklenir. Post güncellendiğinde hash değişir → yeni URL → eski CDN/X/WhatsApp cache'i sorun çıkarmaz. Sabit slug + `immutable` cache-control kombinasyonu, içerik değiştiğinde sosyal platformların eski önizlemeyi göstermeye devam etmesine yol açar.

```
Cache-Control: public, max-age=31536000, immutable
```

Build-time statik PNG üretimi (deploy anında tüm postlar için önceden render etme) bir **v1.1 performans optimizasyonu** olarak değerlendirilir, v1 gereksinimi değil.

### 6.2 Tek Template, Üç Boyut

```
renderMatchCard({ title, score, opponent, competition, motm, socialNotes, variant })
  → satori(jsxTemplate, { width, height, fonts })   // JSX → SVG
  → resvg(svg)                                       // SVG → PNG buffer
  → return PNG
```

`variant` parametresi tipografi ölçeğini ve layout kompozisyonunu değiştirir (Story dikey format, feed kartı kareye yakın, OG yatay) — veri kaynağı hepsinde aynıdır.

### 6.3 Kartta Görünecek Metin — Deterministic Data Contract

Kart metni **algoritmik olarak post gövdesinden türetilmez** (örn. "İyi" bölümünün ilk cümlesi gibi bir sezgisel çıkarım editorial bir sistemde istenmeyen sonuçlar üretebilir). Bunun yerine frontmatter'da açıkça tanımlanır:

```yaml
social:
  notes:
    - "İkinci yarıda orta saha kontrolü."
    - "Szoboszlai maçın kırılma noktasıydı."
    - "Üç puandan fazlasını anlatan bir deplasman."
```

**Fallback zinciri (deterministic):**
```
social.notes  →  (yoksa) excerpt  →  (yoksa) title
```

---

## 7. Sosyal Paylaşım Butonları

Post sayfası altında doğrudan paylaşım linkleri:
- X (intent URL, post başlığı + link)
- WhatsApp (`wa.me` share URL)
- Bluesky (share intent URL)
- Instagram: doğrudan paylaşım desteklenmediği için buton yerine "Instagram için görseli indir" linki → `/api/social/[slug]?variant=instagram` ve `?variant=story` endpoint'lerine yönlendirir.

v1'de bu bölümün altına **reaksiyon UI'ı eklenmez** (bkz. Bölüm 1 ve Bölüm 11).

---

## 8. SEO & Meta

- Her maç sayfası: dinamik `<title>`, `description` (excerpt), `og:image` (`/api/social/[slug]?variant=og`), `twitter:card = summary_large_image`
- Sezon arşiv sayfası ve oyuncu sayfaları için de kendi OG görselleri (basit metin-tabanlı varyant, maç kartı template'inin sadeleştirilmiş hali)
- `robots.txt` ve `sitemap.xml` Next.js build sürecinde otomatik üretilir
- Structured data: `Article` schema.org markup her maç postunda

---

## 9. Cover Image / Asset Licensing Policy

**Bu, spesifikasyondaki eksik bir business maddesiydi ve v1'e dahil edilmesi gerekir.** Premier League / Liverpool FC / ajans maç fotoğraflarını izinsiz blogda kullanmak otomatik olarak serbest değildir.

```
Cover Image Policy
──────────────────
Allowed:
  ✓ Kendi çektiğimiz fotoğraflar
  ✓ Kullanım lisansı bulunan görseller
  ✓ Creative Commons / uygun lisanslı materyal
  ✓ Kendi ürettiğimiz editorial artwork

Default (coverImage tanımlı değilse):
  ✓ After the Whistle generated match card (Bölüm 6'daki template) hero olarak kullanılır

Do not assume (izin varsayılmaz):
  ✗ Getty
  ✗ Reuters
  ✗ AP
  ✗ Liverpool FC resmi görselleri
  ✗ Premier League yayın görüntüleri (ekran görüntüsü dahil)
```

`coverImage` alanı boş bırakıldığında otomatik olarak üretilen editorial kart hero görseli olarak kullanılır — bu aynı zamanda marka tutarlılığı avantajı sağlar: kaynak fotoğraf bulunamayan yazılarda bile her postun görsel dili aynı kalır.

---

## 10. Deployment (Netlify)

```
Repo push
   │
   ▼
Netlify framework detection
   │
   ▼
OpenNext adapter (Next.js App Router / SSG / ISR / Route Handlers / image optimization — zero-config)
   │
   ▼
next build
```

Netlify, modern Next.js projelerini OpenNext adapter üzerinden zero-config destekler; adapter sürümünü manuel pinlememek önerilir (Netlify otomatik günceller).

### Sosyal Görsel Endpoint'i: Route Handler, Ayrı Netlify Function Değil

`/api/social/[slug]` **Next.js Route Handler** (`app/api/social/[slug]/route.ts`) olarak yazılır — elle `netlify/functions/api-social.ts` gibi ikinci bir function katmanı **oluşturulmaz**. Netlify'ın güncel Next.js entegrasyonu, App Router Route Handler'larını OpenNext adapter üzerinden otomatik olarak serverless function'a dönüştürüyor; aynı işi elle bir custom Function olarak da tanımlamak gereksiz bir ikinci deployment yüzeyi yaratır.

**Kural:** v1'de tek yaklaşım `app/api/social/[slug]/route.ts`. `@resvg/resvg-js` bundling'i OpenNext'in ürettiği function'da sorun çıkarırsa (native addon inline edilemezse), o zaman — ve yalnızca o zaman — explicit bir `netlify/functions/api-social.ts`'e geçilir. Bu bir fallback planıdır, v1 varsayılanı değil.

### Font ve Native Bağımlılık Bundling

Font dosyaları (satori için TTF/OTF/WOFF — WOFF2 satori tarafından çözümlenmiyor, kullanılmamalı) ve native bağımlılık (`@resvg/resvg-js`) `netlify.toml` üzerinden açıkça deklare edilir — OpenNext'in ürettiği function bunları otomatik bundle etmeye çalışsa da, native addon'lar için bu ayarlar güvenlik payı sağlar:

```toml
[functions]
  node_bundler = "esbuild"
  included_files = ["assets/fonts/**"]

[functions."api-social"]
  external_node_modules = ["@resvg/resvg-js"]
```

`@resvg/resvg-js` native bir bağımlılık olduğu için Edge Function değil, **normal Node runtime** üzerinde çalıştırılır. Satori font buffer'ını doğrudan kabul eder ve Node runtime üzerinde sorunsuz çalışır.

**Doğrulanmış gereksinim (build'i fiilen kırar, atlanamaz):** `@resvg/resvg-js`'in native `.node` binary'si webpack tarafından modül olarak parse edilemediği için, `next.config.mjs`'de bu paket açıkça dışlanmalıdır:

```js
experimental: {
  serverComponentsExternalPackages: ["@resvg/resvg-js"],
}
```

Bu olmadan `next build`, `app/api/social/[slug]/route.ts`'i derlerken "Module parse failed" hatasıyla durur — bu Netlify'a özgü değil, doğrudan Next.js/webpack davranışı, dolayısıyla platform bağımsız bir contract maddesidir.

### Preview Deploys

Her PR için otomatik preview URL — yazı taslaklarını yayına almadan önce görsel kontrol (özellikle sosyal kart render'ı) için kullanılır.

---

## 11. v1 / v1.1 / v1.2 Sınırı

**v1.0 (bu doküman):** İçerik pipeline'ı (named export + Zod validation), ana sayfa, maç detay sayfası, sezon arşivi, oyuncu sayfası, 90+, RSS + sitemap, SEO, sosyal görsel üretimi (runtime function + content-hash cache), sosyal paylaşım butonları, cover image / asset licensing policy, responsive dark editorial UI, Netlify (OpenNext) deployment.

**v1.1:**
- Supabase ile reaksiyon (👍/👎 sayaç) ve MOTM voting — gerçek backend'e yazan, sayaç gösteren versiyon
- `/seasons/[season]/stats` — `.generated/*` index'lerinden türetilen otomatik istatistik sayfası (ortalama oyuncu notu, MOTM sayacı, ev/deplasman averajı, sonuç bazlı not dağılımı)
- Build-time statik PNG ön-üretimi (performans optimizasyonu)

**v1.2:**
- Decap CMS — telefondan Markdown görmeden yazı girişi
- Fikstüre bağlı otomatik hatırlatma entegrasyonu (şu an manuel kuruluyor)
- Otomatik match draft oluşturma ve gelişmiş social publishing workflow

---

## 12. Klasör Yapısı (özet)

```
after-the-whistle/
├── content/
│   ├── matches/
│   │   └── 2026-09-04-ipswich-town-liverpool.mdx
│   └── ninety-plus/
├── .generated/                    # build-time üretilen index'ler (matches/ratings/players/ninety-plus.json)
├── components/
│   ├── PlayerRatings.tsx
│   └── MatchCard.tsx
├── lib/
│   ├── schema.ts                  # Zod şemaları
│   └── compile-content.ts         # named export toplama + .generated/* üretimi (content:build script'i)
├── assets/
│   └── fonts/
├── app/
│   ├── page.tsx
│   ├── matches/[slug]/page.tsx
│   ├── seasons/[season]/page.tsx
│   ├── players/[slug]/page.tsx
│   ├── 90-plus/page.tsx
│   ├── about/page.tsx
│   └── api/
│       └── social/[slug]/route.ts   # Route Handler — OpenNext otomatik function'a çevirir, ayrı netlify/functions YOK
├── .gitignore                      # .generated/ dahil
└── netlify.toml
```

**Not (fallback):** `@resvg/resvg-js` bundling'i Route Handler → OpenNext function dönüşümünde sorun çıkarırsa, `netlify/functions/api-social.ts` eklenir ve `app/api/social/[slug]/route.ts` bu function'a proxy eder. Bu v1 varsayılanı değildir.

---

*Bu doküman Claude/Cursor'a doğrudan verilip proje iskeletinin kurulması için implementation contract olarak kullanılabilir.*
