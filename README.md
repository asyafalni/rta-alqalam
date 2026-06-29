# Handoff: Program Orang Tua Asuh — RTA Al-Qalam

## Overview
A single-page donation microsite for the **Program Orang Tua Asuh** (Foster Parent Program) of
**Rumah Tahfidz Al-Qur'an (RTA) Al-Qalam**, Citra Gran Cibubur (under Yayasan Al Qalam).

The program lets a donor become a "foster parent" who covers part of the education and living
costs of an underprivileged (*dhuafa*) Qur'an-memorization student. The page explains the program,
lets the donor build a recurring commitment (duration + monthly amount), collects their details in a
digital form, shows how to donate via QRIS, and answers FAQs (intended as an admin reference).

Language: **Bahasa Indonesia** (with Arabic motto accents). Audience: prospective donors and the
admin who fields their questions.

## About the Production File
`index.html` is the production page (renamed from `Program Orang Tua Asuh.dc.html`). It contains
the full template and logic class and is served directly. `support.js` is the DC framework runtime
that `index.html` loads and depends on — both files must be served together.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and interactions are all
intentional and specified below. Recreate the UI faithfully. The only thing that should change in
production is the *implementation* (framework/components), not the visual design.

## How to read the source
`index.html` contains two relevant parts:
- **The template** (markup between `<x-dc>` … `</x-dc>`): the HTML structure with inline styles.
  `{{ someName }}` are data holes; `<sc-for list="{{ items }}" as="x">` is a loop;
  `<sc-if value="{{ flag }}">` is a conditional. These map directly to `.map()` / conditional
  rendering in React/Vue.
- **The logic class** (`class Component extends DCLogic { … }`): plain JavaScript holding state
  (`this.state`), event handlers, and a `renderVals()` method that returns every value the template
  consumes. Port `state` to your component state and `renderVals()` logic to derived values/handlers.

`support.js` is the DC framework runtime — it must be present alongside `index.html` in production.

## Screens / Views
This is a single scrolling page with anchored sections. Top to bottom:

### 1. Sticky Top Bar
- **Layout**: full-width sticky bar, `max-width:1180px` centered content, flex row, `padding:11px 26px`.
- Background `rgba(8,58,40,.93)` with `backdrop-filter: blur(10px)`; bottom border `1px solid rgba(198,160,82,.32)`.
- Left: emblem (`assets/emblem-rta.png`, 42×42). Then two-line title: "Rumah Tahfidz Al-Qur'an Al-Qalam" (Marcellus, 16px, `#f4ead2`) over "Darul Huffadz · Yayasan Al Qalam" (11px, uppercase, `letter-spacing:.22em`, `#c6a052`).
- Right: gold pill CTA "Jadi Orang Tua Asuh" → anchors to `#komitmen`.

### 2. Hero (`data-screen-label="Hero"`)
- **Purpose**: introduce the program emotionally and drive to the form.
- **Layout**: centered, `max-width:880px`, `padding:74px 26px 92px`. Background = radial gradient
  `radial-gradient(120% 90% at 50% -10%, #0e5a3c 0%, #0a4631 45%, #063626 100%)`. Decorative dotted
  texture overlay (radial-dot pattern at 6% opacity) + a faint centered ring.
- **Components**:
  - Eyebrow pill "Program Donasi" (uppercase, `letter-spacing:.26em`, gold border).
  - **Full logo** on a cream rounded card: image `assets/logo-full-rta.png`, `width:min(360px,72vw)`,
    card `background:rgba(251,243,223,.96)`, `border-radius:26px`, `padding:30px 38px`,
    `box-shadow:0 22px 60px -22px rgba(0,0,0,.55)`, gentle float animation (`floatY`, 7s). The card is
    required because the logo's text is dark navy and would be invisible on the dark green hero.
  - H1 "Orang Tua Asuh" (Marcellus, `clamp(44px,8vw,80px)`, `#fbf3df`).
  - Arabic motto (Amiri, RTL, `#d4b56a`): `بِالْقَلَمِ وَالْعِلْمِ وَنُورِ الْقُرْآنِ، تُزْهِرُ الْأَرْضُ بِثِمَارِ الْإِحْسَان`.
  - Lead paragraph + italic Indonesian translation of the motto.
  - Two CTAs: primary gold pill "Mulai Jadi Orang Tua Asuh →" (`#komitmen`), secondary outline "Cara Berdonasi" (`#qris`).
  - **Trust strip**: 4-cell grid (hairline-separated) — "15 Juz / Target Hafalan", "100% / Untuk Santri Dhuafa", "24 Jam / Pendidikan Berasrama", "SMP/MTS / Jenjang Saat Ini". Numbers in Marcellus `#e6cf8e`.

