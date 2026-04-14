# Security, Privacy & SEO Audit — UltraMol Landing Page

**Audited files:** `index.html`, `app.js`, `styles.css`
**Date:** 2026-04-14
**Context:** Static GitHub Pages site. No backend. Contact form is client-side only. Yandex Metrica planned.

---

## Summary

| Area | Finding count | Highest severity |
|------|--------------|-----------------|
| Form security | 4 | HIGH |
| Privacy / 152-FZ | 3 | HIGH |
| Content Security Policy | 1 | HIGH |
| SEO | 6 | MEDIUM |
| Accessibility / modal | 2 | MEDIUM |
| External resources | 1 | LOW |
| Subresource Integrity | 0 | — |

No CRITICAL issues found. No hardcoded secrets, no SQL, no dangerous eval/exec patterns.

---

## 1. Form Security

### 1.1 innerHTML in success state — LOW (not HIGH in this context)

**Location:** `app.js` lines 141–143

```js
success.innerHTML =
  "<div class=\"form-success-icon\">✓</div><h3>Заявка отправлена</h3>..." +
  "...onclick=\"this.parentElement.remove();document.getElementById('contact-form')...\"";
```

**Assessment:** The `innerHTML` string is a hardcoded literal — it contains no user-supplied data. No user input is interpolated into it at any point. This is **not an XSS vector in its current form**. The risk would arise only if a future developer refactors this to include form field values in the success message (e.g., "Спасибо, {name}!"). Flag it for that future risk.

**Fix (LOW, preventive):** Replace with DOM API construction to make the pattern safe by default and prevent accidental future XSS:

```js
const success = document.createElement('div');
success.className = 'form-success';

const icon = document.createElement('div');
icon.className = 'form-success-icon';
icon.textContent = '✓';

const heading = document.createElement('h3');
heading.textContent = 'Заявка отправлена';

const body = document.createElement('p');
body.textContent = 'Мы свяжемся с вами в течение рабочего дня.';

const btn = document.createElement('button');
btn.className = 'form-reset-btn';
btn.textContent = 'Отправить ещё одну';
btn.addEventListener('click', () => {
  success.remove();
  const form = document.getElementById('contact-form');
  form.style.display = 'block';
  form.reset();
});

success.append(icon, heading, body, btn);
card.appendChild(success);
```

This also removes the inline `onclick` attribute, which is blocked by any meaningful CSP `script-src` policy.

---

### 1.2 CSRF — INFO (not applicable here, by design)

The form has no backend submission yet — `handleSubmit` prevents default and shows the success UI. When a backend is added (Formspree, Telegram bot, custom API), CSRF protection must be implemented at that layer. For a static GitHub Pages form submitting to a third-party service, the service handles its own CSRF token.

**Action required before connecting a backend:** Confirm the chosen submission endpoint (Formspree, etc.) uses CSRF tokens. If a custom backend is built, add a server-generated token to the form.

---

### 1.3 Phone validation — HIGH

**Location:** `app.js` lines 22–38; `index.html` line 1264

The phone input has client-side prefix enforcement (`+7 `) but **no pattern validation**. The input type is `tel`, which browsers do not validate for format. A user can currently submit `+7 ` (just the prefix) or `+7 abc`, since there is no `pattern` attribute and no JS validation before submit.

**Fix:** Add a `pattern` attribute and update the JS validator:

```html
<input
  type="tel"
  id="phone"
  name="phone"
  value="+7 "
  inputmode="tel"
  required
  aria-required="true"
  autocomplete="tel"
  pattern="\+7\s\d{3}\s\d{3}[\s\-]\d{2}[\s\-]\d{2}"
  title="Формат: +7 XXX XXX-XX-XX"
/>
```

Also add a JS check in `handleSubmit` before the success state:

```js
function handleSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('phone').value;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) {
    document.getElementById('phone').setCustomValidity('Введите полный номер телефона');
    document.getElementById('phone').reportValidity();
    return;
  }
  document.getElementById('phone').setCustomValidity('');
  // ... rest of handler
}
```

---

### 1.4 Email validation — MEDIUM

**Location:** `index.html` line 1278

The email field uses `type="email"`, which provides basic browser validation. However:

- The field is **not `required`** (line 1282 — no `required` attribute). This is intentional per the UX (email is optional, phone is the primary). That is acceptable, but document this as a deliberate choice.
- There is no server-side validation (no backend yet). When a backend is added, validate email format server-side before any processing.

**No immediate fix needed** — browser `type="email"` validation is sufficient for an optional field on a static form. Add a note in code for when the backend is built.

