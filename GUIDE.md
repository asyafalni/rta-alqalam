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
 │  ├─ tab: Nilai                │   one row per test (Diniyah/Akademik/Ekstrakurikuler)
 │  ├─ tab: Mapel                │   subject definitions per group (bidang, mapel)
 │  ├─ tab: Halaqah              │   circle names + musyrif (hal, nama, musyrif)
 │  └─ tab: Absensi              │   one row per absence (id, tanggal, status, …)
 └───────────────┬───────────────┘
                 │  IMPORTRANGE (one-way, authorized once)
                 ▼
 ┌───────────────────────────────┐
 │  PUBLIC sheet   (reference)   │   "Anyone with link → Viewer"
 │  ├─ tab: Roster               │   public columns A–R only, mirrored live
 │  ├─ tab: Nilai                │   per-test scores, mirrored live
 │  ├─ tab: Mapel                │   subject definitions, mirrored live
 │  ├─ tab: Halaqah              │   circle names + musyrif, mirrored live
 │  ├─ tab: Setoran              │   daily log (id,tanggal,jenis,juz,…), mirrored live
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
   `id  name  nick  kota  prov  hal  haf  tah  mur  ilm  akh  akd  bhs  juzdone  curpg  kelas`
   then optionally `nis`. *(`curpg` = current page 1–604 on the standard mushaf; the app derives the
   juz, within-juz progress, and pages-left — §2b.)*
4. Fill one row per santri from row 2. Give each a **short unique `id`** (`s1`, `s2`, …) — this id is
   how every other tab links to the student, so keep it stable. Put private data (wali, phone, …)
   **from column R onward** (see the ⚠️ in §2b).

### Step 3 — Add the `Mapel` and `Halaqah` tabs
1. Bottom-left **＋** to add a tab → name it **`Mapel`**. Row 1: `bidang` , `mapel`. List your
   subjects, one per row (which `bidang` values are allowed → **§2d**).
2. Add another tab → **`Halaqah`**. Row 1: `hal  nama  musyrif` — one row per circle, e.g.
   `1 · Umar bin Khattab · Ustadz Salman Al-Farisi` (§2g). `hal` matches the `hal` column in `Master`.

> **Those are the only tabs you create by hand.** The `Setoran`, `Nilai`, and (optional) `Absensi`
> tabs are **created automatically** when you link their forms in Step 4 — do **not** pre-create empty
> versions, or you'll end up with duplicates. (Prefer to hand-build `Absensi` instead of a form?
> Then add it here with row 1 `id  tanggal  status  jam  reason` — §2f.)

### Step 4 — Build the input Forms (→ §5)
For **each** form: **New → Google Forms** inside the folder.

**Form A — `Setoran Harian`** (daily). Add questions, and **title them exactly**:
`id`, `tanggal`, `jenis`, `juz`, `halaman`, `catatan`, and optionally `nilai` (daily quality 0–100,
used by the §2e formulas).
- Make **`id`** a **Dropdown** question whose options are your santri ids (`s1`, `s2`, …) — this
  prevents typos and keeps the link to `Master` exact.
- Make **`tanggal`** a **Date** question; **`jenis`** a Dropdown (`Ziyadah` / `Muroja'ah` / `Tahsin`).

**Form B — `Nilai Ujian/Tes`** (exams). Title the questions exactly:
`id`, `tanggal`, `bidang`, `mapel`, `jenis`, `nilai`.
- **`id`** Dropdown (same santri ids). **`bidang`** Dropdown (`Diniyah` / `Akademik` /
  `Ekstrakurikuler`). **`mapel`** Dropdown of the subjects you listed in `Mapel`. **`nilai`** short
  answer (0–100).

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
   - **`Mapel`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Mapel!A1:B"),"where Col1 is not null",1)`
   - **`Halaqah`** → `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Halaqah!A1:C"),"where Col1 is not null",1)`
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

### Step 7 — Connect the tracker (→ §6)
1. Open `/tracker/` → **Masuk Staff** (log in via Clerk) → on the dashboard, **⚙️ Konfigurasi**.
2. Paste the **PUBLIC** Sheet ID into **Google Sheet ID** → **Muat Data**. Status flips to
   **Live · Google Sheet**.