### 3. Tentang Program (`#tentang`)
- **Layout**: `max-width:1080px`, two-column grid (`minmax(300px,1fr)`), gap 54px, on `#f6efe0`.
- Left: eyebrow "Apa Itu Program Ini", H2 "Gotong royong menanggung satu generasi Qur'ani", two body
  paragraphs, and a gold left-border callout stating only **SMP/MTS** (SD/MI graduates) are currently enrolled.
- Right: dark green card (gradient `#0e5a3c→#093624`, `border-radius:22px`) titled "Mengapa peran Anda penting" with 3 diamond-bullet points.

### 4. Donasi Anda Menanggung (cakupan)
- On `#fbf7ec`. Centered heading. 4-card responsive grid (`minmax(220px,1fr)`), white cards,
  `border-radius:18px`, `border:1px solid #ece3cf`: **Asrama & Makan**, **Biaya Pendidikan**,
  **Seragam & Kebutuhan**, **Pembinaan Karakter**. Each has a colored rounded icon chip + title (Marcellus 21px) + description.

### 5. Cara Menjadi Orang Tua Asuh (4 steps)
- On `#f6efe0`. 4-column responsive grid. Each step = numbered circle (gradient green, gold number,
  Marcellus) + title + caption: 1 Pilih komitmen · 2 Isi data diri · 3 Transfer via QRIS · 4 Terima laporan.

### 6. Form Komitmen (`#komitmen`) — the interactive core
- **Background**: radial green gradient (matches hero) + dot texture. Inside, a cream form card
  (`#fbf7ec`, `border-radius:24px`, `padding:clamp(24px,4vw,44px)`, gold-tinted border, large soft shadow).
- **Step 1 — Pilih jangka waktu**: 4 selectable cards (`minmax(150px,1fr)`): **6 Bulan, 1 Tahun,
  2 Tahun, 3 Tahun**. Selected state = green gradient fill, gold border, "Terpilih" gold pill badge,
  lift on hover (`translateY(-3px)`).
- **Step 2 — Pilih nominal per bulan**: 5 selectable cards: **Rp 100.000, Rp 250.000, Rp 500.000,
  Rp 750.000, Lainnya**. Picking "Lainnya" reveals a custom numeric input (digits only, formatted
  with thousands separators, "/ bulan" suffix).
- **Live summary bar** (green gradient): Jangka Waktu · Donasi/Bulan · **Total Komitmen** (monthly × months),
  total emphasized in gold Marcellus.
- **Step 3 — Lengkapi data diri**:
  - Nama Lengkap (required), No. HP / WhatsApp (required, `inputmode=tel`), Alamat (full width),
  - **Komitmen Tanggal Transfer**: a calendar-style picker card (white, header "Tanggal Transfer"),
    a 7-column grid of **square day cells 1–28** (no month). Selected day = green gradient fill, gold
    border. Shows current selection label "Setiap tanggal N".
  - Catatan (optional).
- **Validation**: Nama and No. HP required; a jangka waktu must be chosen; a nominal must be chosen/entered.
  On failure show an inline error box (`#fdecea` bg, `#a23423` text) and block submit.
- **Submit** = an anchor styled as a green button "Kirim Komitmen via WhatsApp" (must be a real link so
  the WhatsApp redirect counts as a genuine user gesture — see Interactions).