---

### 1.5 No console.log or exposed debug data — PASS

Scanned `app.js` entirely. No `console.log`, `console.error`, `debugger`, or sensitive data exposure found.

---

## 2. Privacy & Compliance (152-FZ)

### 2.1 Cookie consent banner missing — HIGH

**Impact:** Yandex Metrica (planned) sets cookies and fingerprints visitors. Under Russian law 152-FZ and Roskomnadzor guidelines, operators must inform users about cookie use and obtain consent before analytics cookies are set. This is also aligned with GDPR if any EU visitors are expected.

**Current state:** No cookie banner exists.

**Fix — implement before enabling Yandex Metrica:**

1. Load the Metrica snippet **conditionally**, only after consent:

```html
<!-- Do NOT place YM snippet in <head> unconditionally -->
```

```js
// In app.js — only initialize after user accepts cookies
function initMetrica() {
  (function(m,e,t,r,i,k,a){
    // ... standard YM snippet
  })(window, document, "https://mc.yandex.ru/metrika/tag.js", ...);
}

// Show banner, then:
document.getElementById('cookie-accept').addEventListener('click', () => {
  localStorage.setItem('cookie_consent', '1');
  document.getElementById('cookie-banner').remove();
  initMetrica();
});

// On page load, auto-init only if already consented:
if (localStorage.getItem('cookie_consent') === '1') {
  initMetrica();
}
```

2. Add a minimal cookie banner to the HTML, placed before `</body>`:

```html
<div id="cookie-banner" style="..." aria-live="polite" role="region">
  <p>Мы используем cookies для аналитики. <a href="#" onclick="openPrivacyModal()">Подробнее</a></p>
  <button id="cookie-accept">Принять</button>
  <button id="cookie-decline">Отклонить</button>
</div>
```

---

### 2.2 Privacy policy — missing retention period and data processor details — MEDIUM

**Location:** `index.html` lines 1318–1344 (modal)

The current privacy modal covers:
- Data categories collected (complete — name, company, phone, email, free text)
- Purpose (commercial offer)
- No third-party transfer
- Storage in RF
- Deletion on request
- Contact for withdrawal

**Missing required elements under 152-FZ Art. 14:**

1. **Retention period** — How long is data stored? "До достижения цели обработки" or a specific duration (e.g., 3 years) must be stated.
2. **Data processing system** — If using any CRM, email service, or form handler, name them or state "обрабатывается только сотрудниками ООО «УльтраМол»".
3. **Legal basis** — The modal implies consent (checkbox/click), which is valid, but should state the legal basis explicitly: "основание — согласие субъекта персональных данных (п. 1 ч. 1 ст. 6 Федерального закона от 27.07.2006 N 152-ФЗ)".

**Suggested addition to the modal:**

```
Срок хранения: в течение 3 лет с момента получения или до отзыва согласия.
Правовое основание: согласие субъекта персональных данных (п. 1 ч. 1 ст. 6 Федерального закона № 152-ФЗ).
Обработка осуществляется сотрудниками ООО «УльтраМол» без передачи третьим лицам.
```

---

### 2.3 Consent mechanism — MEDIUM

**Location:** `index.html` line 1296

```html
<p class="form-note">
  Нажимая кнопку, вы соглашаетесь с
  <a href="#" onclick="...">политикой конфиденциальности</a>
</p>
```

The current pattern — "by clicking submit you agree" — is a common pattern but carries risk under 152-FZ, which requires **unambiguous** consent. Roskomnadzor has been increasingly critical of "submit = consent" patterns.

**Fix (recommended):** Add an explicit checkbox:

```html
<div class="form-group">
  <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
    <input type="checkbox" name="consent" required aria-required="true"
           style="margin-top:3px;flex-shrink:0;" />
    <span>Я согласен с <a href="#" onclick="openPrivacyModal();return false;">
      политикой конфиденциальности</a> и даю согласие на обработку персональных данных</span>
  </label>
</div>
```

This provides a clear, unambiguous, affirmative consent action separate from form submission.

---

## 3. Content Security Policy

### 3.1 No CSP header or meta tag — HIGH

**Current state:** No `Content-Security-Policy` meta tag or HTTP header is present.

Without a CSP:
- Any injected script (e.g., via a browser extension, future XSS, or supply chain attack on a CDN) runs without restriction.
- When Yandex Metrica is added, its script tags will need to be explicitly allowed.

**GitHub Pages does not support custom HTTP response headers**, so a `<meta>` CSP is the only option for this deployment.