3. Paste the two **Form IDs** into **Form Setoran Harian** and **Form Nilai Ujian/Tes**, and the
   **Absensi pre-filled link** into **Absensi** (§5, Form C).

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
daily submission (timestamp, santri, tanggal, jenis, juz, halaman, taqdir, catatan, …). Use it to
keep the `Master` hafalan/juz columns current. (Periodic exam scores go through a *separate* form
into the `Nilai` tab — see §2c and §5.)

**Show the daily log in-app (optional):** the tracker renders a **Riwayat Setoran Harian** card on
each student's detail (10 most recent) if it finds a **public** tab named exactly `Setoran` with
these headers: `id, tanggal, jenis, juz, halaman, catatan` (plus optional `surah, ayat_dari, ayat_ke`
and the daily `nilai` ★ rating). If you titled Form A's questions with the
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
| F | `hal`  | halaqah key — a number/id that links the santri to the **`Halaqah`** tab (§2g) for the circle's name + musyrif | number | staff |
| G | `haf`  | Hafalan (0–100) | number | Musyrif/Mudir |
| H | `tah`  | Tahsin — tajwid+kelancaran (0–100) | number | Musyrif/Mudir |
| I | `mur`  | Muroja'ah (0–100) | number | Musyrif/Mudir |
| J | `ilm`  | Ilmu & Bahasa Arab — mutun+mufrodat (0–100) | number | Musyrif/Mudir |
| K | `akh`  | Akhlak (0–100) | number | Musyrif/Mudir |
| L | `akd`  | Akademik — math/IPA/… (0–100) | number | **Admin** |
| M | `bhs`  | Bahasa — Indonesia/Inggris (0–100) | number | **Admin** |
| N | `juzdone` | which juz are memorized — a list in any order, e.g. `1,2,3,28,29,30` (juz count & progress derive from it) | text | Musyrif/Mudir |
| O | `curpg` | **current page** (1–604) on the standard Madinah/Uthmani mushaf. The app derives the current juz, the position within it, and "≈ N pages left to finish the juz". | number | Musyrif/Mudir |
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
> **Halaqah & Musyrif** are defined in the **`Halaqah` tab (§2g)** — each halaqah has a free-text
> name and a single musyrif, keyed by `hal`. Only the **Mudir** stays a code constant (`MUDIR`, one
> per school) near the top of `tracker/index.html`’s `<script>`.
>
> **Tracking by page (`curpg`):** the app assumes the standard 604-page Madinah/Uthmani mushaf
> (Juz 1 = pages 1–21, then 20 pages/juz). Enter the page a santri is currently on and it computes
> the current juz, the position within that juz, and how many pages remain to finish it — a far
> better signal than a juz number alone.
>
> **Program & completion (`juzdone`):** the 3-year target is **15 juz**, memorized in the manhaj order
> **30, 29, 28, 27, 26 → 1, 2, … 10** — all 15 = **100%**. Over-achievers continue **11 … 25** (a
> second lap), so completion can reach **200%**; the progress bar fills **green** to 100% then overlays
> **gold** for the bonus. `juzdone` (col N) is the source — list the juz a santri has memorized; the
> count and % derive from it. The program order is a code constant (`PROGRAM` in `tracker/index.html`).

Example header row + first data row:

```
id  name                     nick    kota   prov        hal haf tah mur ilm akh akd bhs juzdone           curpg kelas | nis      khd | wali
s1  Ahmad Fauzan Ramadhani   Fauzan  Depok  Jawa Barat  1   88  91  85  85  90  84  86  "1,2,3,4,5,6,7,8" 170   VIII  | 2426001  98  | Bpk. Ramadhani
```
(A–P core · Q `nis` · R `khd` optional public · S+ private, e.g. `wali`)

---

### 2c. Tab `Nilai` (per-test records) — powers "Riwayat Nilai" & the Rapor
Fed by the **Nilai Ujian/Tes** form (Form B, §5). One row per test/exam, Islamic **or** secular.
Headers in row 1:

| id | tanggal | bidang | mapel | jenis | nilai |
|----|---------|--------|-------|-------|-------|
| s1 | 2026-09-19 | Akademik | Matematika | Ujian | 84 |
| s1 | 2026-09-12 | Diniyah | Tahsin & Tajwid | Setoran | 88 |

