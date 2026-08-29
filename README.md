# After the Whistle — v1 scaffold

Bu, `after-the-whistle-v1-spec.md` dokümanındaki (FROZEN) implementation
contract'ın karşılığı olan kod iskeletidir.

## Phase 2 — Editorial UI / Design System (doğrulandı)

Brand identity → typography → color tokens → shell/header → homepage →
match article → PlayerRatings → archive/player/90+ → responsive →
social-card visual language sırasıyla uygulandı ve gerçek bir headless
tarayıcı (chrome-headless-shell + puppeteer-core) ile ekran görüntüsü
alınarak doğrulandı — sadece kod yazılmadı.

**Tasarım sistemi:** warm ink/paper palet (`#14120f` arka plan, `#f2ede2`
metin, `#c8102e` tek vurgu rengi — LFC kırmızısı, sadece sonuç damgası ve
MOTM işaretinde), Fraunces (display/başlık) + Inter (body/UI) font
eşleşmesi, ve tekrar eden bir imza öğesi: **stamp** — maç sonucu (W/D/L)
ve MOTM için kullanılan, döndürülmüş kesikli-çizgi damga motifi
(bir matchday programme'ındaki teamsheet damgasına gönderme).

**Bu doğrulama turunda bulunup düzeltilen 3 gerçek bug:**

1. **Türkçe `İ` (U+0130) glyph'i satori'de tofu kutusu olarak çıkıyordu.**
   Kök neden: `İ` karakteri Inter'in temel `latin` subset'inde yok, sadece
   `latin-ext`'te var — ama satori aynı font ailesi adı altında kayıtlı
   iki font arasında glyph-bazlı fallback YAPMIYOR (ilkini kullanıyor).
   Çözüm: `latin-ext` dosyasını ayrı bir aile adıyla (`InterExt`,
   `FrauncesExt`) kaydedip CSS tarzı bir `fontFamily: "Inter, InterExt"`
   stack'i kullanmak — izole test scriptiyle doğrulandı, sonra gerçek
   endpoint'te doğrulandı.
2. **`MatchCard` ve `MatchPage` hero görselleri kırpılıyordu.**
   Kök neden: `<img>` üzerine hem CSS `aspect-ratio` hem de literal HTML
   `width={1200} height={630}` attribute'ları veriyordum; tarayıcı,
   height attribute'unu sabit `height: 630px` olarak uyguluyor ve CSS
   `aspect-ratio`'yu (height `auto` olmadığı için) devre dışı bırakıyordu
   — sonuç, `object-fit: cover` yanlış oranla kırpıyordu. Puppeteer ile
   gerçek `getBoundingClientRect()`/computed style ölçümüyle teşhis edildi.
   Düzeltme: HTML `width`/`height` attribute'larını kaldırmak,
   `match-page__hero`'ya eksik olan `aspect-ratio` kuralını eklemek.
3. Yukarıdaki iki düzeltme sonrası `next build` tekrar yeşil, homepage/
   match sayfası/player sayfası headless tarayıcıda görsel olarak
   doğrulandı (masaüstü + 390px mobil viewport).

**İkinci review turunda düzeltilen 3 madde:**

1. **Font token'ları kendine referans veriyordu (blocker).**
   `--font-display: var(--font-display), "Fraunces", ...` — next/font/local
   zaten aynı `--font-display` adını üretiyor, bu yüzden token kendi
   kendine referans veriyordu. Çözüm: tüketici token'ları ayrıştırmak —
   `--font-display-family` / `--font-body-family`, yalnızca bunlar
   `var(--font-display)`/`var(--font-body)`'yi (next/font'un ürettiği ham
   değer) referans alıyor. Tüm `font-family:` kullanımları (12 yer) yeni
   token'lara taşındı. Puppeteer ile `getComputedStyle` üzerinden gerçek
   font-family zincirinin doğru çözüldüğü doğrulandı.
