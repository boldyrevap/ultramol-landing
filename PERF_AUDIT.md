# UltraMol Landing — Performance & Quality Audit

Audit date: 2026-04-14
Files reviewed: `index.html` (1580 lines, ~78 KB), `styles.css` (2215 lines, ~57 KB), `app.js` (155 lines, ~6 KB), assets directory.

Total page weight on cold load (above-the-fold critical path): ~340 KB transferred (HTML + CSS + Inter 400/700 woff2 + hero.webp + JSON-LD). Full page weight if user scrolls: ~1.3 MB (driven by `pic-2.webp`).

---

## Severity legend

- **CRITICAL** — significant LCP/CLS/INP regression or breakage risk
- **HIGH** — meaningful (>100 ms or >50 KB) impact
- **MEDIUM** — noticeable but limited impact
- **LOW** — polish / hygiene

---

## 1. Render-blocking resources

### 1.1 CSS is fully render-blocking — HIGH
- **Where:** `index.html:84` — `<link rel="stylesheet" href="styles.css">`
- **Issue:** 57 KB CSS file is parsed before first paint. On a 4G connection (~50 ms RTT, ~1.6 Mbps effective), this adds ~250–400 ms to FCP. Inter font @font-face declarations sit at the top of the file (lines 4–62) and only become discoverable after CSS parses — so font requests start LATE.
- **Fix:**
  1. Inline critical above-the-fold CSS (~4–6 KB) into a `<style>` in `<head>`. Critical scope: `:root`, `*`, `html`, `body`, `.scroll-progress`, `.skip-link`, `.nav*`, `.hero*`, `.container`, `@font-face` for Inter 400/700/800, `.btn-primary`, `.btn-ghost`, `.label`.
  2. Load the rest async:
     ```html
     <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
     <noscript><link rel="stylesheet" href="styles.css"></noscript>
     ```
  3. Move all `@font-face` to inline `<style>` in `<head>` so the browser can begin font fetches in parallel with CSS download.
- **Impact:** -150 to -300 ms FCP/LCP on 4G.

### 1.2 No font preload — HIGH
- **Where:** `<head>` of `index.html`. Only `hero.webp` is preloaded (lines 56–62).
- **Issue:** Inter 400 + Inter 700/800 are needed for the H1 ("Измельчительное…") and hero subhead. They are discovered only after CSS parses, then again only when text needs rendering, leading to FOIT or late text paint.
- **Fix:** Preload only the weights used on the first viewport (regular + 800):
  ```html
  <link rel="preload" href="assets/fonts/inter-v20-cyrillic_latin-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/inter-v20-cyrillic_latin-800.woff2" as="font" type="font/woff2" crossorigin>
  ```
- **Impact:** -100 to -200 ms LCP (text-LCP if hero image is suppressed).

---

## 2. Font loading strategy

### 2.1 8 woff2 files (~241 KB) — too many — HIGH
- **Where:** `styles.css:4–62` declares 5 Inter weights + 3 JetBrains Mono weights.
- **Findings:**
  - All 5 Inter weights ARE used (`grep` confirms 400, 500, 600, 700, 800 in CSS).
  - JetBrains Mono is used heavily as `--mono` (26+ occurrences). Of the 3 weights (400/500/700), all three are referenced.
  - But: JetBrains Mono is decorative on labels/specs only — non-critical.
- **Fix recommendations:**
  1. **Drop Inter 600.** Used only in 7 rules. Visually nearly identical to 500/700 — promote to 700 or demote to 500. Saves 30 KB.
  2. **Drop JetBrains Mono 500.** Used in 4 places. Substitute 400. Saves 25 KB.
  3. Consider dropping JetBrains Mono entirely if SF Mono / system mono fallback is acceptable for labels — saves ~75 KB and 3 requests.
  4. **`font-display: swap` is correctly set** (good).
  5. **`unicode-range`** is missing — add it to the Inter @font-face for Cyrillic vs Latin if you ever ship a Latin-only subset.
- **Impact:** -50 to -100 KB transfer, -1 to -3 requests, faster text paint on slow networks.

