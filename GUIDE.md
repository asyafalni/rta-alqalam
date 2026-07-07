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
 │  └─ tab: Master               │   one row per santri (public cols A–O + private cols P+)
 └───────────────┬───────────────┘
                 │  IMPORTRANGE (one-way, authorized once)
                 ▼
 ┌───────────────────────────────┐
 │  PUBLIC sheet   (reference)   │   "Anyone with link → Viewer"
 │  └─ tab: Roster               │   ONLY the 15 public columns, mirrored live
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

### 2a. Tab `Setoran` (raw Form responses)
Auto-created when you link the Google Form. Leave it as-is — it logs every submission
(timestamp, santri, tanggal, jenis, juz, halaman, taqdir, catatan, …).

### 2b. Tab `Master` (one row per santri) — **this is what gets mirrored**
Put the **15 public columns first (A–O)**, then any **private-only columns from P onward**.
Header names in row 1 **must be exactly** these lowercase keys (the tracker matches by header):

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
| P+ | `wali`, `nohp`, `alamat`, `status`, `catatan_musyrif`, `catatan_mudir`, … | **PRIVATE — never mirrored** | any | staff |

> The score columns (G–M) can be typed directly by staff, or computed from the `Setoran` tab
> with your own formulas. Keeping `Master` current (manual vs formula) is your choice — the
> tracker only needs this row-per-santri shape.

Example header row + first data row:

```
id  name                     nick    kota    prov         hal  haf tah mur ilm akh akd bhs juzdone            curjuz | wali
s1  Ahmad Fauzan Ramadhani   Fauzan  Depok   Jawa Barat   1    88  91  85  85  90  84  86  "1,2,3,4,5,6,7,8"  9    | Bpk. Ramadhani
```

---

## 3. PUBLIC sheet — the reference (mirror)

Create a **second** spreadsheet (e.g. **"RTA Tracker — PUBLIC"**). It contains **one tab named
exactly `Roster`** with a single formula in cell **A1** that mirrors the public columns of Private:

```
=QUERY(
  IMPORTRANGE("<PRIVATE_SHEET_ID>", "Master!A1:O"),
  "where Col1 is not null",
  1
)
```

- Replace `<PRIVATE_SHEET_ID>` with the id from the Private sheet URL:
  `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
- `Master!A1:O` imports **only** the 15 public columns — private columns (P+) are never referenced,
  so they can never leak.
- `where Col1 is not null` drops blank rows; the trailing `1` keeps the header row.
- **First run:** the cell shows `#REF!` with an **"Allow access"** button — click it once to
  authorize the Private→Public link. After that it stays in sync automatically.

> Prefer to reorder/rename in the mirror? Use an explicit select, e.g.
> `"select Col1, Col2, Col3, Col4, Col5, Col6, Col7, Col8, Col9, Col10, Col11, Col12, Col13, Col14, Col15 where Col1 is not null"`.
> Column order does not matter to the tracker (it matches by header name), but the headers must
> stay exactly `id, name, nick, …, juzdone, curjuz`.

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

## 5. Write path — the Google Form (embedded)

**Input Nilai** in the tracker **embeds your Google Form** directly (mobile-friendly, native
validation), so submissions go straight to the linked Sheet. You only need the **Form ID** — there
is no field-ID mapping to configure in code.

1. Build **one** Google Form with the questions you want (e.g. a "Jenis Input" question for
   Hafalan / Akhlak / Akademik, plus santri, tanggal, juz, nilai, catatan, …).
2. Link it to the **Private** spreadsheet: Form → **Responses** → **Link to Sheets** (creates the
   `Setoran` tab).
3. Copy the **Form ID** — the `.../forms/d/e/`**`ID`**`/viewform` part of the form's URL.
4. In the tracker: **Dashboard → ⚙️ Konfigurasi → Google Form ID** → paste it.

Now **+ Input Nilai** shows the form embedded; staff fill it on desktop or mobile and it writes to
the Sheet. (Until an ID is set, Input Nilai shows a "belum dikonfigurasi" prompt.)

## 6. Connect the tracker

1. Open `/tracker/` → **Masuk Staff** (Clerk) → on the dashboard click **⚙️ Konfigurasi**.
2. Paste the **PUBLIC** Sheet ID into **Google Sheet ID** and click **Muat Data**.
3. Status flips from *"Data contoh (demo)"* → *"Live · Google Sheet"*.

The tracker reads the tab named **`Roster`** via GViz:
`https://docs.google.com/spreadsheets/d/<PUBLIC_ID>/gviz/tq?tqx=out:json&sheet=Roster`
If unconfigured or unreachable, it falls back to the built-in demo data automatically.

---

## 7. Security & privacy checklist

- [ ] Private sheet: restricted to staff only.
- [ ] Public sheet: **Viewer** for anyone with link; **Edit** for staff only.
- [ ] Public `Roster` imports **only** `Master!A1:O` — no private columns referenced.
- [ ] No private fields (wali, phone, address, economic status, internal notes) in columns A–O.
- [ ] Tracker points at the **PUBLIC** Sheet ID, never the Private one.

### Known limitation
Keyless GViz can only read a **public** sheet, so **everyone using the tracker — including staff —
sees the same public projection.** If you later need staff to see *more inside the app* than the
public does (private notes, family/economic data), that needs an **authenticated path**
(Google Apps Script Web App with login). Today the gallery/dashboard scores are already
parent-facing, so the public projection covers them.