**Recommended CSP meta tag for current state (no external scripts):**

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

**Notes:**
- `style-src 'unsafe-inline'` is required because styles.css is a linked file (fine) but inline `style=` attributes are used extensively throughout index.html — those require `'unsafe-inline'` or must be moved to classes.
- `script-src 'self'` allows `app.js` but blocks all inline scripts. The two inline `onclick` attributes in the footer and form-note (privacy modal openers) must be converted to event listeners in `app.js`. The form's `onsubmit="handleSubmit(event)"` must also be converted.
- When Yandex Metrica is added, extend to: `script-src 'self' https://mc.yandex.ru; img-src 'self' data: https://mc.yandex.ru;`

**Inline event handlers to convert before enforcing CSP:**

| Location | Current | Fix |
|----------|---------|-----|
| `index.html` line 1299 | `onclick="document.getElementById('privacy-modal').classList.add('active'); return false;"` | Move to `app.js` as an event listener |
| `index.html` line 1570 | Same onclick on footer privacy link | Move to `app.js` |
| `index.html` line 1236 | `onsubmit="handleSubmit(event)"` | Use `form.addEventListener('submit', handleSubmit)` in `app.js` |
| `app.js` line 142 | `onclick=` inside innerHTML string | Already covered in finding 1.1 |

---

## 4. SEO

### 4.1 og:image points to GitHub Pages URL, not canonical domain — MEDIUM

**Location:** `index.html` lines 29, 46

```html
<meta property="og:image" content="https://boldyrevap.github.io/ultramol-landing/assets/images/hero.webp" />
<meta name="twitter:image" content="https://boldyrevap.github.io/ultramol-landing/assets/images/hero.webp" />
```

When the site moves to `www.ultramol.ru`, these OG/Twitter image URLs still point to the GitHub Pages subdomain. Social crawlers will fetch from the correct URL now, but it creates a dependency on GitHub Pages staying live.

**Fix:** Use the canonical domain:

```html
<meta property="og:image" content="https://www.ultramol.ru/assets/images/hero.webp" />
<meta name="twitter:image" content="https://www.ultramol.ru/assets/images/hero.webp" />
```

Similarly, the JSON-LD `logo` field has the same issue (line 71):

```json
"logo": "https://boldyrevap.github.io/ultramol-landing/assets/images/hero.webp"
```

The logo should be a dedicated logo image, not the hero photo. Fix:

```json
"logo": "https://www.ultramol.ru/assets/images/logo.png"
```

---

### 4.2 JSON-LD: Organization type may be insufficient — LOW

**Location:** `index.html` lines 65–83

The structured data uses `"@type": "Organization"`. For a manufacturer, Google supports more specific types.

**Recommended addition:**

```json
{
  "@context": "https://schema.org",
  "@type": ["Organization", "LocalBusiness"],
  "name": "УльтраМол",
  "url": "https://www.ultramol.ru",
  "logo": "https://www.ultramol.ru/assets/images/logo.png",
  "image": "https://www.ultramol.ru/assets/images/hero.webp",
  "telephone": "+74712747072",
  "email": "info@ultramol.ru",
  "priceRange": "от 4 млн ₽",
  "openingHours": "Mo-Fr 09:00-18:00",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "ул. 2-я Агрегатная, д. 5А",
    "addressLocality": "Курск",
    "postalCode": "305000",
    "addressCountry": "RU"
  },
  "description": "Российский производитель измельчительного оборудования для пищевых ингредиентов",
  "sameAs": []
}
```

---

### 4.3 No robots.txt — MEDIUM

**Current state:** No `robots.txt` file exists in the project.

Without `robots.txt`, crawlers index everything by default, which is fine for this single-page site. However, its absence means:
- No `Sitemap:` directive to guide Yandex/Google
- No way to block crawling of any future staging or draft pages

**Fix:** Create `/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://www.ultramol.ru/sitemap.xml
```

---

### 4.4 No sitemap.xml — MEDIUM

**Current state:** No `sitemap.xml` exists.

For a single-page site this is low urgency, but Yandex Webmaster and Google Search Console both benefit from an explicit sitemap for faster indexing and accurate lastmod signaling.