### 2.2 No `crossorigin` and no preload — MEDIUM
See 1.2. Also: ensure preloaded fonts use `crossorigin` attribute (woff2 fonts are CORS-fetched).

---

## 3. Image optimization

### 3.1 `pic-2.webp` is 456 KB — CRITICAL
- **Where:** `index.html:980`, displayed at `width="1280" height="960"` inside `.about-image`.
- **Issue:** 456 KB for an "about" decorative image is wildly oversized. At rendered size (likely ~600–800 px wide on desktop, 100% width on mobile), this image only needs to be ~100–150 KB at q=75–80 webp.
- **Fix:**
  1. Re-encode at quality 72–78 webp, target ≤ 130 KB.
  2. Consider downscaling source to 1600×1200 max; 1280×960 rendered means 2x DPR caps at 2560 — but for an "about" image you can accept slight softness on retina.
  3. Add `srcset`:
     ```html
     <img src="assets/images/pic-2-800.webp"
          srcset="assets/images/pic-2-600.webp 600w, assets/images/pic-2-1000.webp 1000w, assets/images/pic-2-1600.webp 1600w"
          sizes="(max-width: 768px) 100vw, 50vw"
          width="1280" height="960" loading="lazy" decoding="async" alt="…">
     ```
  4. AVIF variants would shave another 25–40%.
- **Impact:** -300+ KB on transfer; not LCP but significant on data-capped connections.

### 3.2 `hero.webp` 168 KB at LCP — HIGH
- **Where:** `index.html:56–62` (preload only, no `<img>` — used as `background-image` via `.hero-bg`).
- **Issue:** Preloading a CSS background image is fine, BUT background images don't benefit from `srcset`. On mobile, the full 168 KB ships even though the image renders much smaller.
- **Fix:**
  1. Provide responsive variants with `image-set()` in CSS:
     ```css
     .hero-bg { background-image: image-set(
       url("assets/images/hero-800.webp") 1x,
       url("assets/images/hero-1600.webp") 2x
     ); }
     ```
  2. Re-encode at q=72; should drop to ~110 KB.
  3. Consider converting hero to a real `<img>` so `srcset/sizes` apply and you get explicit LCP signal. Add `fetchpriority="high"` on the img.
- **Impact:** -50 KB on mobile, more reliable LCP attribution.

### 3.3 `pic-1.webp` 156 KB — MEDIUM
- Same treatment as pic-2: add srcset, re-encode at q=75. Target ≤90 KB.

### 3.4 cases-*.webp 36–93 KB — LOW
- Acceptable. Could trim cases-protein.webp (93 KB) by re-encoding to ~55 KB at q=72. Add `decoding="async"` to all lazy images.

### 3.5 width/height attrs — GOOD
All `<img>` tags carry `width` + `height`, so CLS from images is well-controlled. Trust grid logos (lines 1050–1192) however have **NO** width/height attributes — risk of CLS as logos load.
- **Fix:** Add `width="120" height="40"` (or whatever the real rendered size is) to every `.trust-card-logo`.

### 3.6 Trust grid: 12 logo requests — MEDIUM
- 12 separate logo requests on a single section. Mix of SVG and PNG.
- **Fix options:**
  - Combine PNG logos into a single sprite + CSS background, OR
  - Inline small SVGs (<2 KB) directly into HTML, OR
  - Convert all PNG logos to SVG (preferred for crisp rendering at any size).
  - Add `loading="lazy"` (already present — good) + `decoding="async"`.

### 3.7 LCP image preload may be wrong target — MEDIUM
- If `hero.webp` is rendered as `background-image` on `.hero-bg`, the preload is correct but Chrome may not match it to the LCP candidate. Verify in Lighthouse "Largest Contentful Paint element" — it could be the H1 text instead, in which case the hero.webp preload is wasted bandwidth competing with critical CSS/fonts.

---

## 4. Unused/redundant CSS

### 4.1 Inline `<style>` block? No — CSS is external — GOOD
- File is external (line 84). Good.

