# After the Whistle — Deploy Acceptance Checklist

Kod tarafı FROZEN. Bundan sonrası production smoke test — bu checklist
gerçek Netlify deploy'undan sonra, sırayla kontrol edilir.

## 1. Build & function packaging
- [ ] Netlify build log'unda `next build` hatasız tamamlanıyor
- [ ] `app/api/social/[slug]/route.ts`, OpenNext tarafından ayrı bir
      serverless function olarak provision edilmiş (Netlify function
      listesinde görünüyor)
- [ ] `@resvg/resvg-js` runtime'da gerçekten yükleniyor — function cold
      start'ta native `.node` binary hatası (`ERR_DLOPEN_FAILED` benzeri)
      yok
- [ ] `assets/fonts/**` (6 dosya: Inter-Regular/Bold + Ext varyantları,
      Fraunces-Bold + Ext) function bundle'ının içinde — `included_files`
      gerçekten işe yaramış

## 2. Social image endpoint (üç variant, gerçek domain üzerinden)
- [ ] `GET /api/social/arsenal-1-2-liverpool?variant=og` → 200, PNG,
      1200×630
- [ ] `?variant=instagram` → 200, PNG, 1080×1350
- [ ] `?variant=story` → 200, PNG, 1080×1920
- [ ] Kart içindeki Türkçe karakterler (İ, ş, ğ) doğru render ediliyor —
      tofu kutusu yok
- [ ] `ETag` header'ı, sayfa metadata'sındaki `?v=<hash>` ile birebir
      aynı

## 3. Environment / URL doğruluğu
- [ ] `NEXT_PUBLIC_SITE_URL` Netlify environment variable'ı gerçek domain
      ile set edilmiş (placeholder `afterthewhistle.example` DEĞİL)
- [ ] `og:image` / `twitter:image` meta tag'leri gerçek domaine gidiyor
- [ ] `/sitemap.xml` ve `/robots.txt` production domain'i kullanıyor,
      `robots.txt`'teki `Sitemap:` satırı doğru URL'e işaret ediyor

## 4. Sosyal platform crawler önizlemeleri
- [ ] X (Twitter) Card Validator ile bir maç linkini test et — kart
      görseli + başlık doğru çıkıyor
- [ ] WhatsApp'a linki yapıştırıp önizlemeyi kontrol et
- [ ] Bir posta küçük bir değişiklik yapıp yeniden yayınla — OG URL'indeki
      hash değişiyor mu, yoksa platform eski (hash'siz/aynı) görseli mi
      gösteriyor kontrol et — content-hash cache-busting contract'ının asıl
      testi bu

## 5. Sayfa bütünlüğü
- [ ] Ana sayfa, maç sayfası, sezon arşivi, oyuncu sayfası, 90+ sayfaları
      production'da hatasız açılıyor
- [ ] JSON-LD (`Article`) maç sayfasında Google'ın Rich Results Test
      aracından geçiyor
- [ ] Mobilde (gerçek telefon veya DevTools) header stacking, hero
      aspect-ratio, PlayerRatings düzeni bozulmuyor

## 6. Fallback / hata senaryoları
- [ ] Var olmayan bir maç slug'ı için `/api/social/olmayan-slug` → 404
      (500 değil)
- [ ] `content:build` validation'ının prod build'i gerçekten durdurduğu
      bir örnekle bir kez daha teyit edilmiş olsun (bozuk bir `motm` ile
      deneyip sonra geri almak yeterli)

---

Bu liste tamamlandığında v1 gerçekten kapanmış olur — kod tarafında
FROZEN olan contract, production'da da doğrulanmış olur.
