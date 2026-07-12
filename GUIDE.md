# GUIDE — Google Sheet Architecture for RTA Al-Qalam Student Tracker

How to set up the data layer for the tracker (`/tracker/`). No backend, no API key.

- **Write path:** staff → Google Form → **Private** sheet.
- **Read path:** tracker → GViz JSON → **Public** sheet (a curated mirror of Private).

The student's paper **Buku Mutaba'ah** stays separate — it is the student's daily self‑journal
and is *not* replicated here. This system covers the institutional/staff side (assessment,
academics, reporting).

---

## 1. The big picture

```
   Staff input (Google Form)
            │  writes
            ▼
 ┌───────────────────────────────┐
 │  PRIVATE sheet  (source truth)│   restricted access — staff only
 │  ├─ tab: Setoran (Form resp.) │   raw per-event submissions
 │  ├─ tab: Master               │   one row per santri (public A–R · private S+)
 │  ├─ tab: Nilai                │   one row per test (id, tanggal, mapel-id, jenis, nilai)
 │  ├─ tab: Mapel                │   subject definitions per group (id, bidang, mapel, alias)
 │  ├─ tab: Halaqah              │   circle musyrif (nama, musyrif) · name lives in Master.hal
 │  └─ tab: Absensi              │   one row per absence (id, tanggal, status, …)
 └───────────────┬───────────────┘
                 │  IMPORTRANGE (one-way, authorized once)
                 ▼
 ┌───────────────────────────────┐
 │  PUBLIC sheet   (reference)   │   "Anyone with link → Viewer"
 │  ├─ tab: Roster               │   public columns A–R only, mirrored live
 │  ├─ tab: Nilai                │   per-test scores, mirrored live
 │  ├─ tab: Mapel                │   subject definitions (id,bidang,mapel,alias), mirrored live
 │  ├─ tab: Halaqah              │   circle musyrif (nama,musyrif), mirrored live
 │  ├─ tab: Setoran              │   daily log (id,tanggal,jenis,hal_dari,hal_ke,…), mirrored live
 │  └─ tab: Absensi              │   only absences (id,tanggal,status,…), mirrored live
 └───────────────┬───────────────┘
                 │  GViz JSON (no API key)
                 ▼
          Tracker  /tracker/   ← paste the PUBLIC Sheet ID here
```

**Rule of thumb:** nothing originates in Public. Public only *mirrors* a safe subset of Private.
Everything shown in Public also exists in Private.

---

## Step-by-step setup (do this once, in order)

New to Google Sheets/Forms? Follow these steps top to bottom. Sections §2–§7 are the *reference*
(exact headers, formulas, rules); this is the *walkthrough*. Budget ~30–45 minutes.

> **The one trick that saves you the most work:** the tracker matches sheet columns by their
> **header name** (lower-cased), and ignores columns it doesn't recognise. So if you **title each
> Google Form question exactly like the key** (`id`, `tanggal`, `nilai`, …), the form's own response
> tab is already app-ready — the automatic `Timestamp` column is simply ignored. No reshaping needed.