### 4.2 Likely dead/over-specific selectors — MEDIUM
- 2215 lines for a single landing page is on the high side. Likely 20–30% can be removed.
- Recommended: run `npx purgecss --css styles.css --content index.html` or `unused-css` from Lighthouse Coverage tab to identify dead rules. Expected savings: 8–15 KB pre-gzip.
- **Specific suspects without grepping further:**
  - 60+ `font-weight` declarations — consolidate into utility classes (`.fw-500`, `.fw-700`, `.fw-800`) if the design only uses 3 weights in practice.
  - 26+ `font-family: var(--mono)` — could be a single class `.mono { font-family: var(--mono); }`.
- **Also:** the file starts with 6 leading spaces of indentation on every line (artifact of being lifted out of HTML). Strip leading whitespace + minify for production — saves another ~3–5 KB after gzip.

### 4.3 Two `@keyframes` only — GOOD
- `pulse` (line 369) and `fadeUp` (line 535). Reasonable.

---

## 5. JavaScript

### 5.1 Scroll handler runs three layout-thrashing reads on every scroll — HIGH
- **Where:** `app.js:57–76`
- **Issues:**
  1. `document.documentElement.scrollHeight` is read on **every scroll event** — forces layout. Should be cached and recomputed only on `resize` and `load`.
  2. `window.innerHeight` — same, cache it.
  3. `hero.offsetHeight` — same; this is fixed once the page settles.
  4. Each scroll event triggers a style write to `scrollProgress.style.width` — fine, but should be wrapped in `requestAnimationFrame` to avoid layout thrash on rapid scrolls.
- **Fix:**
  ```js
  let docHeight = 0, viewHeight = 0, heroHeight = 0, ticking = false;
  const measure = () => {
    docHeight = document.documentElement.scrollHeight;
    viewHeight = window.innerHeight;
    heroHeight = hero?.offsetHeight ?? 0;
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 60);
      scrollProgress.style.width = (y / (docHeight - viewHeight)) * 100 + '%';
      if (heroHeight) navCta.classList.toggle('nav-cta-prominent', y > heroHeight);
      ticking = false;
    });
  }, { passive: true });
  ```
- **Impact:** -1 to -3 ms per scroll event; matters for INP on long scrolls and on lower-end devices.

### 5.2 `setTimeout(1500)` reveal fallback re-queries getBoundingClientRect for every reveal — LOW
- `app.js:121–130`. Runs once, fine. But on a page with many `.reveal` elements (50+), this triggers many forced layouts. Consider running this only if `IntersectionObserver` callback hasn't fired by 1500 ms; track count.

### 5.3 Smooth scroll handler captures EVERY anchor — LOW
- `app.js:147–155`. Selector `a[href^="#"]` matches the burger nav links too — these are ALSO bound in line 89–96. The smooth-scroll handler runs after, but `e.preventDefault()` could fight with menu close. Currently works because menu close runs before scroll handler in DOM order, but fragile.

### 5.4 `handleSubmit` writes to inline `onclick` HTML — LOW + maintainability
- `app.js:142`. Inline `onclick` inside `innerHTML` is ugly and CSP-hostile. Use `addEventListener` after appending.

### 5.5 `onsubmit="handleSubmit(event)"` inline — LOW
- `index.html:1236`. Same CSP concern. Use `form.addEventListener('submit', …)` in `app.js`.

### 5.6 No CSP / no defer-strategy concerns — GOOD
- `<script src="app.js" defer></script>` is good.

---

## 6. HTML bloat

### 6.1 12 inline `style="…"` attributes — MEDIUM
- **Locations:** `index.html:326, 327, 632, 1454, 1467, 1480, 1489, 1499, 1506, 1513, 1526, 1530, 1536, 1549, 1556, 1574` (footer area concentrated).
- **Examples:** `style="margin-bottom:16px;"`, `style="color: var(--gray-300); text-decoration: none"`.
- **Fix:** Promote these to utility classes (`.mb-16`, `.text-gray-300`, `.text-center`, `.mt-48`). The footer block at 1454–1574 has many repeated inline styles — refactor footer into a more semantic structure with classes.
- **Impact:** -1 to -2 KB HTML, much better caching/diffing.

