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
 │  ├─ tab: Master               │   one row per santri (public A–U · private V+)
 │  ├─ tab: Nilai                │   one row per test (Diniyah/Akademik/Ekstrakurikuler)
 │  └─ tab: Mapel                │   subject definitions per group (bidang, mapel)
 └───────────────┬───────────────┘
                 │  IMPORTRANGE (one-way, authorized once)
                 ▼
 ┌───────────────────────────────┐
 │  PUBLIC sheet   (reference)   │   "Anyone with link → Viewer"
 │  ├─ tab: Roster               │   public columns A–U only, mirrored live
 │  ├─ tab: Nilai                │   per-test scores, mirrored live
 │  ├─ tab: Mapel                │   subject definitions, mirrored live
 │  └─ tab: Setoran              │   daily log (id,tanggal,jenis,juz,…), mirrored live
 └───────────────┬───────────────┘
                 │  GViz JSON (no API key)
                 ▼
          Tracker  /tracker/   ← paste the PUBLIC Sheet ID here
```

**Rule of thumb:** nothing originates in Public. Public only *mirrors* a safe subset of Private.
Everything shown in Public also exists in Private.

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
these headers: `id, tanggal, jenis, juz, halaman, catatan`. Mirror a clean projection of the raw
responses into it — reshape/QUERY the form columns and map `santri → id`, e.g.
`=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Setoran!A1:H"), "select ... where Col2 is not null", 1)`.
`jenis` colours by keyword (Ziyadah = green, Muroja'ah = gold, Tahsin/other = blue). Until the tab
exists, the tracker uses built-in demo setoran. Keep it parent-safe — no private notes here.

> Add a **`nilai`** column (daily quality 0–100) to Form A too — the app card ignores it, but the
> §2e formulas use it to compute the Hafalan / Muroja'ah / Tahsin pillars.

### 2b. Tab `Master` (one row per santri) — **this is what gets mirrored**
Put the **public columns first** — 16 core (A–P) plus the optional Q–U — then any
**private-only columns from V onward**. Header names in row 1 **must be exactly** these lowercase
keys (the tracker matches by header):

| Col | Header | Meaning | Type | Filled by |
|-----|--------|---------|------|-----------|
| A | `id`   | unique santri id (`s1`, `s2`, …) | text | staff |
| B | `name` | full name | text | staff |
| C | `nick` | nickname / panggilan | text | staff |
| D | `kota` | city | text | staff |
| E | `prov` | province | text | staff |
| F | `hal`  | halaqah number | number | staff |
| G | `haf`  | Hafalan (0–100) | number | Musyrif/Mudir |
| H | `tah`  | Tahsin — tajwid+kelancaran (0–100) | number | Musyrif/Mudir |
| I | `mur`  | Muroja'ah (0–100) | number | Musyrif/Mudir |
| J | `ilm`  | Ilmu & Bahasa Arab — mutun+mufrodat (0–100) | number | Musyrif/Mudir |
| K | `akh`  | Akhlak (0–100) | number | Musyrif/Mudir |
| L | `akd`  | Akademik — math/IPA/… (0–100) | number | **Admin** |
| M | `bhs`  | Bahasa — Indonesia/Inggris (0–100) | number | **Admin** |
| N | `juzdone` | which juz are memorized — a list in any order, e.g. `1,2,3,28,29,30` (juz count & progress derive from it) | text | Musyrif/Mudir |
| O | `curjuz` | juz **currently** being memorized (1–30; independent — many start from Juz 30 back) | number | Musyrif/Mudir |
| P | `kelas` | class level, e.g. `VII` / `VIII` | text | staff |
| Q–U | `nis`, `hadir`, `sakit`, `izin`, `alpa` | **optional, public** — shown on the **Rapor** (NIS in the header; Hadir/Sakit/Izin/Alpa as the Kehadiran table). Safe to expose — the report card is parent-facing. Leave blank/omit to skip; the app then shows NIS as `—` and hides the Kehadiran table. | text/number | staff |
| V+ | `wali`, `nohp`, `alamat`, `status`, `catatan_musyrif`, `catatan_mudir`, … | **PRIVATE — never mirrored** | any | staff |

> ⚠️ **Q–U are reserved for the optional public fields above.** Even if you don't use them, start any
> **private** columns at **V** — the mirror (§3) imports `A:U`, so anything in Q–U becomes public.

> The score columns (G–M) are what the app's **Profil Kemampuan** radar/bars read. Type them
> directly, **or** compute them from `Setoran` (daily) + `Nilai` (tests) — see **§2e** for the
> exact, copy-paste formulas per pillar. Keeping `Master` current (manual vs formula) is your
> choice — the tracker only needs this row-per-santri shape.
>
> **Musyrif & Mudir** are set in code, not the sheet: edit the `HALAQAH` map
> (halaqah → list of musyrif names; add names as you hire) and the `MUDIR`
> constant near the top of `tracker/index.html`’s `<script>`.

Example header row + first data row:

```
id  name                     nick    kota   prov        hal haf tah mur ilm akh akd bhs juzdone           curjuz kelas | nis      hadir sakit izin alpa | wali
s1  Ahmad Fauzan Ramadhani   Fauzan  Depok  Jawa Barat  1   88  91  85  85  90  84  86  "1,2,3,4,5,6,7,8" 9      VIII  | 2426001  60    0     0    0    | Bpk. Ramadhani
```
(A–P core · Q–U optional public · V+ private, e.g. `wali`)

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
- Mirror it to the **PUBLIC** sheet as a second tab named exactly `Nilai`:
  `=QUERY(IMPORTRANGE("<PRIVATE_SHEET_ID>","Nilai!A1:F"), "where Col1 is not null", 1)`
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
`Setoran` → A=`id` … C=`jenis` … **F=`nilai`** (daily quality 0–100; add this column to Form A. The
app's Riwayat card ignores it — it's only for these formulas). If daily uses *taqdir* letters instead
of a number, add a numeric column: `=IFS(G2="Mumtaz",95,G2="Jayyid Jiddan",85,G2="Jayyid",75,G2="Maqbul",65,TRUE,"")`.

**Put each formula in `Master` row 2 (first santri, id in `$A2`) and fill down.** Each returns blank
(`""`) when a santri has no matching records yet, so empty stays empty.

| Master col | Bar | Source | Formula (paste in the cell, fill down) |
|---|---|---|---|
| **G** `haf` | Hafalan | daily Ziyadah | `=IFERROR(ROUND(AVERAGEIFS(Setoran!$F:$F,Setoran!$A:$A,$A2,Setoran!$C:$C,"Ziyadah")),"")` |
| **I** `mur` | Muroja'ah | daily Muroja'ah | `=IFERROR(ROUND(AVERAGEIFS(Setoran!$F:$F,Setoran!$A:$A,$A2,Setoran!$C:$C,"Muroja'ah")),"")` |
| **L** `akd` | Akademik | all Akademik tests | `=IFERROR(ROUND(AVERAGEIFS(Nilai!$F:$F,Nilai!$A:$A,$A2,Nilai!$C:$C,"Akademik")),"")` |
| **K** `akh` | Akhlak | — | *type manually — it's a credit, not a test* |

**H `tah` (Tahsin) — blend daily + test.** 40 % daily Tahsin setoran + 60 % the "Tahsin & Tajwid"
exam (weights are yours). `LET` keeps it readable and handles either side being empty:

```
=LET(
  d, IFERROR(AVERAGEIFS(Setoran!$F:$F, Setoran!$A:$A, $A2, Setoran!$C:$C, "Tahsin"), ""),
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

Nothing else changes: `Master!A1:U` still mirrors to the Public `Roster` (§3), and the app reads G–M
as before — now they *reflect* the daily setoran and the exams instead of being hand-typed.

---

## 3. PUBLIC sheet — the reference (mirror)

Create a **second** spreadsheet (e.g. **"RTA Tracker — PUBLIC"**). It contains **one tab named
exactly `Roster`** with a single formula in cell **A1** that mirrors the public columns of Private:

```
=QUERY(
  IMPORTRANGE("<PRIVATE_SHEET_ID>", "Master!A1:U"),
  "where Col1 is not null",
  1
)
```

- Replace `<PRIVATE_SHEET_ID>` with the id from the Private sheet URL:
  `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
- `Master!A1:U` imports **only** the public columns (16 core + the optional nis/attendance) —
  private columns (V+) are never referenced, so they can never leak. (Use `A1:P` if you're not using
  the optional Q–U columns at all.)
- `where Col1 is not null` drops blank rows; the trailing `1` keeps the header row.
- **First run:** the cell shows `#REF!` with an **"Allow access"** button — click it once to
  authorize the Private→Public link. After that it stays in sync automatically.

> Prefer to reorder/rename in the mirror? Use an explicit select (`select Col1, Col2, … Col21 where
> Col1 is not null`). Column order does not matter to the tracker (it matches by header name), but the
> headers must stay exactly `id, name, nick, …, juzdone, curjuz, kelas` (plus `nis, hadir, sakit,
> izin, alpa` if used).

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

## 5. Write path — **two** Google Forms (embedded)

Input has two cadences, so use **two separate forms** — cleaner data, cleaner to maintain, and each
can have its own responders. Both embed in the tracker (mobile-friendly, native validation); you
only need each **Form ID** — no field-ID mapping in code. In the tracker, **+ Input** opens a
slide-over with a **Setoran Harian / Nilai Ujian-Tes** toggle, each showing its own embedded form.

**Form A — Setoran Harian** (daily / frequent; Musyrif & Mudir)
1. Questions e.g. santri, tanggal, jenis setoran (Ziyadah / Muroja'ah / Tahsin / Akhlak), juz,
   halaman, kualitas/nilai, catatan.
2. Link to the **Private** spreadsheet → creates the **`Setoran`** tab (§2a). Use it to keep the
   `Master` hafalan/juz columns current (manual or formula).

**Form B — Nilai Ujian/Tes** (periodic: weekly → 6-monthly; Mudir for Diniyah, guru for Akademik)
1. Questions: santri, tanggal, **bidang** (Diniyah / Akademik / Ekstrakurikuler), **mapel**
   (match §2d), jenis ujian (Ulangan Harian / UTS / UAS …), **nilai** (0–100), catatan.
2. Link to the **Private** spreadsheet → responses feed the **`Nilai`** tab (§2c) — reshape/QUERY
   into the `id, tanggal, bidang, mapel, jenis, nilai` columns the tracker reads.

3. Copy each **Form ID** — the `.../forms/d/e/`**`ID`**`/viewform` part of the URL.
4. In the tracker: **Dashboard → ⚙️ Konfigurasi → Google Form** → paste both IDs
   (**Form Setoran Harian** and **Form Nilai Ujian/Tes**).

Each toggle shows a "belum dikonfigurasi" prompt until its Form ID is set — you can configure just
one and add the other later.

## 6. Connect the tracker

1. Open `/tracker/` → **Masuk Staff** (Clerk) → on the dashboard click **⚙️ Konfigurasi**.
2. Paste the **PUBLIC** Sheet ID into **Google Sheet ID** and click **Muat Data**.
3. Status flips from *"Data contoh (demo)"* → *"Live · Google Sheet"*.

From that **one** Public Sheet ID the tracker reads four tabs via GViz — **`Roster`** (santri),
**`Nilai`** (tests), **`Mapel`** (subjects), **`Setoran`** (daily log) — e.g.
`https://docs.google.com/spreadsheets/d/<PUBLIC_ID>/gviz/tq?tqx=out:json&sheet=Roster`
Each tab is optional: any that's missing or unreachable falls back to built-in demo data automatically.

---

## 7. Security & privacy checklist

- [ ] Private sheet: restricted to staff only.
- [ ] Public sheet: **Viewer** for anyone with link; **Edit** for staff only.
- [ ] Public `Roster` imports **only** `Master!A1:U` — no private columns referenced.
- [ ] No private fields (wali, phone, address, economic status, internal notes) in columns A–U — they start at **V**.
- [ ] Tracker points at the **PUBLIC** Sheet ID, never the Private one.

### Known limitation
Keyless GViz can only read a **public** sheet, so **everyone using the tracker — including staff —
sees the same public projection.** If you later need staff to see *more inside the app* than the
public does (private notes, family/economic data), that needs an **authenticated path**
(Google Apps Script Web App with login). Today the gallery/dashboard scores are already
parent-facing, so the public projection covers them.