### Step 1 — Google Drive: choose the account, make a folder
1. Sign in to **[drive.google.com](https://drive.google.com)** with the **school / yayasan** Google
   account — **not** a personal one. Whoever owns these files controls the data; use an account the
   institution keeps (e.g. `admin@…` or a shared `rtaalqalam@gmail.com`).
2. **New → Folder** → name it `RTA Tracker`. Keep both spreadsheets and both forms inside it — that
   folder becomes the single thing you back up / hand over.

### Step 2 — Create the PRIVATE spreadsheet + `Master` tab
1. Inside the folder: **New → Google Sheets → Blank**. Rename it (top-left) to
   **`RTA Tracker — PRIVATE`**.
2. Double-click the bottom tab `Sheet1` → rename it **`Master`**.
3. In **row 1**, type the headers exactly (lower-case), left to right — the 16 core columns then the
   optional ones (full list & meaning in **§2b**):
   `id  name  nick  kota  prov  hal  haf  tah  mur  ilm  akh  akd  bhs  juzct  curpg  kelas`
   then optionally `nis`. *(`juzct` = how many juz completed → drives progress; `curpg` = optional
   current page 1–604, just shows where he's working now — §2b.)*
4. Fill one row per santri from row 2. Give each a **short unique `id`** (`s1`, `s2`, …) — this id is
   how every other tab links to the student, so keep it stable. Put private data (wali, phone, …)
   **from column R onward** (see the ⚠️ in §2b).

### Step 3 — Add the `Mapel` and `Halaqah` tabs
1. Bottom-left **＋** to add a tab → name it **`Mapel`**. Row 1: `id  bidang  mapel  alias`. List your
   subjects, one per row, giving each a stable **`id`** (e.g. `P1`, `P2`, …). `alias` is optional (a
   longer/alternative name). Which `bidang` values are allowed → **§2d**. The `id` is what the `Nilai`
   tab stores, so you can freely rename or reorder subjects later without breaking past scores.
2. Add another tab → **`Halaqah`**. Row 1: `nama  musyrif` — one row per circle, e.g.
   `As-Shiddiq · Ustadz Salman Al-Farisi` (§2g). `nama` matches the **`hal`** column in `Master`
   (the halaqah name is written directly in `Master`; this tab just adds each circle's musyrif).

> **Those are the only tabs you create by hand.** The `Setoran`, `Nilai`, and (optional) `Absensi`
> tabs are **created automatically** when you link their forms in Step 4 — do **not** pre-create empty
> versions, or you'll end up with duplicates. (Prefer to hand-build `Absensi` instead of a form?
> Then add it here with row 1 `id  tanggal  status  jam  reason` — §2f.)

### Step 4 — Build the input Forms (→ §5)
For **each** form: **New → Google Forms** inside the folder.

**Form A — `Setoran Harian`** (daily). Add questions, and **title them exactly**:
`id`, `tanggal`, `jenis`, `hal_dari`, `hal_ke`, `catatan`, and optionally `surah`, `ayat_dari`,
`ayat_ke`, `nilai` (★1–5 rating). `hal_dari`/`hal_ke` = **absolute mushaf page 1–604** — the progress
driver (§2h); there is **no `juz` field** (derived from the page).
- Make **`id`** a **Dropdown** question whose options are your santri ids (`s1`, `s2`, …) — this
  prevents typos and keeps the link to `Master` exact.
- Make **`tanggal`** a **Date** question; **`jenis`** a Dropdown (`Ziyadah` / `Muroja'ah` / `Tahsin`).

**Form B — `Nilai Ujian/Tes`** (exams). Title the questions exactly:
`id`, `tanggal`, `mapel`, `jenis`, `nilai`.
- **`id`** Dropdown (same santri ids). **`mapel`** **Short answer** — it receives the Mapel **`id`**
  (`P1`, `P2`, …); the subject's name **and** its bidang both derive from that id, so there is no
  separate `bidang` or subject-name field to keep in sync (and no dropdown of codes to maintain).
  **`nilai`** short answer (0–100).
  *(In-app, teachers pick bidang → subject from friendly names; the form only ever stores the id.)*

**Form C — `Absensi`** *(optional — the admin attendance write-endpoint).* Title the questions
`id`, `tanggal`, `status`, `jam`, `reason` (types in §5, Form C). Nobody fills it directly — the app
POSTs to it — so afterwards you **paste its pre-filled link** into Konfigurasi (§5, Form C).

**Link each form to the PRIVATE sheet:** in the form, **Responses** tab → the green **Sheets** icon
→ **Select existing spreadsheet** → pick `RTA Tracker — PRIVATE`. Each link creates **one** new tab —
rename it to the app's name:
- Form A's response tab → rename to **`Setoran`**.
- Form B's response tab → rename to **`Nilai`**.
- (Form C's response tab → rename to **`Absensi`**.)

The extra `Timestamp` column each form adds is harmless — the app ignores unrecognised columns. **One
tab per form; no duplicates to maintain.**

Send yourself one test submission through each form and confirm a row lands in the right tab.

### Step 5 — Create the PUBLIC spreadsheet (the mirror)
1. In the folder: **New → Google Sheets** → rename to **`RTA Tracker — PUBLIC`**.
2. Rename `Sheet1` → **`Roster`**. Click cell **A1** and paste (replace `<PRIVATE_SHEET_ID>` — see the
   *Finding IDs* box below):
   ```
   =QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Master!A1:R"),"where Col1 is not null",1)
   ```
3. Press Enter → the cell shows **`#REF!`** with an **Allow access** button → click it **once**
   (this authorises Private→Public forever). Rows should fill in.
4. Add more tabs and paste one formula in A1 of each (details/variants in **§2c/§2d/§2g/§2a**):
   - **`Nilai`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Nilai!A1:Z"),"where Col2 is not null",1)`
   - **`Mapel`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Mapel!A1:D"),"where Col1 is not null",1)`
   - **`Halaqah`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Halaqah!A1:B"),"where Col1 is not null",1)`
   - **`Setoran`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Setoran!A1:Z"),"where Col2 is not null",1)`
   - **`Absensi`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Absensi!A1:Z"),"where Col2 is not null",1)`
   Click **Allow access** on each the first time.

> Only need the roster to start? Just do the `Roster` tab; add `Nilai`/`Mapel`/`Halaqah`/`Setoran`/
> `Absensi` later. Any tab you skip, the app fills with demo data.

### Step 6 — Share settings (this is what makes it safe → §4)
- **PRIVATE** sheet & both forms: **Share** → keep **Restricted**, invite only staff emails
  (Admin / Mudir / Musyrif) as **Editor**.
- **PUBLIC** sheet: **Share** → **General access → Anyone with the link → Viewer**. ⚠️ Never give
  the public **Editor** (§4 explains why that would leak the whole private sheet).

### Step 7 — Connect via the Config sheet (→ §6)
1. In your **PUBLIC** sheet, add a **`Config`** tab (`key` | `value`) with `sheet_id` (blank = this
   sheet), `setoran`, `nilai`, `absensi` — see §6.
2. Put that sheet's ID into **`CONFIG_ID`** near the top of `tracker/index.html`'s `<script>` (once).
3. Open `/tracker/` → **Masuk Staff** → **⚙️ Konfigurasi** shows each connection ✓/– and the data
   status. The panel is **read-only** — edit the `Config` tab and press **↻ Muat Ulang** to apply.

### Step 8 — Verify
- Gallery/dashboard show your real santri (not the demo names).
- Open a santri → **Riwayat Nilai** shows your test rows; **Riwayat Setoran Harian** shows daily rows.
- **+ Input** → both form toggles load; submit one and confirm it appears after a refresh.

> **Finding the IDs**
> - **Sheet ID** — from the sheet URL: `docs.google.com/spreadsheets/d/`**`THIS_LONG_PART`**`/edit`.
> - **Form ID** — open the form, **Send → link (🔗)** or Preview: `…/forms/d/e/`**`THIS_PART`**`/viewform`.
> - Paste the **PUBLIC** Sheet ID into the tracker — **never** the Private one.

---

## 2. PRIVATE sheet — the source of truth

Create one spreadsheet (e.g. **"RTA Tracker — PRIVATE"**). Keep it restricted: share only with
staff (Admin / Mudir / Musyrif). This is where the Google Form delivers responses.

### 2a. Tab `Setoran` (raw daily-form responses)
Auto-created when you link the **Setoran Harian** form (Form A, §5). Leave it as-is — it logs every
daily submission. The key columns are **`hal_dari` / `hal_ke`** = the **absolute mushaf page (1–604)**
the santri memorized/reviewed that day (page range; `hal_ke` blank = one page). These pages are the
**primary progress signal** — the juz and % derive from them (§2h). Optional **`surah`, `ayat_dari`,
`ayat_ke`** only *sharpen* the % when a session starts/stops mid-page. There is **no `juz` field** — the
juz is computed from the page. (Periodic exam scores go through a *separate* form into `Nilai` — §2c/§5.)

**Show the daily log in-app (optional):** the tracker renders a **Riwayat Setoran Harian** card on
each student's detail (10 most recent) if it finds a **public** tab named exactly `Setoran` with
these headers: `id, tanggal, jenis, hal_dari, hal_ke, catatan` (plus optional `surah, ayat_dari,
ayat_ke` and the daily `nilai` ★ rating). If you titled Form A's questions with the
exact keys and used an **`id` dropdown** (walkthrough Step 4), the linked `Setoran` tab is already
app-ready — mirror it whole:
`=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Setoran!A1:Z"), "where Col2 is not null", 1)`
(`Col2` = `id`; the automatic `Timestamp` column is ignored by the app). If instead your form stored
the santri **name**, add a reshape that maps `name → id` and selects the needed columns.
`jenis` colours by keyword (Ziyadah = green, Muroja'ah = gold, Tahsin/other = blue). Until the tab
exists, the tracker uses built-in demo setoran. Keep it parent-safe — no private notes here.

> The **`nilai`** column is Form A's **★ 1–5 Rating** field (daily quality). The app shows it as
> stars on the Riwayat Setoran card; §2e can also use it to compute the Hafalan/Muroja'ah/Tahsin
> pillars — **scale it ×20** there to reach the 0–100 pillar range (5★ = 100).

### 2b. Tab `Master` (one row per santri) — **this is what gets mirrored**
Put the **public columns first** — 16 core (A–P) plus the optional `nis` (Q) — then any
**private-only columns from R onward**. Header names in row 1 **must be exactly** these lowercase
keys (the tracker matches by header):

| Col | Header | Meaning | Type | Filled by |
|-----|--------|---------|------|-----------|
| A | `id`   | unique santri id (`s1`, `s2`, …) | text | staff |
| B | `name` | full name | text | staff |
| C | `nick` | nickname / panggilan | text | staff |
| D | `kota` | city | text | staff |
| E | `prov` | province | text | staff |
| F | `hal`  | **halaqah name** — the circle's name written directly, e.g. `As-Shiddiq`. The **`Halaqah`** tab (§2g) maps this name → the circle's musyrif. | text | staff |
| G | `haf`  | Hafalan (0–100) | number | Musyrif/Mudir |
| H | `tah`  | Tahsin — tajwid+kelancaran (0–100) | number | Musyrif/Mudir |
| I | `mur`  | Muroja'ah (0–100) | number | Musyrif/Mudir |
| J | `ilm`  | Ilmu & Bahasa Arab — mutun+mufrodat (0–100) | number | Musyrif/Mudir |
| K | `akh`  | Akhlak (0–100) | number | Musyrif/Mudir |
| L | `akd`  | Umum — math/IPA/… (0–100) | number | **Admin** |
| M | `bhs`  | Bahasa — Indonesia/Inggris (0–100) | number | **Admin** |
| N | `juzct` | **how many juz are completed** — a **count**, e.g. `1` (finished his first juz), `18` (over-achiever). This drives the ring fill / %. The roadmap order tells the app *which* juz those are (see below). | number | Musyrif/Mudir |
| O | `curpg` | **optional** — current page (1–604). When it sits inside the juz being memorized, the app adds **partial (front-to-back) credit** to the progress ring and shows the current juz/surah. Leave blank → whole-juz progress only (ring shows the next roadmap juz from `juzct`). | number | Musyrif/Mudir |
| P | `kelas` | class level, e.g. `VII` / `VIII` | text | staff |
| Q | `nis` | **optional, public** — the santri's NIS, shown in the Rapor header. Leave blank to show `—`. | text | staff |
| R | `khd` | **optional, public** — the **Kehadiran score** (0–100), a weighted formula computed from the `Absensi` tab (§2f). Blank → app derives a simple presence %. | number | formula |
| S+ | `wali`, `nohp`, `alamat`, `status`, `catatan_musyrif`, `catatan_mudir`, … | **PRIVATE — never mirrored** | any | staff |

> ⚠️ **Columns Q–R are reserved for the optional public `nis` / `khd`.** Start any **private** columns
> at **S** — the mirror (§3) imports `A:R`, so anything in Q–R becomes public.
> *(Daily absences live in their own `Absensi` tab, §2f; `khd` is just the computed score.)*

> The score columns (G–M) are what the app's **Profil Kemampuan** radar/bars read. Type them
> directly, **or** compute them from `Setoran` (daily) + `Nilai` (tests) — see **§2e** for the
> exact, copy-paste formulas per pillar. Keeping `Master` current (manual vs formula) is your
> choice — the tracker only needs this row-per-santri shape.
>
> **Blank = N/A, not zero.** Leave a score cell empty and that pillar shows **N/A** ("belum dinilai"),
> and it's **excluded** from the overall predikat. A santri with no scores yet shows **N/A**, never the
> lowest grade (Dha'if). Only enter a number once the pillar is actually assessed.
>
> **Halaqah & Musyrif** are defined in the **`Halaqah` tab (§2g)** — each halaqah has a free-text
> name and a single musyrif, keyed by `hal`. Only the **Mudir** stays a code constant (`MUDIR`, one
> per school) near the top of `tracker/index.html`’s `<script>`.
>
> **Progress & completion (`juzct`):** the 3-year target is **15 juz**, memorized in the fixed manhaj
> order **30, 29, 28, 27, 26 → 1, 2, … 10** — all 15 = **100%**. Over-achievers continue **11 … 25** (the
> bonus lap), so completion can reach **200%**; the ring fills **green** to 100% then turns **gold** for
> the bonus. `juzct` (col N) is a simple **count** of completed juz — because the order is fixed, the app
> knows *which* juz those are (the first `juzct` in the program) and greens them on the Peta Hafalan.
> So `juzct: 1` means "finished his first juz" (juz 30), **not** "30 juz done". The program order is a
> code constant (`PROGRAM_FULL` in `tracker/index.html`).
>
> **Current position + partial credit (`curpg`, optional):** *across* juz, page number isn't monotonic
> — the roadmap runs 30→26 then 1→10, so a low page can be *further* along than a high one; that's why
> `juzct` (not the page) drives whole-juz progress. But *within* the juz being memorized the manhaj goes
> **front-to-back**, so `curpg`'s position in that juz is a linear fraction. The ring therefore shows a
> **continuous** value: `(juzct + fraction-into-the-current-juz) / 15`. Partial credit only applies when
> `curpg` is inside the frontier juz (the next roadmap juz after the completed ones). Leave `curpg` blank
> → whole-juz steps only. Standard 604-page Madinah/Uthmani mushaf (Juz 1 = pages 1–21, then 20 pages/juz).

Example header row + first data row:

```
id  name                     nick    kota   prov        hal         haf tah mur ilm akh akd bhs juzct curpg kelas | nis      khd | wali
s1  Ahmad Fauzan Ramadhani   Fauzan  Depok  Jawa Barat  As-Shiddiq  88  91  85  85  90  84  86  8     170   VIII  | 2426001  98  | Bpk. Ramadhani
```
(A–P core · Q `nis` · R `khd` optional public · S+ private, e.g. `wali`)

---

### 2c. Tab `Nilai` (per-test records) — powers "Riwayat Nilai" & the Rapor
Fed by the **Nilai Ujian/Tes** form (Form B, §5). One row per test/exam, Islamic **or** secular.
Headers in row 1:

| id | tanggal | mapel | jenis | nilai |
|----|---------|-------|-------|-------|
| s1 | 2026-09-19 | P7 | Ujian | 84 |
| s1 | 2026-09-12 | P2 | Setoran | 88 |

- `id` matches the santri id in `Master`. **`mapel` is the Mapel `id`** (`P1`, `P2`, … — §2d), **not**
  the subject name. The subject's name **and** its bidang both come from that id, so there is no
  separate `bidang` or subject-name column to keep in sync (rename/reorder subjects freely). `nilai`
  is 0–100. *(Legacy rows that stored the subject **name** in `mapel` still resolve — the tracker
  matches by id first, then by name/alias — but new rows should use the id.)*
- **Where these rows come from:** this tab is Form B's linked response tab (walkthrough Step 4), so
  column **A is `Timestamp`** and the keys follow — that's fine, the app ignores unknown columns.
- Mirror it to the **PUBLIC** sheet as a tab named exactly `Nilai`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Nilai!A1:Z"), "where Col2 is not null", 1)`
  (`Col2` = `id`). If you instead keep a hand-built clean tab with `id` in column A, use
  `Nilai!A1:E` with `where Col1 is not null`.
- The tracker reads it automatically (same Sheet ID) → shown on each student’s detail as
  **Riwayat Nilai**, and used by the **Rapor** (report card, Admin only) together with the roster
  scores. Until the tab exists, the tracker uses built-in demo records.
- **Term scope:** the Rapor only averages `Nilai` rows whose `tanggal` falls inside the selected
  academic term. Admin picks the term from a **dropdown** on the Rapor toolbar (so past-term report
  cards print without any code change). The list of terms is the `TERMS` array near the top of
  `tracker/index.html`'s `<script>` — each entry is `{ id, label, start, end }` (dates `YYYY-MM-DD`,
  inclusive); `TERMS[0]` is the default (current) term. Add a new row each semester. **Riwayat
  Nilai** still lists the full history regardless of the selected term.

---

### 2d. Tab `Mapel` (subject definitions) — **what subjects the Rapor tracks**
The **three groups are fixed in the app** — `Tahfidz & Diniyah`, `Umum`, `Ekstrakurikuler` — but
**you decide which subjects live inside each group.** Define them here, one row per subject:

| id | bidang | mapel | alias |
|----|--------|-------|-------|
| P1 | Diniyah | Al Qur'an | |
| P2 | Diniyah | Hadis | |
| P5 | Diniyah | Akhlak & Adab | |
| P7 | Umum | Matematika | |
| P9 | Umum | IPA | Sains |
| P13 | Ekstrakurikuler | PJOK | Pendidikan Jasmani, Olahraga, dan Kesehatan |
| P15 | Ekstrakurikuler | Kewirausahaan | |

- **`id`** is a short, **stable** code you assign (`P1`, `P2`, … — any unique text works). This is
  what the `Nilai` tab stores (§2c), so you can **rename or reorder** subjects any time without
  breaking past scores. Keep it once assigned; don't reuse a retired id for a different subject.
- `bidang` **must be one of** `Diniyah` / `Umum` / `Ekstrakurikuler` (case-insensitive; `Tahfidz`,
  `Ekskul`, and the legacy `Akademik` → `Umum` also accepted). Any other value is ignored.
- `mapel` is the subject name shown on the Rapor. `alias` (optional) is a longer/alternative name;
  the tracker also accepts it when matching a `Nilai` row that stored the alias instead of the id.
- The Rapor lists **every** defined subject per group; a subject with no `Nilai` record yet shows
  `—` / *Belum dinilai*. **Akhlak** is special — define it under `Diniyah` (name contains "Akhlak")
  and it takes its score from the `akh` column in `Master` (a character credit, not a test).
- `Ekstrakurikuler` is optional: if you define no ekskul subjects, section **C** is omitted from the Rapor.
- Mirror to the **PUBLIC** sheet as a tab named exactly `Mapel`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Mapel!A1:D"), "where Col1 is not null", 1)`
- Until the tab exists, the tracker uses a built-in demo subject list.

---

### 2e. Deriving `Profil Kemampuan` (Master G–M) from the two input streams

The 7 bars/radar the app shows (**Hafalan, Tahsin, Muroja'ah, Ilmu & B. Arab, Akhlak, Umum,
Bahasa**) read the `Master` columns **G–M** *directly*. They do **not** auto-update from the forms —
you either **type** them, or **compute** them from `Setoran` (daily) + `Nilai` (tests) with the
formulas below. This is deliberate: the musyrif *decides* the semester score, informed by the data —
not a blind average that swings on one entry.

**Same file → reference tabs directly.** Keep `Master`, `Setoran`, `Nilai` in the **same PRIVATE
spreadsheet** so formulas are plain tab references (`Nilai!F:F`) — **no `IMPORTRANGE`.** (`IMPORTRANGE`
is only for the Private→Public mirror in §3.) If a stream lives in a *different* file, first pull it
into a local helper tab with `IMPORTRANGE`, then reference that tab — don't nest `IMPORTRANGE` inside
`AVERAGEIFS`.

**Assumed columns** (adjust letters to your sheet):
`Nilai` → A=`id` B=`tanggal` C=`mapel` (the **Mapel id**, §2c) D=`jenis` **E=`nilai`**.
`Setoran` → A=`id` … C=`jenis` … **F=`nilai`** = Form A's **★ 1–5 Rating**. The formulas below
**multiply it by 20** to reach the 0–100 pillar scale (5★ = 100, 4★ = 80…). If you rate with *taqdir*
letters instead, map to a number first: `=IFS(G2="Mumtaz",95,G2="Jayyid Jiddan",85,G2="Jayyid",75,G2="Maqbul",65,TRUE,"")` (and drop the ×20).

**Resolve the mapel id → bidang + subject name (helper columns).** Because `Nilai.mapel` now stores an
**id** (`P7`) rather than the bidang/name, add two helper columns to the `Nilai` tab so the formulas
can still filter by group or by subject. In the first two free columns (shown here as **G** and **H**),
row 2, fill down:
```
G (bidang):  =IF($C2="","",IFERROR(VLOOKUP($C2, Mapel!$A:$B, 2, FALSE),""))
H (subject): =IF($C2="","",IFERROR(VLOOKUP($C2, Mapel!$A:$C, 3, FALSE),""))
```
Now `Nilai!$G:$G` = the row's **bidang** and `Nilai!$H:$H` = its **subject name** — the formulas below
filter on those. *(Prefer matching the id directly? Use `Nilai!$C:$C,"P7"` for a single subject — but
the helper columns keep the group-level and keyword formulas working.)*

> ⚠️ **These column letters are illustrative — verify each field's real column in your sheet.** The
> linked form-response tabs put `Timestamp` in **A** (shift +1), so on the raw `Nilai` response tab
> `nilai` is usually **F** and `mapel` is **D**; put the `G`/`H` helpers in the first columns after your
> data. Any *optional* Setoran columns you added (`surah`, `ayat_dari`, `ayat_ke`) push `nilai`/`catatan`
> further right too. Open each tab, note the actual letter of `id`, `jenis`, `nilai`, `mapel`, and adjust.
> `$A2` always refers to **Master** col A.

**Put each formula in `Master` row 2 (first santri, id in `$A2`) and fill down.** Each returns blank
(`""`) when a santri has no matching records yet, so empty stays empty.

| Master col | Bar | Source | Formula (paste in the cell, fill down) |
|---|---|---|---|
| **G** `haf` | Hafalan | daily Ziyadah | `=IFERROR(ROUND(20*AVERAGEIFS(Setoran!$F:$F,Setoran!$A:$A,$A2,Setoran!$C:$C,"Ziyadah")),"")` |
| **I** `mur` | Muroja'ah | daily Muroja'ah | `=IFERROR(ROUND(20*AVERAGEIFS(Setoran!$F:$F,Setoran!$A:$A,$A2,Setoran!$C:$C,"Muroja'ah")),"")` |
| **L** `akd` | Umum | all Umum tests | `=IFERROR(ROUND(AVERAGEIFS(Nilai!$E:$E,Nilai!$A:$A,$A2,Nilai!$G:$G,"Umum")),"")` |
| **K** `akh` | Akhlak | — | *type manually — it's a credit, not a test* |

(`Nilai!$E:$E` = `nilai`; `Nilai!$G:$G` = the resolved **bidang** helper.)

**H `tah` (Tahsin) — blend daily + test.** 40 % daily Tahsin setoran + 60 % the Tahsin/Tajwid exam
(weights are yours; match your own subject name in `Nilai!$H`). `LET` keeps it readable and handles
either side being empty:

```
=LET(
  d, IFERROR(20*AVERAGEIFS(Setoran!$F:$F, Setoran!$A:$A, $A2, Setoran!$C:$C, "Tahsin"), ""),
  t, IFERROR(AVERAGEIFS(Nilai!$E:$E,   Nilai!$A:$A,   $A2, Nilai!$H:$H, "Tahsin & Tajwid"), ""),
  IF(AND(d="",t=""), "", ROUND(IF(d="", t, IF(t="", d, 0.4*d + 0.6*t))))
)
```

**J `ilm` and M `bhs` — average tests whose subject matches keywords.** Use this reusable
"average-where-subject-matches" pattern against the **`H` helper** (regex, so one formula covers several
subjects):

```
J (ilm  → Mutun / Bahasa Arab / Ilmu):
=IFERROR(ROUND(
  SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$H$2:$H,"Mutun|Arab|Ilmu")*Nilai!$E$2:$E)
  /SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$H$2:$H,"Mutun|Arab|Ilmu"))),"")

M (bhs  → any subject containing "Bahasa"):
=IFERROR(ROUND(
  SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$H$2:$H,"Bahasa")*Nilai!$E$2:$E)
  /SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$H$2:$H,"Bahasa"))),"")
```

> Tune the regex to your `Mapel` names (§2d). `REGEXMATCH` needs same-length ranges — use bounded
> ranges (`$H$2:$H`, `$E$2:$E`), not whole columns, inside `SUMPRODUCT`.

**Keeping the staff override.** A typed number and a formula can't share one cell. Two options:
1. **Simple:** leave the formula in G–M; to override, just type over that cell (its formula is
   replaced for that santri only). Re-paste the formula later if you want the auto value back.
2. **Auto + override (advanced):** compute into a hidden block (e.g. `Master!AA:AG` with the formulas
   above), then make each visible cell `=IF($<override>="", AA2, $<override>)` — a filled override
   column always wins, otherwise the derived value shows.

Nothing else changes: `Master!A1:R` still mirrors to the Public `Roster` (§3), and the app reads G–M
as before — now they *reflect* the daily setoran and the exams instead of being hand-typed.

#### Auto-advance `juzct` (hafalan progress) from `Setoran` — optional
`juzct` (col N) is *how many juz are completed*. You can type it (the musyrif decides when a juz is
done), **or** derive it as the count of distinct juz the santri has done **Ziyadah** on. On the linked
`Setoran` response tab the columns are `A=Timestamp B=id C=tanggal D=jenis E=juz` — put this in
`Master!` col **N**, row 2 (`$A2` = santri id), fill down:

```
=IFERROR(COUNTA(UNIQUE(FILTER(Setoran!$E:$E,(Setoran!$B:$B=$A2)*(Setoran!$D:$D="Ziyadah")*(Setoran!$E:$E<>"")))),0)
```

- Counts only **Ziyadah** (new memorization); Muroja'ah/Tahsin don't add juz. Adjust the column letters
  to your sheet.
- ⚠️ **Caveat:** this marks a juz as done as soon as **any** Ziyadah touches it — so a juz still in
  progress is counted. For a manhaj where each juz is finished before the next, that's a fine proxy. To
  count only **fully-completed** juz, submit a distinct `jenis` like `Ziyadah (Selesai)` when a juz is
  done and change `"Ziyadah"` to `"Ziyadah (Selesai)"` above.
- `curpg` (col O) is optional and separate — set it from the latest setoran page if you want the
  "currently on Juz X / Halaman Y" detail; leave blank to show the next roadmap juz from `juzct`.

---

### 2f. Tab `Absensi` (only absences) — powers the Rapor **Kehadiran** score
**Record only the days a santri is *not* present** (Sakit / Izin / Alpa). Presence is the default, so
Hadir days are **never** logged. One row per absence:

| id | tanggal | status | jam | reason |
|----|---------|--------|-----|--------|
| s3 | 2026-09-08 | Sakit | | Demam, ada surat dokter |
| s3 | 2026-10-05 | Izin | 10:30 | Pulang, acara keluarga |
| s1 | 2026-09-14 | Alpa | | Tanpa keterangan |

- `status` is **`Sakit` / `Izin` / `Alpa`** (also understood: `S`/`I`/`A`, `ijin`, `alfa`, `bolos`).
- **`jam`** (optional) — the time the santri left / fell ill, for a **mid-day** case. Blank = whole day.
  Shown next to the date on the Rapor (e.g. `2026-10-05 · 10:30`).
- **`reason`** (optional, also `alasan`/`keterangan`/`catatan`) — shown on the Rapor under
  **"Keterangan Ketidakhadiran"**.

**Fill it with the in-app quick-log (admin only).** One admin owns attendance; students report to them.
On the dashboard the admin taps **Absensi** → a slide-over where **everyone is Hadir by default** and
you only **log the absentees**: pick santri → Sakit/Izin/Alpa → optional `jam` (**Sekarang** stamps the
current time) → reason → **Simpan**. Today's absences list below. No per-mapel, no per-student marking.
- **To make Simpan write to the sheet**, the app POSTs to an **Absensi Google Form** — give its
  questions the titles `id`, `tanggal`, `status`, `jam`, `reason` (any input type works, same as the
  other forms), then paste its **pre-filled link** into **Konfigurasi** (see §5, Form C). Until then,
  entries stay in the session only. You can always fill the tab by hand / a normal form instead.
- Mirror to the **PUBLIC** sheet as a tab named exactly `Absensi`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Absensi!A1:Z"), "where Col2 is not null", 1)`
  (`Col2` = `id` if it's a form response tab with `Timestamp` in A; use `Col1` for a hand-built tab).

#### The Kehadiran **score** (`khd`) — a weighted formula that lives on the sheet
The Rapor shows a **Skor Kehadiran** = the `Master` column **`khd`** (§2b). Compute it however you
like — the point is different absence types **deduct differently** (Alpa hurts most). Put this in
`Master!` `khd` (row 2, id in `$A2`, fill down) — adjust the **weights** and the term date window:

```
=MAX(0, 100 - (
    1 * COUNTIFS(Absensi!$B:$B,$A2, Absensi!$D:$D,"Sakit", Absensi!$C:$C,">=2026-07-01", Absensi!$C:$C,"<=2026-12-31")
  + 1 * COUNTIFS(Absensi!$B:$B,$A2, Absensi!$D:$D,"Izin",  Absensi!$C:$C,">=2026-07-01", Absensi!$C:$C,"<=2026-12-31")
  + 3 * COUNTIFS(Absensi!$B:$B,$A2, Absensi!$D:$D,"Alpa",  Absensi!$C:$C,">=2026-07-01", Absensi!$C:$C,"<=2026-12-31")
))
```

- Weights here: **Sakit −1, Izin −1, Alpa −3** points per day — tune to your policy.
- Column letters assume the Absensi **form-response tab** (`Timestamp` A, `id` B, `tanggal` C, `status`
  D). Adjust to your sheet; the dates bound it to the term (match the `TERMS` window in code).
- If `khd` is **blank**, the app falls back to a simple presence % = `(hari efektif − jumlah absensi) /
  hari efektif`, where *hari efektif* is `days` in the `TERMS` array (`tracker/index.html`). So the
  weighted `khd` is the authoritative score; the fallback just keeps demos/unconfigured sheets sensible.

---

### 2g. Tab `Halaqah` (circle → musyrif) — the halaqah name lives in `Master`
The halaqah **name** is written directly in the `Master` **`hal`** column (§2b), e.g. `As-Shiddiq`. This
tab only maps each name → its **single musyrif**. One row per circle:

| nama | musyrif |
|------|---------|
| As-Shiddiq | Ustadz Salman Al-Farisi |
| Al-Khattab | Ustadz Hamzah Abdurrahman |

- `nama` **must match** the `hal` value in `Master` exactly (that's the join key). `musyrif` is the one
  teacher for that circle. The app shows **"Halaqah {nama}"** (e.g. *Halaqah As-Shiddiq*) on the santri
  card/detail/Rapor, and the **Halaqah filter** lists these names.
- A santri whose `hal` has no matching row here still shows the halaqah name — just with musyrif `—`.
- Mirror to the **PUBLIC** sheet as a tab named exactly `Halaqah`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Halaqah!A1:B"), "where Col1 is not null", 1)`
- Until the tab exists, the tracker uses a built-in demo. Add a row whenever you open a new circle or
  hire a musyrif — no code change.

---

### 2h. Auto-progress from `Setoran` pages — `Quran` reference + page grid (formula pipeline)

**Goal:** every Setoran auto-updates a santri's `juzct` + `curpg` (§2b) with **no manual editing** and
**no double-counting when inputs overlap** (two musyrif logging overlapping pages). The trick: each page
gets its own formula cell, so overlapping Ziyadah is idempotent (a page is "memorized" once) while
Muroja'ah is additive. Google's engine recomputes on every new row; the app just reads the result.

**Cell meaning** (per mushaf page): **blank** = not memorized · **0** = memorized (Ziyadah), 0 muraja'ah ·
**N** = reviewed N times. So *coverage* = non-blank pages, *strength* = the numbers.

#### (1) `Quran` reference tab — juz ↔ page ranges (auto-generated, one-time)
**Where it lives:** on the **PRIVATE / computation side** — in the *same file* that runs the `Grid` +
`Ringkasan` formulas. It's pure reference (no santri data) and the app never reads it, so it does **not**
go in the PUBLIC mirror. Because it's just three formulas, **recreate it locally** in each computation
file rather than `IMPORTRANGE`-ing it (same-file refs are faster, no cross-file dependency).

Add a tab **`Quran`**, row-1 headers `juz  hal_awal  hal_akhir`. Don't type 30 rows — generate them with
three formulas (standard 604-page Madinah mushaf: Juz 1 = 21 pages, Juz 2–29 = 20 each, Juz 30 = 23):
```
A2  =SEQUENCE(30)                                    ← juz 1..30
B2  =ARRAYFORMULA(IF(A2:A31=1, 1, 20*A2:A31-18))     ← hal_awal (1, 22, 42, …, 582)
C2  =ARRAYFORMULA(IF(A2:A31=30, 604, 20*A2:A31+1))   ← hal_akhir (21, 41, …, 604)
```

**Juz + % from a page** (`P` = any page cell, e.g. `curpg` or `hal_ke`):
```
juz    =MATCH(P, Quran!$B$2:$B$31, 1)                                    → 1..30 (Juz 30 correct too)
%-juz  =LET(j, MATCH(P, Quran!$B$2:$B$31, 1), a, INDEX(Quran!$B$2:$B$31, j),
            b, INDEX(Quran!$C$2:$C$31, j), ROUND((P-a+1)/(b-a+1)*100))   → front-to-back position
```
(e.g. `P=268` → juz **14**, % = (268−262+1)/(281−262+1) = **35%**.)

#### (2) `Grid` tab — one wide grid (pages × santri), overlap-proof
Assume the central **`Setoran`** tab (Form A responses) has **B=`id` D=`jenis` E=`hal_dari` F=`hal_ke`**
(A = Timestamp — adjust letters). In `Grid`:
- **A1** = `page`; **A2** `=SEQUENCE(604)` (pages 1–604).
- **B1** (santri ids spill across): `=TRANSPOSE(FILTER(Master!$A$2:$A, Master!$A$2:$A<>""))`
- **B2**, then **fill right** (to col AE = 30 santri buffer) and **down** to row 605:
```
=IF(COUNTIFS(Setoran!$B:$B,B$1, Setoran!$D:$D,"Ziyadah",   Setoran!$E:$E,"<="&$A2, Setoran!$F:$F,">="&$A2)=0, "",
    COUNTIFS(Setoran!$B:$B,B$1, Setoran!$D:$D,"Muroja'ah", Setoran!$E:$E,"<="&$A2, Setoran!$F:$F,">="&$A2))
```
Cell = **blank** (not memorized) · **0** (Ziyadah, 0 review) · **N** (reviewed N×). A page is covered when
`hal_dari ≤ page ≤ hal_ke`. Overlapping Ziyadah → still memorized **once** (idempotent); Muroja'ah stacks.

#### (3) `Ringkasan` tab — roll up to `juzct` + `curpg`
A 30-row helper in **program order** + one column per santri, then two summary rows.
- **A1:E1** = `urut juz awal akhir len`. **A2** `=SEQUENCE(30)`. **B2:B31** = paste `PROGRAM_FULL`
  (`30,29,28,27,26,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25`).
- **C2** `=VLOOKUP($B2,Quran!$A:$C,2,FALSE)` · **D2** `=VLOOKUP($B2,Quran!$A:$C,3,FALSE)` · **E2** `=D2-C2+1` (fill down).
- **F1** `=TRANSPOSE(FILTER(Master!$A$2:$A,Master!$A$2:$A<>""))` — santri ids.
- **F2** (pages memorized in that juz, per santri) — fill right + down to row 31:
```
=COUNTIFS(Grid!$A$2:$A$605,">="&$C2, Grid!$A$2:$A$605,"<="&$D2,
          INDEX(Grid!$B$2:$AE$605,0,MATCH(F$1,Grid!$B$1:$AE$1,0)),">=0")
```
- **F33 `juzct`** (leading run of full juz): `=IFERROR(MATCH(FALSE, ARRAYFORMULA(F2:F31>=$E2:$E31), 0)-1, 30)`
- **F34 `curpg`** (furthest page in the frontier juz):
```
=IF(F33>=30,"", LET(fr, INDEX($B$2:$B$31, F33+1),
   a, VLOOKUP(fr,Quran!$A:$C,2,FALSE), b, VLOOKUP(fr,Quran!$A:$C,3,FALSE),
   IFERROR(MAXIFS(Grid!$A$2:$A$605, INDEX(Grid!$B$2:$AE$605,0,MATCH(F$1,Grid!$B$1:$AE$1,0)),">=0",
     Grid!$A$2:$A$605,">="&a, Grid!$A$2:$A$605,"<="&b), "")))
```
(fill F33:F34 right for all santri). `>=0` counts memorized cells incl. the "0" (blanks are `""`, excluded).

#### (4) Feed `Master`
`Master!` `juzct` (col N) and `curpg` (col O), per santri row:
```
N2 =INDEX(Ringkasan!$F$33:$AZ$33, MATCH(A2, Ringkasan!$F$1:$AZ$1, 0))
O2 =INDEX(Ringkasan!$F$34:$AZ$34, MATCH(A2, Ringkasan!$F$1:$AZ$1, 0))
```
The app reads `juzct`/`curpg` → the ring, %, "N/15 Juz", and the roadmap frontier juz all update
automatically on each setoran. The app owns the ring math; the sheet only supplies these two numbers.

> **Scale:** ~30 santri in one file = 604×30 `Grid` + 30×30 `Ringkasan` COUNTIFS cells — fine for Google.
> Past ~60 santri, split the `Grid` into per-student files (each recalcs independently) and mirror their
> `juzct`/`curpg` into the central `Master`.

---

### 2i. Ayah-level accuracy — `Surah` reference (optional, sharpens the %)

A page is coarse — a santri can start/stop **mid-page**, so page-only % rounds to whole pages. If a
setoran carries **`surah` + `ayat_ke`**, we can pin the position to the exact ayah. The trick avoids the
giant 6,236-row layout: give every ayah a **global index 1…6236** (running count across the whole
Qur'an), then `surah:ayah` → one number → its juz and its position within that juz. Only **two small
tables** — all lives on the **PRIVATE / computation side** (§2h), never PUBLIC.

#### (A) `Surah` tab (114 rows) — ayah counts + global start index
Headers `no  nama  jml_ayah  idx_awal`. **A2** `=SEQUENCE(114)`. Paste the `nama,jml_ayah` block below
into **B2** then *Data → Split text to columns → comma*. **D2** (fill down) `=SUM($C$2:C2)-C2+1` — the
global index of that surah's ayah 1 (Surah 1 → 1, Surah 2 → 8, …).
```
Al-Fatihah,7
Al-Baqarah,286
Ali 'Imran,200
An-Nisa,176
Al-Ma'idah,120
Al-An'am,165
Al-A'raf,206
Al-Anfal,75
At-Tawbah,129
Yunus,109
Hud,123
Yusuf,111
Ar-Ra'd,43
Ibrahim,52
Al-Hijr,99
An-Nahl,128
Al-Isra,111
Al-Kahf,110
Maryam,98
Ta-Ha,135
Al-Anbiya,112
Al-Hajj,78
Al-Mu'minun,118
An-Nur,64
Al-Furqan,77
Ash-Shu'ara,227
An-Naml,93
Al-Qasas,88
Al-'Ankabut,69
Ar-Rum,60
Luqman,34
As-Sajdah,30
Al-Ahzab,73
Saba,54
Fatir,45
Ya-Sin,83
As-Saffat,182
Sad,88
Az-Zumar,75
Ghafir,85
Fussilat,54
Ash-Shura,53
Az-Zukhruf,89
Ad-Dukhan,59
Al-Jathiyah,37
Al-Ahqaf,35
Muhammad,38
Al-Fath,29
Al-Hujurat,18
Qaf,45
Adh-Dhariyat,60
At-Tur,49
An-Najm,62
Al-Qamar,55
Ar-Rahman,78
Al-Waqi'ah,96
Al-Hadid,29
Al-Mujadila,22
Al-Hashr,24
Al-Mumtahanah,13
As-Saff,14
Al-Jumu'ah,11
Al-Munafiqun,11
At-Taghabun,18
At-Talaq,12
At-Tahrim,12
Al-Mulk,30
Al-Qalam,52
Al-Haqqah,52
Al-Ma'arij,44
Nuh,28
Al-Jinn,28
Al-Muzzammil,20
Al-Muddaththir,56
Al-Qiyamah,40
Al-Insan,31
Al-Mursalat,50
An-Naba,40
An-Nazi'at,46
'Abasa,42
At-Takwir,29
Al-Infitar,19
Al-Mutaffifin,36
Al-Inshiqaq,25
Al-Buruj,22
At-Tariq,17
Al-A'la,19
Al-Ghashiyah,26
Al-Fajr,30
Al-Balad,20
Ash-Shams,15
Al-Layl,21
Ad-Duha,11
Ash-Sharh,8
At-Tin,8
Al-'Alaq,19
Al-Qadr,5
Al-Bayyinah,8
Az-Zalzalah,8
Al-'Adiyat,11
Al-Qari'ah,11
At-Takathur,8
Al-'Asr,3
Al-Humazah,9
Al-Fil,5
Quraysh,4
Al-Ma'un,7
Al-Kawthar,3
Al-Kafirun,6
An-Nasr,3
Al-Masad,5
Al-Ikhlas,4
Al-Falaq,5
An-Nas,6
```
(The `jml_ayah` column sums to **6236** — a quick `=SUM(C2:C115)` check.)

#### (B) Extend the `Quran` juz tab with ayah boundaries (30 rows)
Add three columns to `Quran` (§2h): `juz_surah  juz_ayat  idx_juz`. Paste the `surah,ayat` block into
**D2:E31**, then **F2** (fill down) `=VLOOKUP(D2, Surah!$A:$D, 4, FALSE) + E2 - 1` — the global index of
each juz's first ayah.
```
1,1      7,5,82    13,12,53  19,25,21  25,41,47
2,142    8,6,111   14,15,1   20,27,56  26,46,1
2,253    9,7,88    15,17,1   21,29,46  27,51,31
3,93     10,8,41   16,18,75  22,33,31  28,58,1
4,24     11,9,93   17,21,1   23,36,28  29,67,1
4,148    12,11,6   18,23,1   24,39,32  30,78,1
```
*(Read top-to-bottom, left-to-right = juz 1…30. Each entry is `surah,ayat` — e.g. juz 12 = `11,6` = Hud:6.)*

> ⚠️ **Verify these 30 boundaries against your mushaf.** The ayah-counts (A) are certain, but a single
> off-by-one juz boundary misplaces the %. Ideally cross-check with a trusted Qur'an metadata source.

#### (C) Formulas — `surah:ayah` → juz + sharp %
```
global index of (surah S, ayat A):  =VLOOKUP(S, Surah!$A:$D, 4, FALSE) + A - 1
juz:                                =MATCH(gIdx, Quran!$F$2:$F$31, 1)
% of juz (ayah-precise):            =LET(g, gIdx, j, MATCH(g, Quran!$F$2:$F$31,1),
                                          a, INDEX(Quran!$F$2:$F$31, j),
                                          b, IF(j=30, 6237, INDEX(Quran!$F$2:$F$31, j+1)),
                                          ROUND((g-a+1)/(b-a)*100))
```

#### (D) Plug into progress
In `Ringkasan` (§2h), when a setoran's frontier row has `surah`+`ayat_ke`, use the **ayah-precise %**
above for the current-juz fraction; otherwise fall back to the **page %** from the `Quran` juz table.
`juzct` (whole juz done) still comes from the page `Grid` — the ayah refinement only sharpens the
*fraction of the juz currently in progress*, which is exactly where mid-page precision matters.

---

## 3. PUBLIC sheet — the reference (mirror)

Create a **second** spreadsheet (e.g. **"RTA Tracker — PUBLIC"**). It contains **one tab named
exactly `Roster`** with a single formula in cell **A1** that mirrors the public columns of Private:

```
=QUERY(
  IMPORTRANGE("<PRIVATE_SHEET_ID>", "Master!A1:R"),
  "where Col1 is not null",
  1
)
```

- Replace `<PRIVATE_SHEET_ID>` with the id from the Private sheet URL:
  `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
- `Master!A1:R` imports **only** the public columns (16 core + the optional `nis`/`khd`) — private
  columns (S+) are never referenced, so they can never leak. (Use `A1:P` if you use neither optional column.)
- `where Col1 is not null` drops blank rows; the trailing `1` keeps the header row.
- **First run:** the cell shows `#REF!` with an **"Allow access"** button — click it once to
  authorize the Private→Public link. After that it stays in sync automatically.

> Prefer to reorder/rename in the mirror? Use an explicit select (`select Col1, Col2, … Col18 where
> Col1 is not null`). Column order does not matter to the tracker (it matches by header name), but the
> headers must stay exactly `id, name, nick, …, juzct, curpg, kelas` (plus `nis` if used).

---

## 4. Share settings (this is what makes it private)

| Sheet | Share as | Who can edit |
|-------|----------|--------------|
| **PRIVATE** | Restricted — invite staff only | Admin / Mudir / Musyrif |
| **PUBLIC**  | **Anyone with the link → Viewer** | **Staff only** (never public) |

⚠️ **Never give the public Edit access.** Anyone who can *edit* the Public sheet could add their own
`IMPORTRANGE` and pull the *entire* Private sheet (the Private→Public authorization is granted at the
sheet-pair level once). Viewer-only for the public; edit rights stay with staff.

`IMPORTRANGE` runs on your one-time authorization, independent of who is viewing — that is exactly
what lets a public viewer see data derived from a sheet they cannot open.

---

## 5. Write path — **three custom input forms** (all POST via a pre-filled link)

All three inputs are **custom in-app forms** — the tracker draws its own beautiful UI and **POSTs** to a
hidden Google Form. Nobody ever opens the Google Forms; they're just write-endpoints. So each is
configured with a **pre-filled link** (which carries the field `entry.####` IDs the app needs):

| In-app form | Where | Config value |
|-------------|-------|--------------|
| **A — Setoran Harian** | **+ Input** toggle | **pre-filled link** |
| **B — Nilai Ujian/Tes** | **+ Input** toggle | **pre-filled link** |
| **C — Absensi** | admin **Absensi** button | **pre-filled link** |

For **each** form: build a Google Form whose questions are titled exactly like the keys below (any
question type works — nobody fills it by hand), link it to the Private sheet and rename its response
tab, then paste its **pre-filled link** into the matching row of the **`Config`** tab (§6).

> **Building the pre-fill (the app reads the entry IDs from it):** in the form, **⋮ → Get pre-filled
> link**, fill **every** field with any example value **in the order listed below** (`id`=`s1`,
> `tanggal`=`2026-07-10`, `jenis`=`Ziyadah`, `juz`=`1`, …), then **Get link** and copy the URL. The
> app maps each `entry.### → field` **by position**, so **keep your form questions in this order**.
> *(Order-independent alternative: put a `__KEY__` sentinel in a field — `__HAL_DARI__`, `__NILAI__`, … — and
> that field is matched by name regardless of position.)* Only **`id`** and **`tanggal`** are required.

**Form A — Setoran Harian** (daily; Musyrif & Mudir). Question titles = the keys:

| Question title | Type (any) | Pre-fill value |
|----------------|------------|----------------|
| `id`      | Short answer / Dropdown | `__ID__` |
| `tanggal` | Short answer / Date | `__TANGGAL__` (or any date if Date type) |
| `jenis`   | Short answer / Multiple choice | `__JENIS__` |
| `hal_dari` | Short answer *(absolute page 1–604 — **required**)* | `__HAL_DARI__` |
| `hal_ke`  | Short answer *(absolute page; blank = one page)* | `__HAL_KE__` |
| `surah`   | Short answer *(optional — sharpens %)* | `__SURAH__` |
| `ayat_dari` | Short answer *(optional)* | `__AYAT_DARI__` |
| `ayat_ke` | Short answer *(optional)* | `__AYAT_KE__` |
| `nilai`   | Short answer *(the app sends the ★1–5 rating as a number)* | `__NILAI__` |
| `catatan` | Short answer *(optional)* | `__CATATAN__` |

No `juz` field — the juz derives from `hal_dari`. `hal_dari`/`hal_ke` are the **absolute mushaf page**
(1–604), the primary progress driver (see §2h). Surah/ayat are optional accuracy only.

The app's Setoran form has a **★1–5 rating picker** for `nilai`, a jenis selector, and the surah/ayat
fields — shown on the Riwayat Setoran card as **`QS 11:6–24`** / **`QS 11:41`** / **`QS 11 · 1 surah
penuh`** (see §2a). Only **`id`** and **`tanggal`** are required in the pre-fill for the app to accept it.

The app shows surah + ayat on the Riwayat Setoran card as **`QS 11:6–24`** (range), **`QS 11:41`**
(single ayat → set `ayat_dari` = `ayat_ke`), or **`QS 11 · 1 surah penuh`** when `surah` is filled but
both ayat fields are blank (whole surah). Question titles can be `ayat_dari`/`ayat_ke` or the friendlier
`Ayat Dari`/`Ayat Ke` and `No. Surah` — the app accepts both.

→ Link to the **Private** spreadsheet → rename the response tab to **`Setoran`** (§2a).

**Form B — Nilai Ujian/Tes** (periodic; Mudir for Diniyah, guru for Umum). Titles = keys:

| Question title | Type (any) | Pre-fill value |
|----------------|------------|----------------|
| `id`      | Short answer / Dropdown | `__ID__` |
| `tanggal` | Short answer / Date | `__TANGGAL__` |
| `mapel`   | **Short answer** *(holds the Mapel id, e.g. `P7`)* | `__MAPEL__` |
| `jenis`   | Short answer | `__JENIS__` |
| `nilai`   | Short answer | `__NILAI__` |

No `bidang` field — the **`mapel`** value is the Mapel **id** (`P1`, `P2`, …, §2c/§2d), and both the
subject name and its bidang derive from it. In the app's Nilai form, teachers pick **bidang → subject**
from friendly names (filled from your `Mapel` tab), and it submits the id. → Link to the Private sheet →
rename its response tab to **`Nilai`** (§2c).

**Form C — Absensi** *(§2f)*. Titles = keys: `id`, `tanggal`, `status`, `jam`, `reason`. → Link →
rename response tab to **`Absensi`**. For the pre-fill, Absensi is extra-forgiving — you can use the
`__KEY__` sentinels **or** a **real example** (`id`=`s1`, `tanggal`=`2026-07-10`, `status`=`Izin`,
`jam`=`15:00`, `reason`=anything); the app detects fields by value pattern too.

> **Pre-fill tips (all three forms)**
> - **`id`** in the pre-fill must be a bare id like `s1` (or `__ID__`) — the app sends the santri id.
> - A **`Date`** question can't hold `__TANGGAL__`; just pick any date — the app finds it by its
>   `_year` part and posts the date correctly. Same for a **`Time`** `jam` (`_hour`).
> - Only **`id`** + **`tanggal`** are required for the app to accept the link; the rest are optional.
> - ⚠️ **Publish the form and set Responders → "Anyone"** (Settings) — an org-restricted form returns
>   `401` and the POST silently fails. Email collection off, no "Limit to 1 response".

**Wire all three in the `Config` tab** (§6) — paste each **pre-filled link** into its row: `setoran`,
`nilai`, `absensi`. Konfigurasi then shows each as **✓ terhubung**.

Each is independent — configure one now and the rest later. Until set, that input shows a "belum
dikonfigurasi" prompt (Setoran/Nilai) or logs in-session only (Absensi).

## 6. Connect the tracker — the **Config sheet**

Connections are **not typed into the app** (that resets on reload/logout). Instead they live in a
**public Config sheet**, and its ID is **hard-coded once** in `tracker/index.html`
(`const CONFIG_ID = '…'`, near the top of the `<script>`). Konfigurasi in the app just **displays**
what's active — to change anything, you edit the sheet and press **↻ Muat Ulang**.

**Set it up (once):**
1. In your **PUBLIC** sheet, add a tab named exactly **`Config`** with two columns, `key` and `value`:

   | key | value |
   |-----|-------|
   | `sheet_id` | *(blank = use this same sheet for the data tabs, or paste another PUBLIC sheet ID)* |
   | `setoran`  | Setoran form **pre-filled link** (§5) |
   | `nilai`    | Nilai form **pre-filled link** (§5) |
   | `absensi`  | Absensi **pre-filled link** (§5) |

2. Put the **Config sheet's ID** into `CONFIG_ID` in the code (it can be the same public sheet that
   holds `Roster`/`Nilai`/… — then leave `sheet_id` blank).
3. Open `/tracker/` → **Masuk Staff** → **⚙️ Konfigurasi** shows each connection with a ✓/–. Data
   status flips to **Live · Google Sheet**.

From the resolved **data** Sheet ID the tracker reads six tabs via GViz — **`Roster`** (santri),
**`Nilai`** (tests), **`Mapel`** (subjects), **`Halaqah`** (circles), **`Setoran`** (daily log),
**`Absensi`** (absences) — e.g. `…/gviz/tq?tqx=out:json&headers=1&sheet=Roster`. Each tab is optional;
a missing/unreachable one shows an **empty/loading state** (it does **not** silently fall back to demo
once a sheet is configured). If the **`Config` tab** itself is missing, the app still reads the data
tabs straight from `CONFIG_ID` (forms just show "belum diisi").

> **Preview with demo data.** ⚙️ **Konfigurasi** has a **"Gunakan data contoh (demo)"** checkbox — tick
> it to render the 11 built-in sample santri (ignoring live data) so you can eyeball the UI without
> touching the sheet. It's saved in **that browser only** (localStorage), never in the Config sheet, and
> the status line reads *"Data contoh (demo) · mode preview aktif"* while it's on. Untick to return to live.

---

## 7. Security & privacy checklist

- [ ] Private sheet: restricted to staff only.
- [ ] Public sheet: **Viewer** for anyone with link; **Edit** for staff only.
- [ ] Public `Roster` imports **only** `Master!A1:R` — no private columns referenced.
- [ ] No private fields (wali, phone, address, economic status, internal notes) in columns A–R — they start at **S**.
- [ ] Tracker points at the **PUBLIC** Sheet ID, never the Private one.

### Known limitation
Keyless GViz can only read a **public** sheet, so **everyone using the tracker — including staff —
sees the same public projection.** If you later need staff to see *more inside the app* than the
public does (private notes, family/economic data), that needs an **authenticated path**
(Google Apps Script Web App with login). Today the gallery/dashboard scores are already
parent-facing, so the public projection covers them.