- `id` matches the santri id in `Master`. `bidang` = **`Diniyah`**, **`Akademik`**, or
  **`Ekstrakurikuler`** (one of the three fixed groups — see §2d). `mapel` must match a subject you
  defined in the `Mapel` tab. `nilai` is 0–100.
- **Where these rows come from:** this tab is Form B's linked response tab (walkthrough Step 4), so
  column **A is `Timestamp`** and the keys follow — that's fine, the app ignores unknown columns.
- Mirror it to the **PUBLIC** sheet as a tab named exactly `Nilai`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Nilai!A1:Z"), "where Col2 is not null", 1)`
  (`Col2` = `id`). If you instead keep a hand-built clean tab with `id` in column A, use
  `Nilai!A1:F` with `where Col1 is not null`.
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
The **three groups are fixed in the app** — `Tahfidz & Diniyah`, `Akademik`, `Ekstrakurikuler` — but
**you decide which subjects live inside each group.** Define them here, one row per subject:

| bidang | mapel |
|--------|-------|
| Diniyah | Tahfidz (Ziyadah) |
| Diniyah | Tahsin & Tajwid |
| Diniyah | Akhlak |
| Akademik | Matematika |
| Akademik | IPA (Sains) |
| Ekstrakurikuler | Teknologi Informasi (IT) |
| Ekstrakurikuler | Kewirausahaan |

- `bidang` **must be one of** `Diniyah` / `Akademik` / `Ekstrakurikuler` (case-insensitive; `Tahfidz`,
  `Ekskul` also accepted). Any other value is ignored.
- `mapel` is the subject name shown on the Rapor — spell it **exactly** as you'll type it in the
  `Nilai` tab (the tracker matches subject to score by this text).