**Fix:** Create `/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.ultramol.ru/</loc>
    <lastmod>2026-04-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

---

### 4.5 Heading hierarchy — PASS with note

The heading structure is correct:
- One `<h1>` in the hero section
- Multiple `<h2>` section headings
- `<h3>` within feature items, step cards, and the form card

**Note:** The `<h2>` inside the privacy modal (`index.html` line 1318) is semantically correct. No issues.

---

### 4.6 Alt text on images — PASS with minor gaps

Most images have descriptive alt text. Two logos have generic one-word alt text that could be improved for accessibility but are not SEO issues:

- `alt="БРТ"` — acceptable abbreviation
- `alt="ТЗ"` — consider `alt="Тульский завод РТИ"` to match the visible text

Not a blocker.

---

### 4.7 Missing meta keywords — INFO

`<meta name="keywords">` is no longer used by Google or Yandex for ranking. Not adding it is the correct decision. No action needed.

---

### 4.8 twitter:site and og:site_name missing — LOW

```html
<!-- Missing: -->
<meta name="twitter:site" content="@ultramol_ru" />
<meta property="og:site_name" content="УльтраМол" />
```

These are not critical but improve how social cards display. Add if a Twitter/X account exists.

---

## 5. Privacy Modal — Accessibility and Security

### 5.1 Focus trap missing — MEDIUM

**Location:** `app.js` lines 1–16

When the modal opens, keyboard focus is not moved into the modal, and Tab key can still reach elements behind the overlay. Screen reader users and keyboard-only users may not be aware the modal is open.

**Fix:**

```js
// When opening modal
privacyModal.classList.add('active');
privacyModal.querySelector('.modal-close').focus();

// Trap focus inside modal while open
privacyModal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const focusable = privacyModal.querySelectorAll(
    'a[href], button, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});
```

Also add `aria-modal="true"` and `role="dialog"` to the modal element:

```html
<div class="modal-overlay" id="privacy-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-modal-title">
  <div class="modal-content">
    <button class="modal-close" aria-label="Закрыть">&times;</button>
    <h2 id="privacy-modal-title">Политика конфиденциальности</h2>
```

---

### 5.2 `return false` in onclick — LOW (style issue, not security)

**Location:** `index.html` lines 1299, 1570

```html
onclick="document.getElementById('privacy-modal').classList.add('active'); return false;"
```

`return false` in an HTML onclick attribute prevents the default link behavior but does not stop event propagation (unlike `e.preventDefault()` + `e.stopPropagation()`). This works correctly here because `href="#"` would just scroll to top — the `return false` blocks that. No security issue, but it should be moved to `app.js` as a proper event listener (also required for CSP compliance per finding 3.1).

---

## 6. External Resources and Referrer Leakage

### 6.1 External link to www.ultramol.ru from footer — INFO

**Location:** `index.html` line 1502–1508

```html
<a href="https://www.ultramol.ru" target="_blank" rel="noopener noreferrer">ultramol.ru</a>
```

`rel="noopener noreferrer"` is correctly applied. `noreferrer` prevents the referrer header from being sent, which is appropriate. No issue.

**All other links** are internal anchors (`href="#..."`), `tel:`, or `mailto:` — no external referrer leakage.

---

## 7. Subresource Integrity (SRI)

### 7.1 No CDN resources loaded — PASS

Neither `index.html` nor `app.js` loads any external JavaScript or CSS from a CDN. All resources (`styles.css`, `app.js`, `assets/`) are served from the same origin. SRI is not applicable and not needed.

When Yandex Metrica is added, its script is loaded from `mc.yandex.ru` — SRI cannot be applied to dynamically-versioned third-party analytics scripts. Trust is established by restricting the origin in CSP (`script-src https://mc.yandex.ru`).

---

## Prioritized Fix List

| Priority | Finding | File | Effort |
|----------|---------|------|--------|
| HIGH | Add cookie consent banner before enabling Yandex Metrica | index.html + app.js | 2–3 hours |
| HIGH | Add CSP meta tag + convert inline event handlers | index.html + app.js | 1–2 hours |
| HIGH | Add phone pattern validation | index.html + app.js | 30 min |
| HIGH | Add explicit consent checkbox for 152-FZ compliance | index.html | 30 min |
| MEDIUM | Add retention period + legal basis to privacy modal | index.html | 15 min |
| MEDIUM | Create robots.txt | new file | 5 min |
| MEDIUM | Create sitemap.xml | new file | 10 min |
| MEDIUM | Fix og:image and JSON-LD logo URL to canonical domain | index.html | 10 min |
| MEDIUM | Add focus trap and ARIA attributes to privacy modal | index.html + app.js | 45 min |
| LOW | Replace innerHTML success block with DOM API | app.js | 20 min |
| LOW | Expand JSON-LD to LocalBusiness with openingHours | index.html | 15 min |
| LOW | Add og:site_name meta tag | index.html | 5 min |