- **Success panel** (after valid submit): green card, gold check ring, "Jazaakumullaahu khayran!",
  a "Buka WhatsApp Admin →" button (in case the auto-open was blocked) and a link to `#qris`.

### 7. Cara Berdonasi — QRIS (`#qris`)
- On `#fbf7ec`. Two-column: left = a styled white "INFAQ RTA Al-Qalam" QRIS card showing the QR image
  (`assets/qris-qr.png`, the cleaned/cropped code), `NMID : ID1026525038901`, motto "Satu QRIS untuk semua".
  Right = 4 numbered steps (open QRIS app → scan & verify name **INFAQ RTA AL QALAM** → enter amount &
  pay → confirm to admin) + a green "WA Admin · 0819-7339-9739" button + a link to the full poster
  (`assets/qris-rta.png`).

### 8. FAQ (`data-screen-label="FAQ"`)
- On `#f6efe0`, `max-width:820px`. Subtitle notes it is an **admin reference**.
- 9 accordion items (white cards, gold border + shadow when open). Toggle control = a **circular badge
  with a chevron** that points down when closed and rotates 180° (points up) when open; badge fills
  green on open. Body expands via `max-height`/`opacity` transition (~.28s). Only one open at a time
  (default: first open). FAQ content is listed verbatim in the prototype — reuse it exactly.

### 9. Footer
- Green radial gradient, centered: emblem, org name, "Darul Huffadz · Yayasan Al Qalam Citra Gran Cibubur",
  Arabic motto + Indonesian translation, two CTAs (WhatsApp admin, Jadi Orang Tua Asuh), and a fine-print
  line with WA number + QRIS NMID.

## Interactions & Behavior
- **Selection cards** (duration, amount, day): single-select; selected style as above; hover lift `translateY(-3px)`.
- **Custom amount**: only digits kept; displayed with `toLocaleString('id-ID')`; feeds the live total and submission.
- **Live total**: `monthlyValue × months`, formatted `Rp 1.234.567` (id-ID). Shows `—` until both chosen.
- **Submit → dual action** (important):
  1. **Records to Google Form in the background** via `fetch(formResponse, {method:'POST', mode:'no-cors', body})`
     using `URLSearchParams` of the entry IDs (see Integrations). No-cors = no readable response; that's expected.
  2. **Opens WhatsApp** to the admin with a pre-filled message. This MUST be triggered by a real `<a href>`
     click (not `window.open`), otherwise sandboxes/popup-blockers stop it. Validation runs in the click
     handler and calls `preventDefault()` to cancel navigation when the form is invalid.
- **Accordion**: click toggles open index; chevron rotates 180°; one-open-at-a-time.
- **Anchored nav**: `html { scroll-behavior:smooth }`; CTAs jump to `#komitmen`, `#qris`, `#tentang`.
- **Float animation**: hero logo card uses `@keyframes floatY` (±10px, 7s ease-in-out infinite).

## State Management
From the logic class — replicate these in your component:
- `months` (6 | 12 | 24 | 36 | null) — chosen duration.
- `amountKey` ('100' | '250' | '500' | '750' | 'custom' | null) and `customAmount` (digit string).
- `name`, `address`, `phone`, `transferDay` ('1'–'28', default '1'), `note`.
- `submitted` (bool), `error` (string), `waLink` (string), `openFaq` (index, default 0).
- Derived: `monthlyValue()`, `total = monthlyValue × months`, `durLabel(m)`, formatted strings,
  `buildWa()` (WhatsApp deep link), the WhatsApp message body, and the Google Form submission.

## Integrations
### WhatsApp
- Admin number: **`6281973399739`** (displayed as 0819-7339-9739).
- Deep link: `https://wa.me/6281973399739?text=<urlencoded message>`.
- Message body (newline-separated): salam, "mendaftar sebagai Orang Tua Asuh", then Nama, Alamat,
  No. HP/WA, Jangka Waktu, Nominal per Bulan, Total Komitmen, Komitmen Transfer (tanggal), optional Catatan.