### 6.2 Trust grid: 12 nearly identical card blocks — MEDIUM
- `index.html:1048–1192` is 144 lines of repeated markup. Each card is identical except for image src, name, and city.
- **Fix:** If you have any build step (Eleventy, Astro, even a simple Node script), generate from JSON. If pure static, leave it but at least extract a `<template>` + tiny JS render — though that hurts SEO. Keep as-is if no build pipeline; just acknowledge the duplication.

### 6.3 Inline SVG logo (~95 lines, ~7 KB) — LOW
- `index.html:97–193` and again `1355–…` (logo repeated in footer).
- **Fix:** Extract the logo to `assets/logos/ultramol.svg` and use `<img src="…" alt="УльтраМол">` OR define an SVG `<symbol>` with `<use href="#logo">` to reuse without duplicating the path data.
- **Impact:** -7 KB on every page load; cacheable separately.

### 6.4 Inline JSON-LD — GOOD
- Acceptable as-is. Lines 65–83 are minor.

### 6.5 Favicon as inline SVG data URI — GOOD
- Saves a request. Good pattern.

---

## 7. Preload / prefetch opportunities

| Resource | Action | Reason |
|---|---|---|
| Inter 400 woff2 | `preload` | Used in body + nav from first paint |
| Inter 800 woff2 | `preload` | Used in H1 hero |
| Inter 700 woff2 | (skip preload) | Used below fold mostly |
| `pic-1.webp` | `prefetch` (low priority) | First image after hero |
| `app.js` | already deferred | OK |
| `hero.webp` | already preloaded | Verify it's actually LCP candidate |
| All other images | nothing | `loading="lazy"` is correct |

**Add `<link rel="preconnect">`** if you ever introduce a CDN or analytics domain. Currently no third parties = no preconnects needed.

---

## 8. Caching & deployment

When deploying (looks like GitHub Pages target based on `og:image`):

| Asset | Cache-Control | Notes |
|---|---|---|
| `*.woff2` | `public, max-age=31536000, immutable` | Filenames are versioned (`-v20`, `-v24`) — good |
| `*.webp` (images) | `public, max-age=31536000, immutable` | Add hash to filename in build (`hero.abc123.webp`) for true immutability |
| `styles.css` | `public, max-age=31536000, immutable` | Requires content hash in filename |
| `app.js` | `public, max-age=31536000, immutable` | Same |
| `index.html` | `public, max-age=300, must-revalidate` | Short TTL so updates propagate |

GitHub Pages doesn't support custom Cache-Control well. For real production, recommend Cloudflare Pages, Netlify, or Vercel; or front GitHub Pages with Cloudflare for caching headers.

**Also enable:**
- Brotli compression (saves ~20% over gzip on text assets).
- HTTP/2 or HTTP/3 (multiplexing matters for the 12 logo requests).
- Set `Content-Security-Policy` (currently no CSP — adding `default-src 'self'; script-src 'self' 'unsafe-inline'; …` would block injection but breaks the inline `onclick` in `app.js:142`).

---

## 9. Third-party requests

**None detected** — no Google Fonts, no analytics, no chat widgets, no maps, no tag managers. This is excellent for performance. Verify that production deployment doesn't add Yandex.Metrika / Google Analytics later without preconnect + async loading.

---

## 10. Core Web Vitals prediction

Assumptions: Moto G4 / 4G throttling, no service worker, cold cache, GitHub Pages or similar CDN.

