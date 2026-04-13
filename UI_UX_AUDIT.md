# UI/UX Audit & Improvement Plan — UltraMol Landing Page

**Date:** 2026-04-13
**File:** `/Users/boldyrevap/Sites/ultramol/landing/index.html`
**Page:** Single-page landing for UltraMol (B2B grinding equipment manufacturer)

---

## GLOBAL ISSUES (apply across all sections)

### G-1. Pure #000000 background causes OLED smear [CRITICAL]

**Current state (line 153):** `--black: #000000;` used as the main body background (line 207: `background: var(--black);`).
**Problem:** Pure black on OLED screens causes pixel smear during scrolling because pixels must fully turn on/off. Also used in `.trust-carousel::before/::after` gradients (lines 2044, 2050), mobile menu (line 1822), hero gradient (line 421).
**Fix:**
- Change `--black: #000000` to `--black: #020203` at line 153.
- Update `.nav-links` mobile background (line 1822) from `#000000` to `var(--black)`.
- Update hero gradient `rgba(0,0,0,...)` references (lines 420-424, 592, 777, 1186-1189) to `rgba(2,2,3,...)`.
- Update modal overlay (line 1938) from `rgba(0,0,0,0.85)` to `rgba(2,2,3,0.85)`.
**Priority:** CRITICAL

### G-2. Hover states on non-interactive elements [CRITICAL]

**Current state:** Multiple card types have `:hover` transitions but are NOT clickable:
- `.problem-card:hover` (line 695) — background change, not clickable
- `.spec-card:hover` (line 840) — background change, not clickable
- `.econ-card:hover` (lines 972, 989) — border change + animated top bar, not clickable
- `.step-card:hover` (line 1272) — background change, not clickable
- `.ingredients .tag:hover` (line 1237) — border/color change, not clickable
- `.case-card:hover img` (line 1174) — zoom effect, not clickable

**Problem:** Hover affordance implies clickability. Users (especially B2B industrial directors) will click these cards expecting an action, creating frustration and distrust.

**Fix:**
- REMOVE all hover transitions from non-interactive cards:
  - Delete `.problem-card:hover` rule at line 695.
  - Delete `.spec-card:hover` rule at line 840.
  - Delete `.econ-card:hover` and `.econ-card:hover::before` rules at lines 972, 989.
  - Delete `.step-card:hover` rule at line 1272.
  - Delete `.ingredients .tag:hover` rule at line 1237.
- KEEP hover on `.feature-item` (lines 887-890) because it IS interactive (accordion toggle via JS at line 3322).
- KEEP hover on `.case-card img` (line 1174) — subtle visual interest is acceptable IF you also add `cursor: default` to `.case-card` to signal no click action. Alternatively, remove it entirely.
- Remove `cursor: pointer` from `.feature-item` (line 884) — instead add it back only for the collapsed state. When `.feature-item.open`, the pointer is misleading since clicking will just close it. Actually, keeping `cursor: pointer` is fine since toggle behavior is expected. No change needed here.

**Priority:** CRITICAL

### G-3. No scroll progress indicator [HIGH]