2. **JSON-LD/OG image URL'i çift domain riski taşıyordu.**
   `${SITE_URL}${heroSrc}` — `heroSrc` bir `coverImage` olduğunda ve o
   zaten mutlak bir CDN URL'i olduğunda `https://domain.comhttps://cdn...`
   üretirdi. `lib/social.ts`'e `absoluteUrl()` helper'ı eklendi (mutlak
   URL'i olduğu gibi bırakır, göreliyi `SITE_URL` ile birleştirir);
   `MatchPage`'in hem JSON-LD hem `generateMetadata`'sı artık bunu
   kullanıyor — bu ayrıca `generateMetadata`'nın `coverImage` varken bile
   her zaman generated OG görselini göstermesi gibi örtük bir tutarsızlığı
   da düzeltti.
3. **Stamp semantiği: kayıp (L) yeşildi, kazanma-kaybetme okumasında ters
   duruyordu.** `--pitch` (yeşil) artık yalnızca ileride başka editorial
   kullanımlar için ayrılmış durumda, `stamp--l` yeni bir `--steel`
   (`#5b6b78`, soğuk/soluk mavi-gri) token'ı kullanıyor — sıcak palette
   içinde bilinçli tek soğuk nota, D (paper-dim, nötr sıcak gri) ile
   karışmayacak şekilde ayırt edici.

## Phase 1 — Content/Backend/Platform (frozen, PASS)



- ✅ `npm install` — bağımlılıklar kuruluyor
- ✅ `npm run content:build` — MDX'ten named export okuma, Zod validation,
  `.generated/*.json` üretimi çalışıyor
- ✅ Validation gerçekten build'i kırıyor — kasıtlı bozuk bir `motm` ile
  test edildi, doğru hata mesajıyla fail etti
- ✅ `npm run build` (gerçek `next build`, production) — **yeşil**
- ✅ `next start` ile prod sunucu ayağa kalktı, `/api/social/[slug]` üç
  variant'ta da (`og` 1200×630, `instagram` 1080×1350, `story` 1080×1920)
  gerçek PNG döndürdü
- ✅ Content-hash contract fiilen çalışıyor: maç sayfasının `og:image`
  meta tag'indeki `?v=<hash>` ile `/api/social` endpoint'inin döndürdüğü
  `ETag` header'ı birebir aynı (`compile-content.ts` ve route handler aynı
  `computeContentHash()` fonksiyonunu kullanıyor — `lib/social.ts`)
- ✅ `robots.txt` ve `sitemap.xml` doğru üretiliyor — sitemap artık maçlar,
  sezonlar, oyuncular ve 90+ detay sayfalarının tümünü kapsıyor
- ✅ JSON-LD (`Article`) maç sayfasında render ediliyor
- ✅ Cover image / generated-hero fallback çalışıyor: `coverImage` yoksa
  `MatchCard` ve `MatchPage` otomatik üretilen OG kartını hero olarak
  kullanıyor

## Build sırasında bulunup düzeltilen gerçek sorunlar

- `@resvg/resvg-js`'in native `.node` binary'si webpack tarafından
  bundle edilemiyordu → `next.config.mjs`'e
  `experimental.serverComponentsExternalPackages: ["@resvg/resvg-js"]`
  eklendi. Bu olmadan `next build` "Module parse failed" ile duruyordu.
- Satori **WOFF2 çözümlemiyor** — `@fontsource/inter`'ın sunduğu WOFF2
  dosyaları yerine WOFF formatındaki `Inter-Regular.woff` /
  `Inter-Bold.woff` kullanıldı (ikisi de `assets/fonts/` altında,
  gerçek font dosyaları — placeholder değil).
- `NextResponse` constructor'ı Node `Buffer`'ı doğrudan kabul etmiyor
  (TS strict mode) → `new Uint8Array(png)` ile dönüştürüldü.

## Kurulum

```bash
npm install
npm run dev
```

`npm run dev` ve `npm run build`, `content:build` script'ini otomatik olarak
önce çalıştırır.

## İçerik eklemek

Yeni bir maç yazısı için `content/matches/` altına spesifikasyondaki
frontmatter şemasına uyan bir `.mdx` dosyası eklemek yeterli — bkz. örnek:
`content/matches/2026-08-30-arsenal-1-2-liverpool.mdx`.

`npm run content:build` şu durumlarda **build'i durdurur** (spec Bölüm 4):
- `result` skorla tutarsızsa
- `motm` playerId, o maçın `playerRatings`'inde yoksa
- aynı `slug` iki kez kullanılmışsa
- 90+ notundaki `relatedMatch` bilinmeyen bir maça işaret ediyorsa
- frontmatter şemaya uymuyorsa (enum, tarih, sayı aralığı vb.)

## Site URL

`NEXT_PUBLIC_SITE_URL` ortam değişkeni ile ayarlanır (`lib/social.ts`
içindeki tek kaynak). Ayarlanmazsa `https://afterthewhistle.example`
placeholder'ına düşer — Netlify'da deploy öncesi gerçek domain ile set
edilmeli.

## Bu ortamda doğrulanamayan tek madde

`netlify.toml`'daki `[functions."api-social"]` bloğunun, OpenNext'in
Route Handler'dan otomatik ürettiği function'ın gerçek adına birebir
bağlanıp bağlanmadığı bu sandbox'ta test edilemedi (Netlify deploy
gerektirir). `included_files` (global) daha güvenilir; scoped
`external_node_modules` ayarı ilk gerçek Netlify deploy'unda
doğrulanmalı. Doğrulanamazsa spec Bölüm 10'daki fallback (explicit
`netlify/functions/api-social.ts`) devreye girer.