| Metric | Predicted | Drivers |
|---|---|---|
| **LCP** | **2.0 – 2.8 s** | Hero text or hero.webp (168 KB). Render-blocking CSS adds 250–400 ms. Could drop to **1.4–1.8 s** with critical-CSS inlining + font preload. |
| **CLS** | **< 0.05 (good)** | Images have width/height. Risk: trust-grid logos missing dimensions (12 elements) — could push to 0.05–0.10 if logos load late. Also `nav.scrolled` toggling at scrollY > 60 may shift content if nav height changes — verify CSS doesn't change nav height on `.scrolled`. |
| **INP** | **80 – 180 ms** | Scroll handler does layout reads; feature accordion runs `querySelectorAll` on every click. Burger menu fine. Form submit is synchronous (no network) — fine. With fixes in §5.1, expect **< 100 ms**. |
| **FCP** | **1.2 – 1.8 s** | Same drivers as LCP. |
| **TBT** | **< 100 ms** | JS is tiny (6 KB). |

---

## SEO findings

- **Lang attribute:** `<html lang="ru">` — good.
- **Title + meta description:** present, well-written.
- **Canonical:** present.
- **Open Graph + Twitter Card:** present.
- **JSON-LD Organization schema:** present, but `logo` field points to `hero.webp` which is a photo, not a logo. Replace with an actual logo URL.
- **Heading hierarchy:** appears single-H1, multiple H2/H3 — verify no skipped levels.
- **Sitemap.xml + robots.txt:** not visible; ensure both exist at deploy.
- **OG image URL** points to `boldyrevap.github.io/ultramol-landing/...` but `canonical` is `www.ultramol.ru` — mismatch. Use the canonical domain in OG/Twitter image URLs.

## Accessibility findings

- **Skip link** present (`index.html:90`) — good.
- **`aria-label` on nav, burger** — good.
- **`aria-expanded` on burger** managed by JS — good.
- **`aria-hidden="true"` on decorative SVG icons** — good (lines 385, 413, 440…).
- **Color contrast:** orange `#EF7F1A` on black is ~4.6:1 — passes AA for large text. Body white `#f0f0f0` on `#020203` = ~19:1 — excellent. `--gray-500: #757575` on `--black` = ~4.4:1 — borderline AA at small sizes; verify body copy never uses gray-500.
- **Form labels:** spot-checked `<label for="name">` (line 1238) — good.
- **`<button class="burger">`** — has `aria-label`, good. Verify it has type="button" to prevent accidental form submit if ever placed in a form.
- **Privacy modal close on Escape:** keydown listener is added to `document` every page load even when modal isn't open — minor inefficiency, but it does check for the modal first. OK.
- **Focus styles:** not audited. Verify `:focus-visible` outlines exist on all interactive elements; black backgrounds tend to make default focus rings invisible.
- **Reduced motion:** no `@media (prefers-reduced-motion: reduce)` rules detected (would have appeared in keyframes search). Add:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    html { scroll-behavior: auto; }
    .reveal { opacity: 1 !important; transform: none !important; }
  }
  ```

---

## Priority action list (do these first)

1. **CRITICAL** — Re-encode `pic-2.webp` (456 KB → ≤130 KB) and add `srcset`. (§3.1)
2. **HIGH** — Inline critical CSS + async-load the rest. (§1.1)
3. **HIGH** — Preload Inter 400 + 800 woff2 with `crossorigin`. (§1.2)
4. **HIGH** — Drop Inter 600 + JetBrains Mono 500 (or Mono entirely). Saves 50–100 KB. (§2.1)
5. **HIGH** — Wrap scroll handler in rAF + cache layout reads. (§5.1)
6. **MEDIUM** — Add width/height to trust-grid logos; convert PNGs to SVG/sprite. (§3.5, §3.6)
7. **MEDIUM** — Re-encode `hero.webp` and `pic-1.webp` smaller; consider responsive `image-set()`. (§3.2, §3.3)
8. **MEDIUM** — Move 12 footer inline styles to utility classes. (§6.1)
9. **MEDIUM** — Run PurgeCSS / Coverage to delete dead rules; minify. (§4.2)
10. **LOW** — Add `prefers-reduced-motion` block. (Accessibility)
11. **LOW** — Fix JSON-LD `logo` URL + OG image domain mismatch. (SEO)

Estimated combined impact: LCP **-400 to -700 ms**, total transfer **-400 to -550 KB** on cold load, CLS marginal improvement, INP under 100 ms.