**Current state:** No progress bar exists. The page is very long (~10 full viewport heights).
**Problem:** Users lose spatial awareness on long B2B pages. Industrial buyers want to know how much content remains.
**Fix:** Add a fixed progress bar at the very top of the viewport:
- Create a `div.scroll-progress` as the first child of `<body>`.
- CSS: `position: fixed; top: 0; left: 0; height: 3px; background: var(--orange); z-index: 200; width: 0%; transition: none;`
- JS: On scroll, calculate `(scrollY / (document.documentElement.scrollHeight - innerHeight)) * 100` and set `style.width`.
- The bar should sit above the nav (z-index 200 vs nav's 100).
**Priority:** HIGH

### G-4. No sticky CTA after hero scrolls away [HIGH]

**Current state:** The nav has `a.nav-cta` ("Ostavit zayavku") visible in the header, but it's a small button that may be overlooked.
**Problem:** After the hero scrolls out of view, the primary CTA (test grinding sign-up) has no persistent presence until the user scrolls all the way to the bottom form section.
**Fix:**
- When `window.scrollY > hero.offsetHeight`, add class `.nav-cta-prominent` to `.nav-cta`.
- `.nav-cta-prominent` CSS: `background: var(--orange); color: var(--black); border-color: var(--orange);` — making it filled orange instead of ghost outline.
- Add subtle entrance: `transition: background 0.3s, color 0.3s, border-color 0.3s;`
- This converts the existing outline CTA into a filled CTA once the hero passes, giving persistent orange call-to-action.
**Priority:** HIGH

### G-5. No phone number in header [HIGH]

**Current state (lines 2169-2189):** Nav contains logo, links, and CTA button. No phone number.
**Problem:** B2B industrial buyers (target: 40-60 year old production directors) expect a visible phone number in the header. It builds immediate trust and is the preferred contact method for this demographic.
**Fix:**
- Add a phone element inside `.nav-right` (line 2179), BEFORE the CTA button:
  ```html
  <a href="tel:+74712747072" class="nav-phone">+7 (4712) 74-70-72</a>
  ```
- CSS for `.nav-phone`: `font-family: var(--mono); font-size: 13px; font-weight: 600; color: var(--gray-300); text-decoration: none; letter-spacing: 0.02em;`
- `.nav-phone:hover`: `color: var(--orange);`
- Hide on mobile: `@media (max-width: 899px) { .nav-phone { display: none; } }` — mobile users can tap the phone in footer or the form.
**Priority:** HIGH

### G-6. Section transitions are abrupt [MEDIUM]

**Current state:** Sections transition with thin `border-top: 1px solid rgba(255,255,255,0.04)` (lines 671, 948, 1143, 1321) or nothing at all. No visual bridges between sections.
**Problem:** The page feels like a stack of disconnected blocks. Especially jarring between Problems (dark rich bg) and Product (pure black bg).
**Fix for each transition:**
- Between Problems and Product (lines 668-744): Add a gradient bridge. After `.problems`, insert a `div.section-bridge` with `height: 80px; background: linear-gradient(to bottom, var(--black-rich), var(--black));`
- Between Product and Economics: same pattern, `var(--black)` to `var(--black-rich)`.
- Between Comparison and Cases: same approach.
- Between Process and About: same approach.
- CSS: `.section-bridge { height: 80px; background: linear-gradient(to bottom, var(--from), var(--to)); }` — use CSS custom properties or inline styles for each.
- Alternative simpler approach: add `padding-top` gradient overlays using `::before` pseudo-elements on sections that follow a different-colored section.
**Priority:** MEDIUM

### G-7. Continuous carousel animation is distracting [HIGH]

**Current state (line 2057):** `.trust-track { animation: scroll-logos 40s linear infinite; }` — perpetual horizontal scrolling.
**Problem:** Continuous motion is distracting, reduces readability, and violates UX best practices for auto-playing carousels. The `prefers-reduced-motion` media query (line 2127) mitigates but not all users enable it.
**Fix — Option A (recommended for B2B):** Make the carousel static.
- Remove `animation: scroll-logos 40s linear infinite` from `.trust-track`.
- Instead, make `.trust-track` a flex-wrap grid: `display: flex; flex-wrap: wrap; justify-content: center; gap: 32px 48px;`
- Remove the JS duplication at line 3317-3319 (`trustTrack.innerHTML += trustTrack.innerHTML`).
- Remove `::before` and `::after` fade gradients (lines 2033-2051).
- Remove `overflow: hidden` from `.trust-carousel`.

**Fix — Option B (if motion is desired):** Only animate on hover.
- Change default to `animation-play-state: paused`.
- Add `.trust-carousel:hover .trust-track { animation-play-state: running; }` — reverse of current behavior.
- This way the carousel is static by default and only scrolls when the user deliberately engages.
**Priority:** HIGH

---

## SECTION-BY-SECTION AUDIT

---

### 1. NAVIGATION (lines 290-395, HTML 2169-2189)

**Current state:** Fixed nav with logo, 4 links (hidden on mobile), ghost-outline CTA, burger menu on mobile. Scrolled state adds blur backdrop.

**UI Issues:**
- `.nav-cta` (line 350) uses orange border/text which is correct for ghost state, but after scrolling past hero it should become a filled CTA (see G-4).
- Nav links spacing `gap: 32px` (line 327) is generous; on edge-case viewports (900-1000px) this may cause overflow before burger kicks in.
- Mobile padding `padding: 10px 0` (line 378) is tight; touch target for logo area is small.

**UX Issues:**
- No phone number (see G-5).
- No "current section" indicator on nav links during scroll. Users cannot tell which section they are viewing.

**Recommendations:**
1. Add phone number (G-5 above).
2. Add active section highlighting: In the scroll event handler (line 3334), calculate which section is in view and add `.active` class to corresponding nav link. CSS: `.nav-links a.active { color: var(--white-pure); }` with a 2px bottom border or underline.
3. Reduce nav link gap to `gap: 24px` at the 900px breakpoint to prevent potential overflow.
4. Mobile nav CTA: currently the CTA button competes with burger for space. Increase `.nav-right gap` from 16px to 20px on mobile.

**Priority:** HIGH (phone + active state), MEDIUM (spacing adjustments)

---

### 2. HERO SECTION (lines 397-627, HTML 2192-2235)

**Current state:** Full-viewport hero with darkened background image, headline, subtitle, two CTA buttons, 4-stat strip at bottom. Staggered fadeUp animations.

**UI Issues:**
- Hero headline (line 479): `font-size: clamp(32px, 4.5vw, 64px)` — max 64px is smaller than the `.display` class (80px). For a hero headline on an industrial landing, this should be larger.
  - **Fix:** Change to `font-size: clamp(36px, 6vw, 72px);` and add `letter-spacing: -1.5px` per the typography guidelines (Inter 800, -1.5px letter-spacing).
- Hero badge (lines 433-476) is `display: none` on mobile (line 474). This removes the "ХАССП-сертификация" trust signal on mobile entirely.
  - **Fix:** Show it on mobile but smaller: instead of `display: none`, use `font-size: 8px; padding: 6px 12px;`
- Hero stat numbers use `var(--mono)` (line 597) which is correct per guidelines (JetBrains Mono for all numeric data).
- Hero gradient uses `rgba(0,0,0,...)` (line 420) — needs OLED fix (see G-1).
- `.btn-primary` box-shadow on hover (line 538): `0 20px 60px rgba(239, 127, 26, 0.25)` — good subtle glow effect. Consider adding a base glow even without hover: `box-shadow: 0 0 30px rgba(239, 127, 26, 0.15)` for resting state to draw attention.

**UX Issues:**
- Hero badge is hidden on mobile — mobile B2B users lose the certification trust signal.
- Hero CTA text "Zapisat'sya na testovoe izmel'cheniye" is long (40+ chars). On mobile it fills the full button width which is fine, but test on 320px viewport.
- No secondary trust signal (e.g., "50+ zapushchennykh kompleksov") near the CTA — it only appears in the stat strip below, which may be below the fold on short viewports.

**Recommendations:**
1. Increase hero headline to `clamp(36px, 6vw, 72px)` with `letter-spacing: -1.5px` (line 479).
2. Show hero badge on mobile (remove line 473-476 `display: none`). Replace with smaller font and tighter padding.
3. Add subtle glow to `.btn-primary` resting state: `box-shadow: 0 4px 20px rgba(239, 127, 26, 0.2);`
4. Add micro-trust below CTA text (inside `.hero-actions` area): a small line like "Besplatno. Rezul'tat za 1-3 dnya." in `var(--gray-400)` 12px text.

**Priority:** HIGH (headline size, mobile badge), MEDIUM (glow, micro-trust)

---

### 3. PROBLEMS SECTION (lines 666-737, HTML 2237-2283)

**Current state:** 3-column grid of problem cards with large ghost numbers (01-03), titles, descriptions, and red cost callouts. Cards have hover background change.

**UI Issues:**
- `.problem-card:hover` (line 695) — REMOVE (see G-2). Cards are not clickable.
- `.problem-num` opacity `rgba(255,255,255,0.04)` (line 704) is extremely faint — nearly invisible on some monitors. Consider raising to `rgba(255,255,255,0.06)` for minimal visibility improvement.
- `.problem-cost` (lines 724-737) uses `var(--red)` effectively. Good use of left border accent.
- No top-level section divider/bridge from hero (see G-6).

**UX Issues:**
- Section ends abruptly before Product section. No visual transition or call-to-action bridging to the solution.
- Problem cards have no icons — purely text-based. Adding an icon to each would improve scannability for quick-reading executives.
- The "Znakomaya situatsiya?" label is conversational, which is good for engagement.

**Recommendations:**
1. Remove `.problem-card:hover` and `.problem-card { transition: background 0.4s; }` (lines 690, 695-697).
2. Add a brief bridge after the problems grid: a centered line like "Resheniye — melnichnyy kompleks MMU" with an arrow pointing down, styled as a teaser for the next section. Use `text-align: center; margin-top: 48px; font-size: 14px; color: var(--gray-400);`
3. Increase `.problem-num` opacity from 0.04 to 0.06.
4. Consider adding a simple SVG icon (24x24) above each `.problem-title` — e.g., a blocked import icon, a dice icon for lottery, a warning icon for worn equipment.

**Priority:** CRITICAL (remove hover), HIGH (section bridge), MEDIUM (icons, opacity)

---

### 4. PRODUCT SECTION (lines 739-941, HTML 2285-2519)

**Current state:** Large hero image with overlay label, two-column intro (heading + body text), 8-item spec grid, 6-item feature accordion grid.

**UI Issues:**
- `.spec-card:hover` (line 840) — REMOVE (see G-2). Not clickable.
- `.spec-value` uses `var(--mono)` (line 845) — correct per guidelines.
- `.feature-item` has `cursor: pointer` (line 884) and JS click handler (line 3322) — this is the ONE correct interactive card. Keep hover styles.
- `.feature-detail` font color `var(--gray-500)` (line 913) is quite dim. Change to `var(--gray-400)` for better readability of expanded content.
- Product hero image overlay label font-size 7px on mobile (line 791) is extremely small.
  - **Fix:** Increase to `font-size: 9px` minimum for legibility.

**UX Issues:**
- Feature items lack visual "click to expand" affordance beyond the pointer cursor. No chevron/arrow indicator.
  - **Fix:** Add a small chevron (>) or plus (+) icon to the right of each `.feature-item h3`, and rotate it on `.feature-item.open`. CSS: `.feature-item h3::after { content: '+'; float: right; transition: transform 0.3s; }` and `.feature-item.open h3::after { content: '-'; }` (or use a rotation on a chevron SVG).
- The spec grid mixes numeric values ("5-500", "500", "6") with text values ("AISI304", "PLK", "TR TS", "ot 2 mes", "1 chel."). Per typography guidelines, numbers should use JetBrains Mono but text abbreviations look odd in mono. This is an acceptable trade-off for visual consistency.

**Recommendations:**
1. Remove `.spec-card:hover` rule (lines 840-842).
2. Remove `.spec-card { transition: background 0.4s; }` from line 837.
3. Add expand/collapse indicator to `.feature-item`.
4. Change `.feature-detail` color from `var(--gray-500)` to `var(--gray-400)` (line 913).
5. Increase mobile overlay label from 7px to 9px (line 791).
6. Add subtle glow border on `.feature-item.open`: `box-shadow: 0 0 20px rgba(239, 127, 26, 0.08);` (line 925-928).

**Priority:** CRITICAL (remove spec hover), HIGH (expand indicator), MEDIUM (detail color, glow)

---

### 5. ECONOMICS SECTION (lines 943-1065, HTML 2521-2617)

**Current state:** 3-column grid of product economics cards with metrics (key-value pairs) and ROI callout. Orange accent top bar animates on hover.

**UI Issues:**
- `.econ-card:hover` (lines 972-991) — REMOVE. Cards are not clickable. The animated top-bar (`.econ-card::before` scaleX animation on hover) is particularly misleading — it looks like a loading indicator or progress bar that suggests something will happen.
- `.econ-metric-value` (line 1034) correctly uses `var(--mono)` for numbers.
- The inline `style` on the economics CTA area (line 2609) should be moved to CSS. Inline styles are harder to maintain.
- The federal program note (line 2614) uses inline styles and is easy to miss.

**UX Issues:**
- The CTA "Rasschitat' dlya vashego syr'ya" is a second primary CTA that goes to the same form. Good repetition, but consider differentiating the button text to reflect the economics context.
- Federal program note at line 2614 could be more prominent — it's a significant selling point (20% government subsidy) buried in small gray text.
  - **Fix:** Wrap it in a bordered callout: `padding: 16px 24px; border: 1px solid var(--orange-border); border-radius: 2px; background: var(--orange-surface);`

**Recommendations:**
1. Remove `.econ-card:hover` and `.econ-card:hover::before` rules (lines 972-991).
2. Remove `transition: all 0.4s var(--ease)` from `.econ-card` (line 969).
3. Remove `.econ-card::before` entirely (lines 976-987) or keep it as a static top accent bar with `transform: scaleX(1)` always.
4. Move inline styles (lines 2609, 2614) to proper CSS classes.
5. Elevate the federal program note into a styled callout box.

**Priority:** CRITICAL (remove hover), HIGH (federal program callout), LOW (inline styles)

---

### 6. COMPARISON TABLE (lines 1066-1137, HTML 2619-2815)

**Current state:** Full table on desktop, card-based layout on mobile (hidden/shown via CSS at 767px breakpoint). UltraMol column highlighted with orange background tint.

**UI Issues:**
- Table row hover (line 1130-1136): `tbody tr:hover td` changes background. Table rows ARE arguably interactive in the sense that hover helps track rows in a data table. This is acceptable — keep this hover.
- The table lacks horizontal scrolling wrapper on tablet (768-1024px range). On tight viewports the table may overflow or columns may compress.
  - **Fix:** Wrap `.comparison-table` in a `div.comparison-table-wrap` (it already exists at line 2631, class `comparison-table-wrap`). Add `overflow-x: auto; -webkit-overflow-scrolling: touch;` to it. Currently it's only hidden on mobile (line 1855-1857), not given overflow behavior.
- Mobile cards have good implementation (lines 1850-1926). Winner row styling is clear.

**UX Issues:**
- No summary row or verdict row at the bottom of the table. After scanning all parameters, the user should see a clear "winner" conclusion.
  - **Fix:** Add a `<tfoot>` row: "Итого: УльтраМол — лучший выбор по цене, срокам и сервису" spanning all columns with orange highlight.
- Check/cross marks (lines 2659-2688) use plain text characters. These render inconsistently across browsers/OS.
  - **Fix:** Replace with inline SVG icons for consistent rendering. Green checkmark SVG (16x16) and red X SVG (16x16).

**Recommendations:**
1. Add `overflow-x: auto; -webkit-overflow-scrolling: touch;` to `.comparison-table-wrap` for tablet safety.
2. Add summary/verdict footer row to the table.
3. Replace text check/cross with SVG icons.
4. The mobile card fallback is well-executed — no changes needed there.

**Priority:** MEDIUM (all items)

---

### 7. CASES / APPLICATIONS (lines 1138-1241, HTML 2817-2885)

**Current state:** 3-column grid of image cards with overlay text. Case tags in JetBrains Mono. Images have brightness/saturation filter and scale on hover.

**UI Issues:**
- `.case-card:hover img` (lines 1174-1177) — zoom + brightness change. Cards are not clickable links. See G-2. The zoom effect is a common image gallery pattern even for non-clickable items, so this is borderline acceptable. However, adding `cursor: default` to `.case-card` would clarify intent.
- Image filters `brightness(0.55) saturate(0.8)` (line 1171) make images very dark. On the dark background this makes the cards feel heavy.
  - **Fix:** Lighten slightly to `brightness(0.6) saturate(0.85)`.
- The tag cloud / ingredients section was removed (line 2883 comment). Good decision per the audit note.

**UX Issues:**
- Only 3 cases shown. For B2B trust, more applications would be better. Consider adding a "i drugiye 20+ produktov" line below.
- No CTA at the end of this section nudging users toward the form.

**Recommendations:**
1. Add `cursor: default` to `.case-card` to prevent click confusion.
2. Lighten image filter from `brightness(0.55)` to `brightness(0.6)`.
3. Add a brief list or note below the grid: "Takzhe: krahmaly, mukhi, sukhoye moloko, semena, orekhi i dr." in `var(--gray-400)` text.
4. Add a secondary CTA below: "Uznayte, podkhodit li vash produkt" linking to `#form`.

**Priority:** LOW (cursor), MEDIUM (image brightness, additional context)

---

### 8. PROCESS / STEPS (lines 1243-1314, HTML 2887-2946)

**Current state:** 5-column grid of step cards with numbered badges, titles, descriptions, and duration badges. Timeline-style layout.

**UI Issues:**
- `.step-card:hover` (line 1272) — REMOVE (see G-2). Steps are not clickable.
- 5-column grid on desktop (line 1260) is aggressive — narrow columns may cause text wrapping issues on 1280px containers.
  - **Fix:** Test at 1280px. If cards feel cramped, switch to `grid-template-columns: repeat(5, 1fr)` only at `min-width: 1100px`, and use `repeat(3, 1fr)` at 768-1099px with remaining 2 cards wrapping below.
- Step duration uses emoji "timemachine" (line 2906, 2915, etc.): `&#x23F1;` and `&#x221E;`. These render inconsistently.
  - **Fix:** Replace emojis with small SVG clock icons or simply use JetBrains Mono text.
- `.step-duration` correctly uses `var(--mono)` (line 1309).

**UX Issues:**
- The process section lacks a connecting visual line between steps. A horizontal line or arrow connecting the 5 steps would reinforce the sequential nature.
  - **Fix:** Add a thin orange line across the top of the grid using `::before` on `.steps-grid`: `content: ''; position: absolute; top: 50px; left: 5%; right: 5%; height: 1px; background: var(--orange); opacity: 0.3;` (requires `position: relative` on `.steps-grid`).
- No total timeline duration displayed. Users want to know the entire process takes ~3-4 months.
  - **Fix:** Add a summary line below the grid: "Obshchiy srok: ot 3 mesyatsev do zapuska" centered, in `var(--gray-400)`.

**Recommendations:**
1. Remove `.step-card:hover` rule (lines 1272-1274).
2. Remove `transition: background 0.4s` from `.step-card` (line 1269).
3. Add connecting line between steps.
4. Add total timeline summary.
5. Replace emoji with consistent icons.
6. Consider responsive breakpoint adjustment for 5-column layout.

**Priority:** CRITICAL (remove hover), HIGH (connecting line, timeline), LOW (emoji, responsive)

---

### 9. ABOUT SECTION (lines 1316-1411, HTML 2948-3008)

**Current state:** Two-column split — image with "14 let" badge on left, text with heading/body/facts grid on right. 4-item facts grid showing patents, Powtech, federal program, lifespan.

**UI Issues:**
- `.about-fact` cards (line 1394) have no hover effects — correct, they are not interactive.
- `.about-fact-val` uses `var(--mono)` (line 1401) — correct for numeric/metric data.
- About text body uses 15px font (line 1381). Should be 16px per typography guidelines (body text = 16px).
  - **Fix:** Change `.about-text p { font-size: 15px; }` to `font-size: 16px;` at line 1381.
- Image brightness filter `0.7` (line 1347) is acceptable but could be lighter for better visual impact.
  - **Fix:** `brightness(0.75)` for slightly more visible image.

**UX Issues:**
- No CTA in this section. After learning about the company, users should be nudged toward contact.
  - **Fix:** Add a text link after the facts grid: "Poznakomit'sya blizshe — zapishites' na visit na proizvodstvo" linking to `#form`.
- The "Razrabotchiki, a ne sborshchiki" heading is strong messaging. No change needed.
- About badge shows "14" (line 2961) — this should be verified to be current (company founded per footer: 2012-2026 = 14 years). Correct.

**Recommendations:**
1. Change body font-size from 15px to 16px (line 1381).
2. Add subtle CTA link at the bottom of the about text.
3. Lighten image brightness from 0.7 to 0.75.

**Priority:** LOW (font-size), MEDIUM (CTA link), LOW (brightness)

---

### 10. TRUST / CLIENTS CAROUSEL (lines 1638-1700 + 2024-2107, HTML 3010-3040)

**Current state:** Scrolling carousel with company logos (abbreviation icons + names + descriptions). JS duplicates items for infinite loop. Fade edges with gradients. 40s linear infinite animation.

**UI Issues:**
- Continuous animation (see G-7) — needs to be static or hover-activated.
- `.trust-item` base opacity 0.45 (line 2075) is low. Logos are barely visible.
  - **Fix:** Increase to `opacity: 0.55` for better default visibility.
- Hover opacity increase to 0.85 (line 2080) — if carousel becomes static, remove hover state entirely or keep subtle opacity increase.
- `.trust-item-icon` are text-based abbreviations, not real logos. This is a limitation but acceptable for now.

**UX Issues:**
- The carousel section heading says "50+ proizvodstv" but only shows ~16 logos (8 unique, duplicated for scroll). The discrepancy may raise trust questions.
  - **Fix:** Add a note below: "Pokazany nekotoryye iz nashikh klientov" in small gray text.
- No industry categorization. Mixing food companies (Amarant Fuds, Biokol) with rubber/chemical companies (SIBUR, BRT, ROSSVIK) may confuse visitors coming for food equipment.
  - **Fix:** Consider filtering to only food-industry clients on this landing page, or group by industry.

**Recommendations:**
1. Apply G-7 fix — make carousel static.
2. Increase base opacity from 0.45 to 0.55.
3. Add disclaimer about partial client list.
4. Consider filtering clients to food industry only (since landing page targets food ingredient manufacturers).

**Priority:** HIGH (static carousel — G-7), MEDIUM (opacity, disclaimer), LOW (filtering)

---

### 11. CTA + FORM SECTION (lines 1413-1577, HTML 3042-3167)

**Current state:** Two-column layout — left side has heading, subheading, 4 checkmark benefits; right side has form card with 5 fields (name, company, phone, email, material) and submit button.

**UI Issues:**
- Form submit button (line 1551) is orange-filled — correct, it's a CTA.
- Form inputs border on focus changes to `var(--orange)` (line 1543) — good visual feedback.
- `.form-card` padding 48px 40px (line 1489) — generous and professional.
- Privacy link uses `onclick` inline handler (line 3141) — functional but not ideal. Move to event listener.
- Orange glow `::before` on `.cta-section` (line 1422) adds depth — good.

**UX Issues:**
- **Form feedback is inadequate (lines 3397-3409):** Current handler just changes button text to "Otpravleno!" for 3 seconds, then resets form. Problems:
  - No loading state while "submitting" (currently no real submission, but should be planned for).
  - Success state disappears after 3 seconds — user may not see it.
  - No error handling.
  - Form fields are cleared, but if there was an error, data is lost.
  - **Fix — proper success state:**
    1. On submit, disable button and show "Otpravlyayem..." state.
    2. On success, replace the entire form with a success message panel: "Zayavka otpravlena! My svyazhemsya s vami v techenii rabochego dnya." with a green check icon.
    3. Add a "Otpravit' yeshchyo odnu" link to reset back to form.
    4. Success panel should persist (not auto-dismiss).
    5. CSS for success state: Create `.form-success` class with `text-align: center; padding: 48px;` containing a green check circle, heading, and description.

- Email field is optional (no `required`) — this is intentional and good for low-friction.
- No phone mask/formatting. Russian phone input would benefit from a mask like `+7 (___) ___-__-__`.
  - **Fix:** Add a simple input mask or at minimum a `pattern` attribute: `pattern="\+?[0-9\s\-\(\)]+"` and `inputmode="tel"`.

**Recommendations:**
1. Implement proper form success state (HIGH priority — see above).
2. Add phone input mask or pattern validation.
3. Move inline `onclick` on privacy link to JS event listener.
4. Add `inputmode="tel"` to phone field (already has `type="tel"`, which should trigger numeric keyboard).
5. Consider adding a "Whatsapp" or "Telegram" field as alternative contact for younger decision-makers.

**Priority:** CRITICAL (form success state), MEDIUM (phone validation), LOW (WhatsApp field)

---

### 12. FOOTER (lines 1579-1636, HTML 3169-3297)

**Current state:** 4-column grid — logo/description, contacts (phone in orange, email, website), address with hours, legal details (INN, OGRN). Bottom bar with copyright and privacy link.

**UI Issues:**
- Footer uses extensive inline styles (lines 3176-3294). Every footer element has inline CSS.
  - **Fix:** Create proper CSS classes: `.footer-section-title`, `.footer-contacts`, `.footer-address`, `.footer-legal`, `.footer-bottom-bar`. Move all inline styles to these classes.
- Phone number in footer (line 3217) is styled with `font-size: 18px; font-weight: 700; color: var(--orange)` — good, prominent placement.
- Footer padding is 48px (line 1583) — could be increased to 64px for more breathing room.

**UX Issues:**
- No map or directions link. Industrial buyers visiting Kursk would benefit from a Yandex Maps link.
  - **Fix:** Add below address: `<a href="https://yandex.ru/maps/..." target="_blank">Pokazat' na karte</a>` styled in `var(--gray-400)`.
- No social media links. Even B2B companies benefit from VK or Telegram channel links.
- Working hours "Pn-Pt: 9:00-18:00" should be more prominent for B2B users planning calls.
- The privacy modal trigger uses inline `onclick` (line 3291) — same issue as in form section.

**Recommendations:**
1. Move all inline styles to CSS classes (significant cleanup task).
2. Add Yandex Maps link under address.
3. Increase footer padding from 48px to 64px.
4. Move onclick handlers to JS event listeners.

**Priority:** MEDIUM (inline styles cleanup), LOW (map link, padding, onclick)

---

## TYPOGRAPHY AUDIT

| Element | Current | Recommended | Line |
|---------|---------|-------------|------|
| Hero h1 | clamp(32px, 4.5vw, 64px), weight 800, spacing -0.02em | clamp(36px, 6vw, 72px), weight 800, spacing -1.5px | 479 |
| Section .label | 11px, mono, 500, spacing 0.2em | 11px — correct, no change | 244 |
| Body text | 16px, 400, lh 1.7 | Correct per guidelines | 276 |
| About body | 15px | Change to 16px | 1381 |
| .display class | clamp(40px, 7vw, 80px), 800 | Not currently used in HTML — consider using for hero h1 | 252 |
| Stat numbers | JetBrains Mono — correct | No change | 597 |
| Spec values | JetBrains Mono — correct | No change | 845 |
| Econ metrics | JetBrains Mono — correct | No change | 1035 |

---

## COLOR AUDIT

| Token | Current | Issue | Recommendation |
|-------|---------|-------|----------------|
| --black | #000000 | OLED smear | Change to #020203 |
| --black-rich | #0a0a0a | Good | No change |
| --black-card | #111111 | Good | No change |
| --orange | #EF7F1A | Good — matches Construction/Architecture palette | No change |
| --orange-bright | #ff9a3c | Good for hover states | No change |
| CTA buttons | Orange-filled | ONLY orange-filled elements should be CTA buttons | Verify no other orange-filled elements exist (check: only .btn-primary and .form-submit are orange-filled — correct) |
| Secondary muted | Missing | Need a muted surface color for non-CTA surfaces | Add `--surface-muted: rgba(255,255,255,0.03)` for use on card backgrounds as an alternative to orange tinting |
| Text contrast | --gray-400 (#999) on --black-card (#111) | Ratio ~6.3:1 — below 7:1 target | Change --gray-400 to #a0a0a0 for 7:1+ ratio |

---

## ACCESSIBILITY NOTES

1. **Skip link** (line 2166): Present and functional. Good.
2. **Focus styles** (lines 1752-1764): Present with orange outline. Good.
3. **Reduced motion** (lines 2127-2140): Comprehensive. Disables all animations. Good.
4. **SR-only class** (lines 2112-2122): Present. Used on comparison table caption. Good.
5. **Aria labels**: Nav has `aria-label` (line 2170), burger has `aria-label` and `aria-expanded` (line 2181). Good.
6. **Form labels**: All form inputs have associated `<label>` elements with `for` attributes. Good.
7. **Missing**: Hero stats strip has no semantic structure. Consider wrapping in `<dl>` (definition list) for screen readers.
8. **Missing**: Feature accordion items lack `aria-expanded` attribute. Add `aria-expanded="false"` and toggle in JS handler.

---

## IMPLEMENTATION PRIORITY MATRIX

### CRITICAL (do first)
1. G-1: Fix pure #000000 OLED background
2. G-2: Remove hover states from all non-interactive cards
3. Section 11: Proper form success state
4. Section 4: Remove spec-card hover

### HIGH (do second)
5. G-3: Add scroll progress indicator
6. G-4: Sticky CTA (nav button fills on scroll)
7. G-5: Phone number in header
8. G-7: Static trust carousel
9. Section 2: Hero headline sizing
10. Section 8: Process connecting line + timeline

### MEDIUM (do third)
11. G-6: Section transition bridges
12. Section 1: Active nav link highlighting
13. Section 5: Federal program callout elevation
14. Section 6: Comparison table overflow-x
15. Section 12: Footer inline styles cleanup
16. Color audit: Increase --gray-400 for 7:1 contrast

### LOW (polish)
17. Section 7: Case card cursor fix
18. Section 9: About body font-size 15->16px
19. Section 12: Map link, footer padding
20. Accessibility: aria-expanded on feature accordions