- The Rapor lists **every** defined subject per group; a subject with no `Nilai` record yet shows
  `—` / *Belum dinilai*. **`Akhlak`** is special — define it under `Diniyah` and it takes its score
  from the `akh` column in `Master` (it's a character credit, not a test).
- `Ekstrakurikuler` is optional: if you define no ekskul subjects, section **C** is omitted from the Rapor.
- Mirror to the **PUBLIC** sheet as a tab named exactly `Mapel`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Mapel!A1:B"), "where Col1 is not null", 1)`
- Until the tab exists, the tracker uses a built-in demo subject list.

---

### 2e. Deriving `Profil Kemampuan` (Master G–M) from the two input streams

The 7 bars/radar the app shows (**Hafalan, Tahsin, Muroja'ah, Ilmu & B. Arab, Akhlak, Akademik,
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
`Nilai` → A=`id` B=`tanggal` C=`bidang` D=`mapel` E=`jenis` **F=`nilai`**.
`Setoran` → A=`id` … C=`jenis` … **F=`nilai`** = Form A's **★ 1–5 Rating**. The formulas below
**multiply it by 20** to reach the 0–100 pillar scale (5★ = 100, 4★ = 80…). If you rate with *taqdir*
letters instead, map to a number first: `=IFS(G2="Mumtaz",95,G2="Jayyid Jiddan",85,G2="Jayyid",75,G2="Maqbul",65,TRUE,"")` (and drop the ×20).

> ⚠️ **These column letters are illustrative — verify each field's real column in your sheet.** The
> linked form-response tabs put `Timestamp` in **A** (shift +1), and any *optional* Setoran columns you
> added (`surah`, `ayat_dari`, `ayat_ke`) push `nilai`/`catatan` further right. Open the tab, note the
> actual letter of `id`, `jenis`, `nilai`, `mapel`, etc., and adjust the formulas — or copy just the
> needed columns into a clean helper tab first. `$A2` always refers to **Master** col A.

**Put each formula in `Master` row 2 (first santri, id in `$A2`) and fill down.** Each returns blank
(`""`) when a santri has no matching records yet, so empty stays empty.

| Master col | Bar | Source | Formula (paste in the cell, fill down) |
|---|---|---|---|
| **G** `haf` | Hafalan | daily Ziyadah | `=IFERROR(ROUND(20*AVERAGEIFS(Setoran!$F:$F,Setoran!$A:$A,$A2,Setoran!$C:$C,"Ziyadah")),"")` |
| **I** `mur` | Muroja'ah | daily Muroja'ah | `=IFERROR(ROUND(20*AVERAGEIFS(Setoran!$F:$F,Setoran!$A:$A,$A2,Setoran!$C:$C,"Muroja'ah")),"")` |
| **L** `akd` | Akademik | all Akademik tests | `=IFERROR(ROUND(AVERAGEIFS(Nilai!$F:$F,Nilai!$A:$A,$A2,Nilai!$C:$C,"Akademik")),"")` |
| **K** `akh` | Akhlak | — | *type manually — it's a credit, not a test* |

**H `tah` (Tahsin) — blend daily + test.** 40 % daily Tahsin setoran + 60 % the "Tahsin & Tajwid"
exam (weights are yours). `LET` keeps it readable and handles either side being empty:

```
=LET(
  d, IFERROR(20*AVERAGEIFS(Setoran!$F:$F, Setoran!$A:$A, $A2, Setoran!$C:$C, "Tahsin"), ""),
  t, IFERROR(AVERAGEIFS(Nilai!$F:$F,   Nilai!$A:$A,   $A2, Nilai!$D:$D, "Tahsin & Tajwid"), ""),
  IF(AND(d="",t=""), "", ROUND(IF(d="", t, IF(t="", d, 0.4*d + 0.6*t))))
)
```

**J `ilm` and M `bhs` — average tests whose `mapel` matches keywords.** Use this reusable
"average-where-mapel-matches" pattern (regex, so one formula covers several subjects):

```
J (ilm  → Mutun / Bahasa Arab / Ilmu):
=IFERROR(ROUND(
  SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$D$2:$D,"Mutun|Arab|Ilmu")*Nilai!$F$2:$F)
  /SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$D$2:$D,"Mutun|Arab|Ilmu"))),"")

M (bhs  → any subject containing "Bahasa"):
=IFERROR(ROUND(
  SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$D$2:$D,"Bahasa")*Nilai!$F$2:$F)
  /SUMPRODUCT((Nilai!$A$2:$A=$A2)*REGEXMATCH(Nilai!$D$2:$D,"Bahasa"))),"")
```

> Tune the regex to your `Mapel` names (§2d). `REGEXMATCH` needs same-length ranges — use bounded
> ranges (`$D$2:$D`, `$F$2:$F`), not whole columns, inside `SUMPRODUCT`.

**Keeping the staff override.** A typed number and a formula can't share one cell. Two options:
1. **Simple:** leave the formula in G–M; to override, just type over that cell (its formula is
   replaced for that santri only). Re-paste the formula later if you want the auto value back.
2. **Auto + override (advanced):** compute into a hidden block (e.g. `Master!AA:AG` with the formulas
   above), then make each visible cell `=IF($<override>="", AA2, $<override>)` — a filled override
   column always wins, otherwise the derived value shows.

Nothing else changes: `Master!A1:R` still mirrors to the Public `Roster` (§3), and the app reads G–M
as before — now they *reflect* the daily setoran and the exams instead of being hand-typed.

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

### 2g. Tab `Halaqah` (circle definitions) — free-text names + one musyrif each
Give each halaqah a **name** and a **single musyrif**. One row per circle:

| hal | nama | musyrif |
|-----|------|---------|
| 1 | Umar bin Khattab | Ustadz Salman Al-Farisi |
| 2 | Abu Bakar Ash-Shiddiq | Ustadz Hamzah Abdurrahman |

- `hal` matches the **`hal`** value in `Master` (the santri's halaqah). `nama` is the circle's name —
  the app shows **"Halaqah {nama}"** (e.g. *Halaqah Umar bin Khattab*), so type the name only. `musyrif`
  is the one teacher for that circle.
- Used on each santri's detail + Rapor, and the **Halaqah filter** shows these names.
- Mirror to the **PUBLIC** sheet as a tab named exactly `Halaqah`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Halaqah!A1:C"), "where Col1 is not null", 1)`
- Until the tab exists, the tracker uses a built-in demo. Add a row whenever you open a new circle or
  hire a musyrif — no code change.

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
> headers must stay exactly `id, name, nick, …, juzdone, curpg, kelas` (plus `nis` if used).

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

## 5. Write path — **three** input forms

There are **three** input forms, wired in **Konfigurasi → 📝 Google Form**:

| Form | How the app uses it | Config field |
|------|---------------------|--------------|
| **A — Setoran Harian** | **Embedded** (+ Input toggle) — humans fill it | **Form ID** |
| **B — Nilai Ujian/Tes** | **Embedded** (+ Input toggle) — humans fill it | **Form ID** |
| **C — Absensi** | **Background write endpoint** — the app POSTs to it from the Absensi screen | **pre-filled link** |

Forms A & B embed in the tracker (mobile-friendly, native validation); you only need each **Form ID**.
Form C is never opened by a human — the app writes to it — so instead of a Form ID you paste its
**pre-filled link** (see Form C below). In the tracker, **+ Input** opens a slide-over with a
**Setoran Harian / Nilai Ujian-Tes** toggle; **Absensi** is its own admin-only button.

> **Title each question exactly like the column key** (`id`, `tanggal`, `nilai`, …) and the form's
> linked response tab is already app-ready — no reshaping (see the walkthrough's "one trick").

**Form A — Setoran Harian** (daily / frequent; Musyrif & Mudir). Question titles **must be exactly** the key:

| Question title | Google Forms type | Required | Options / validation |
|----------------|-------------------|----------|----------------------|
| `id`      | **Dropdown**        | ✅ | options = the bare santri ids: `s1`, `s2`, … (see note below) |
| `tanggal` | **Date**            | ✅ | date picker (leave *Include time* off) |
| `jenis`   | **Multiple choice** | ✅ | `Ziyadah` · `Muroja'ah` · `Tahsin` |
| `juz`     | **Short answer**    | ✅ | Response validation → **Number → Between 1 and 30** |
| `halaman` | **Short answer**    | ✅ | e.g. `hal. 3–4` or `205` |
| `surah`   | **Short answer**    | ⬜ | *optional* — surah no.; Response validation → **Number → Between 1 and 114** |
| `ayat_dari` | **Short answer**  | ⬜ | *optional* — first ayat (**Number**) |
| `ayat_ke` | **Short answer**    | ⬜ | *optional* — last ayat (**Number**); a single ayat → same value as `ayat_dari` |
| `nilai`   | **Rating** (★ 1–5)  | ✅ | daily quality, 1–5 stars — shown as ★ on the Riwayat Setoran card (scale ×20 for §2e) |
| `catatan` | **Paragraph**       | ⬜ | free note |

The app shows surah + ayat on the Riwayat Setoran card as **`QS 11:6–24`** (range), **`QS 11:41`**
(single ayat → set `ayat_dari` = `ayat_ke`), or **`QS 11 · 1 surah penuh`** when `surah` is filled but
both ayat fields are blank (whole surah). Question titles can be `ayat_dari`/`ayat_ke` or the friendlier
`Ayat Dari`/`Ayat Ke` and `No. Surah` — the app accepts both.

→ Link to the **Private** spreadsheet → rename the response tab to **`Setoran`** (§2a).

**Form B — Nilai Ujian/Tes** (periodic: weekly → 6-monthly; Mudir for Diniyah, guru for Akademik):

| Question title | Google Forms type | Required | Options / validation |
|----------------|-------------------|----------|----------------------|
| `id`      | **Dropdown**        | ✅ | the bare santri ids |
| `tanggal` | **Date**            | ✅ | date picker |
| `bidang`  | **Multiple choice** | ✅ | `Diniyah` · `Akademik` · `Ekstrakurikuler` |
| `mapel`   | **Dropdown**        | ✅ | the subjects you listed in the `Mapel` tab (§2d) |
| `jenis`   | **Multiple choice** | ✅ | `Tes / Kuis` · `UTS` · `UAS` · `Praktik` · … |
| `nilai`   | **Short answer**    | ✅ | Response validation → **Number → Between 0 and 100** |

→ Link to the **Private** spreadsheet → rename the response tab to **`Nilai`** (§2c). No reshape
needed — the app reads by header and ignores the `Timestamp` column.

**Form C — Absensi** *(optional; §2f)*. **Nobody ever opens this form** — the admin uses the app's own
**Absensi** screen; the form is just the invisible **write endpoint** the app POSTs to. The app handles
Date/Time correctly (splitting them the way Google expects), so use the **same input types as Forms
A/B** — consistent, and the raw sheet gets clean typed data:

| Question title | Google Forms type | Required | Notes |
|----------------|-------------------|----------|-------|
| `id`      | **Dropdown**        | ✅ | the bare santri ids |
| `tanggal` | **Date**            | ✅ | date picker |
| `status`  | **Multiple choice** | ✅ | `Sakit` · `Izin` · `Alpa` (only absences are recorded) |
| `jam`     | **Time**            | ⬜ | mid-day time |
| `reason`  | **Paragraph**       | ⬜ | why absent |

→ Link to the **Private** spreadsheet → rename the response tab to **`Absensi`**.

**Wire it to the app (one paste):** in the form, **⋮ → Get pre-filled link**, then fill it with any
recognisable values — `id` = pick any santri, `tanggal` = pick any date, `status` = pick any status,
`jam` = pick any time, `reason` = type **`__REASON__`** (or leave blank) — **Get link**, and paste that
URL into **Konfigurasi → Absensi (pre-filled link)**. The app auto-detects each field (the Date field
by its `_year` part, Time by `_hour`, `status` by its value, `reason` by the sentinel, and `id` = the
remaining one) — **no per-field IDs to copy**. Konfigurasi shows **✓ Form absensi terhubung** when it
parsed. *(Prefer Short answer everywhere with `__ID__`/`__TANGGAL__`/… sentinels? That still works too.
Or just type the tab by hand — the quick-log logs in-session regardless.)*

> **Field-type tips**
> - **Dropdown vs Multiple choice:** use a **Dropdown** for long lists (`id`, `mapel`); **Multiple
>   choice** (radio buttons) for short fixed lists (`jenis`, `bidang`, `status`) — faster to tap on mobile.
> - **`id` options must be the bare id** (`s3`), **not** `s3 — Zaid` — the value is matched against
>   `Master` exactly. Keep a printed id↔name cheat-sheet for staff, or add a separate (ignored) "nama" question.
> - **Number validation** lives at the question's **⋮ menu → Response validation → Number → Between**.
> - **Always use the `Date` type for `tanggal`** (not short answer) — it stores a real date the app parses.
> - Turn on **Required** for `id`, `tanggal`, and the value field (`nilai`/`status`).
> - Titles are matched case-insensitively, so `Tanggal` also works — but keep them lowercase for clarity.

**Wire all three in Konfigurasi** — **Dashboard → ⚙️ Konfigurasi → 📝 Google Form:**
1. **Form Setoran Harian** → paste Form A's **Form ID** (`.../forms/d/e/`**`ID`**`/viewform`).
2. **Form Nilai Ujian/Tes** → paste Form B's **Form ID**.
3. **Absensi — pre-filled link** → paste Form C's **pre-filled link** (built as described above). It
   shows **✓ Form absensi terhubung** once parsed.

Each is independent — configure one now and the rest later. Until set, that input shows a "belum
dikonfigurasi" prompt (Setoran/Nilai) or logs in-session only (Absensi).

## 6. Connect the tracker

1. Open `/tracker/` → **Masuk Staff** (Clerk) → on the dashboard click **⚙️ Konfigurasi**.
2. Paste the **PUBLIC** Sheet ID into **Google Sheet ID** and click **Muat Data**.
3. Status flips from *"Data contoh (demo)"* → *"Live · Google Sheet"*.

From that **one** Public Sheet ID the tracker reads six tabs via GViz — **`Roster`** (santri),
**`Nilai`** (tests), **`Mapel`** (subjects), **`Halaqah`** (circles), **`Setoran`** (daily log),
**`Absensi`** (absences) — e.g.
`https://docs.google.com/spreadsheets/d/<PUBLIC_ID>/gviz/tq?tqx=out:json&sheet=Roster`
Each tab is optional: any that's missing or unreachable falls back to built-in demo data automatically.

4. In the same **Konfigurasi → 📝 Google Form** card, wire the **three input forms** — two **Form IDs**
   (Setoran, Nilai) + the **Absensi pre-filled link** (§5).

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
