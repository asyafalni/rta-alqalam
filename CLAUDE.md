# CLAUDE.md — Program Orang Tua Asuh (RTA Al-Qalam)

Guidance for Claude Code when implementing this design in a real codebase.
Read `README.md` first — it is the full spec. This file is the short, opinionated version.

## What this is
A one-page Bahasa-Indonesia donation microsite for a foster-parent ("Orang Tua Asuh") program at an
Islamic Qur'an-memorization boarding school. Hifi design. Recreate faithfully in the target stack.

> **The repo now ships two apps:** (1) the donation **microsite** `index.html` (this file's golden rules
> below are for it), and (2) a separate **Student Tracker** in `tracker/` — see "The Student Tracker"
> section near the end. Both are static, DC-framework, backend-free, and depend on `support.js`.

## Golden rules
1. **`index.html` is the production file** (renamed from `Program Orang Tua Asuh.dc.html`).
   `support.js` is the DC framework runtime that `index.html` depends on — it **must** be shipped alongside it.
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
- BSI transfer (in "Cara Berdonasi" + the payment FAQ): rekening `7346-7741-12` a.n. INFAQ RTA AL QALAM.
- Tracker `CONFIG_ID`: the hardcoded **public Config sheet** in `tracker/index.html` — resolves the data
  sheet + the three form pre-fill links. Change only with client confirmation.
- Google Form action + entry IDs: see README "Integrations". If the client edits the form, regenerate
  entry IDs via Forms → ⋮ → "Get pre-filled link".
- Durations: 6 bln / 1 / 2 / 3 thn. Amounts: 100k / 250k / 500k / 750k / Lainnya. Transfer day: 1–28, no month.
- Currently enrolling **SMP/MTS only** (SD/MI graduates) — keep this caveat where it appears.

## Assets
Use the provided files in `assets/` as-is. The hero uses the full text logo on a **cream card**
(its navy text is invisible on the dark green hero — keep the card). Top bar/footer use the emblem.

## Definition of done (microsite)
- Pixel-faithful to the prototype across mobile + desktop.
- Form validates, opens WhatsApp with a correct pre-filled message, AND records to the Google Form.
- FAQ accordion works (chevron rotates, one open at a time).
- All copy and integration values match exactly. Both `index.html` and `support.js` are present in the shipped build.

---

## The Student Tracker (`tracker/index.html`)
A **separate** app: a "Progres Santri" dashboard for staff (admin/mudir/musyrif) and a public gallery for
parents. Same stack as the microsite (static, DC framework, needs `support.js`), **no backend** — reads
Google Sheets via keyless **GViz JSON** and writes via **Google-Form POST** (`no-cors`).

- **`GUIDE.md` is the tracker's source of truth** for the whole Google-Sheet architecture and every
  formula (columns, keys, mirror ranges, the auto-progress pipeline). **Keep it tallied with the code on
  every change** — it's the manual the client follows to build the sheets.
- **Config-driven:** a hardcoded public `CONFIG_ID` sheet resolves the data sheet + the three form
  pre-fill links (Setoran / Nilai / Absensi). The Konfigurasi panel is **read-only**; a **"Gunakan data
  contoh (demo)"** checkbox (localStorage) forces the built-in demo santri for previewing.
- **Auth:** Clerk client-side, role from `publicMetadata.role`. The **publishable** key stays in the HTML
  (public by design). Falls back to a demo role-picker when Clerk is absent (opened as `file://`).
- **Progress model (strict manhaj):** roadmap `PROGRAM_FULL` = Juz **30→26, 1→10**, then **bonus 11→25**.
  `juzct` (count of completed juz, contiguous prefix) + `curpg`/`curjuzpct` (in-progress-juz fraction)
  drive the continuous ring (green 0–100%, gold bonus arc to 200%). The **sheet** computes those from the
  daily `Setoran` log — GUIDE §2h (page grid) and §2i (ayah-precise `curjuzpct`).
- **Inputs:** custom in-app forms POST to Google Forms via pre-filled links. Setoran uses **absolute page
  `hal_dari`/`hal_ke`** (juz derived from the page); Nilai uses the **Mapel `id`** (not name/bidang).

### Tracker rules
- **Verify behaviour end-to-end — don't assume.** It's a live-data app: drive it headless (Chrome
  `--headless --screenshot`, or puppeteer-core in `~/qa-tmp`) and **read the PNG** before claiming a fix
  works. Check JS with `new Function(scriptBody)` and grep sc-if/sc-for tag balance.
- **Keep `GUIDE.md` in sync** with any sheet column / key / formula change.
- A published Google Form + **Responders = "Anyone"** is required, else the POST silently 401s.
- Local dev server: **`node serve.cjs`** (port 8080). **Don't commit** `.claude/settings.local.json`.