### Google Form (silent submission)
- Form: `Pendaftaran Program Orang Tua Asuh RTA Al-Qalam`.
- POST endpoint: `https://docs.google.com/forms/d/e/1FAIpQLSf_kEGvREhEqwTzH8RHN8sReCLDKZTAorBCR9I81ZcyAPbyoA/formResponse`
- Field (entry) IDs:
  - Nama → `entry.827177918`
  - No. HP → `entry.433190014`
  - Alamat → `entry.2095310306`
  - Jangka Waktu → `entry.1197534936` (values: `6 Bulan` | `1 Tahun` | `2 Tahun` | `3 Tahun`)
  - Nominal → `entry.1986076729` (values: `Rp. 100000` | `Rp. 250000` | `Rp. 500000` | `Rp. 750000`;
    for custom send `__other_option__` plus `entry.1986076729.other_option_response = "Rp. <amount>"`)
  - Komitmen Tanggal Transfer → `entry.1908569646` (value: day number "1"–"28")
  - Catatan → `entry.1112172306`
- Submit with `mode:'no-cors'`. The row still lands in the linked responses sheet.

## Design Tokens
**Colors**
- Deep green (primary) `#0e5a3c`; darker greens `#0a4631`, `#093624`, `#063626`; accent green `#0c6240`.
- Gold/brass `#c6a052`; lighter gold `#d4b56a`; deep gold `#bb9647` / `#b08f3f`; pale gold text `#e6cf8e`.
- Cream/parchment surfaces `#f6efe0`, `#fbf7ec`, `#fbf3df`; warm text on dark `#ecdfc2` / `#cfc1a4`.
- Ink/body text `#26302a`, `#0d3a28`; muted `#5b6a61`, `#8a7d5f`.
- Navy accent (from logo) `#16244e`. Error `#fdecea` bg / `#a23423` text. Borders `#ece3cf`, `#e3dcc8`, `#ddd4bf`.

**Typography** (Google Fonts)
- Display/headings: **Marcellus** (400).
- Body/UI: **Plus Jakarta Sans** (400/500/600/700).
- Arabic: **Amiri** (400/700).
- Scale: H1 `clamp(44px,8vw,80px)`; section H2 `clamp(30–32px,4.4–4.8vw,44–48px)`; card titles 19–24px;
  body 14.5–17px; eyebrows 12.5px uppercase `letter-spacing:.24em`.

**Radius**: pills `999px`; cards 14–26px; inputs 11–14px.
**Shadows**: soft elevated greens, e.g. `0 22px 60px -22px rgba(0,0,0,.55)` (hero card),
`0 40px 80px -36px rgba(0,0,0,.6)` (form card), `0 1px 0 rgba(0,0,0,.02)` (flat cards).
**Motion**: card hover `translateY(-3px)`; accordion `max-height/opacity ~.28s ease`; float 7s.
**Texture**: dotted overlay `radial-gradient(circle at 1px 1px, #e9d9a8 1px, transparent 0)` `background-size:22–26px`, 5–7% opacity.

## Assets (in `assets/`)
- `logo-full-rta.png` — full stacked logo with Arabic + "RUMAH TAHFIDZ AL-QUR'AN / AL-QALAM" text (hero card). 1866×1764, transparent.
- `emblem-rta.png` — emblem/icon mark (top bar, footer).
- `logo-rta.png` — alternate logo on transparent bg.
- `qris-qr.png` — cleaned & cropped QRIS code (donation card).
- `qris-rta.png` — full original QRIS poster (linked as "poster lengkap").

All assets were provided by the client (RTA Al-Qalam). Keep them; do not regenerate.

## Files
- `index.html` — the production page (template + logic class). Renamed from `Program Orang Tua Asuh.dc.html`.
- `support.js` — DC framework runtime; **required in production** (loaded by `index.html`).
- `assets/` — images listed above.
- `CLAUDE.md` — working notes / guardrails for Claude Code.
