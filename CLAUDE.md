# CLAUDE.md — Program Orang Tua Asuh (RTA Al-Qalam)

Guidance for Claude Code when implementing this design in a real codebase.
Read `README.md` first — it is the full spec. This file is the short, opinionated version.

## What this is
A one-page Bahasa-Indonesia donation microsite for a foster-parent ("Orang Tua Asuh") program at an
Islamic Qur'an-memorization boarding school. Hifi design. Recreate faithfully in the target stack.

## Golden rules
1. **`index.html` is the production file** (renamed from `Program Orang Tua Asuh.dc.html`).
   `support.js` is the prototype runtime only — it is **not** part of the production build.
2. **Match the visual design exactly** — colors, fonts, spacing, copy, and interactions are final.
   Pull the exact values from README "Design Tokens" and the prototype's inline styles.
3. **Keep all copy verbatim** (Indonesian + Arabic). Do not paraphrase, translate, or "improve" it.
   The Arabic motto and FAQ wording were client-reviewed.
4. **Don't add content.** No invented stats, sections, testimonials, or placeholder text.

## Tech expectations
- No backend needed. Two client-side integrations only (see README "Integrations"):
  - **WhatsApp deep link** — must be a real `<a href="https://wa.me/...">`. Build validation into the
    click handler and `preventDefault()` when invalid. Do not use `window.open` (popup-blocked / sandboxed).
  - **Google Form POST** — `fetch(formResponse, {method:'POST', mode:'no-cors', body: URLSearchParams})`.
    `no-cors` returns an opaque response (no status readable) — that is expected; the row still saves.
    Fire it on valid submit, then let the WhatsApp link proceed.
- Fonts: Marcellus, Plus Jakarta Sans, Amiri (Google Fonts). Load with proper `font-display:swap`.
- Fully responsive: every multi-column grid already uses `repeat(auto-fit, minmax(...))` — preserve that.
- Accessibility: real `<button>`/`<a>`, `<label>`s tied to inputs, `aria-expanded` on FAQ toggles,
  keyboard-operable accordion and selection cards, visible focus states.

## State to replicate
`months`, `amountKey` + `customAmount`, `name`/`address`/`phone`/`transferDay`/`note`,
`submitted`/`error`/`waLink`, `openFaq`. Derived: monthly value, total (= monthly × months),
formatted Rp strings (`toLocaleString('id-ID')`), WhatsApp link + message, Google Form payload.

## Critical data (do not change without client confirmation)
- WhatsApp admin: `6281973399739` (shown as 0819-7339-9739).
- QRIS: INFAQ RTA Al-Qalam, NMID `ID1026525038901`.
- Google Form action + entry IDs: see README "Integrations". If the client edits the form, regenerate
  entry IDs via Forms → ⋮ → "Get pre-filled link".
- Durations: 6 bln / 1 / 2 / 3 thn. Amounts: 100k / 250k / 500k / 750k / Lainnya. Transfer day: 1–28, no month.
- Currently enrolling **SMP/MTS only** (SD/MI graduates) — keep this caveat where it appears.

## Assets
Use the provided files in `assets/` as-is. The hero uses the full text logo on a **cream card**
(its navy text is invisible on the dark green hero — keep the card). Top bar/footer use the emblem.

## Definition of done
- Pixel-faithful to the prototype across mobile + desktop.
- Form validates, opens WhatsApp with a correct pre-filled message, AND records to the Google Form.
- FAQ accordion works (chevron rotates, one open at a time).
- All copy and integration values match exactly. `support.js` is not referenced in the shipped build.
