#!/usr/bin/env node
/**
 * build-gallery.cjs — keeps the home-page "Galeri Kegiatan" carousel in sync
 * with whatever images live in assets/img/.
 *
 * Run:  node tools/build-gallery.cjs
 *
 * What it does:
 *  1. If `sharp` is installed, converts any .jpg/.jpeg/.png in assets/img/ to a
 *     compressed .webp (quality 82, max width 1600) and removes the original.
 *     (No sharp? It just skips conversion and tells you which files to convert.)
 *  2. Regenerates assets/img/manifest.json = the sorted list of .webp files.
 *     The carousel fetches this at runtime, so adding a .webp + re-running this
 *     script is all it takes for a new photo to appear.
 */
const fs = require('fs');
const path = require('path');

const IMGDIR = path.join(__dirname, '..', 'assets', 'img');
const MANIFEST = path.join(IMGDIR, 'manifest.json');
const Q = 82, MAXW = 1600;

let sharp = null;
try { sharp = require('sharp'); } catch (_) {}

async function main() {
  const files = fs.readdirSync(IMGDIR);
  const raster = files.filter(f => /\.(jpe?g|png)$/i.test(f));
  const toConvert = [];

  for (const f of raster) {
    const base = f.replace(/\.[^.]+$/, '');
    // clean name: prefer a YYYY-MM-DD found in the filename, else a slug
    const m = base.match(/(\d{4}-\d{2}-\d{2})/);
    const out = (m ? m[1] : base.replace(/[^a-z0-9]+/gi, '-').toLowerCase()) + '.webp';
    if (fs.existsSync(path.join(IMGDIR, out))) continue; // already have a webp
    if (!sharp) { toConvert.push(f); continue; }
    await sharp(path.join(IMGDIR, f))
      .resize({ width: MAXW, withoutEnlargement: true })
      .webp({ quality: Q })
      .toFile(path.join(IMGDIR, out));
    fs.unlinkSync(path.join(IMGDIR, f));
    console.log(`converted ${f} -> ${out}`);
  }

  if (toConvert.length) {
    console.log('\n[!] sharp not installed — these were NOT converted:');
    toConvert.forEach(f => console.log('    ' + f));
    console.log('    Install once with `npm i sharp` and re-run, or convert to .webp by any tool.\n');
  }

  const webps = fs.readdirSync(IMGDIR).filter(f => /\.webp$/i.test(f)).sort();
  fs.writeFileSync(MANIFEST, JSON.stringify(webps, null, 2) + '\n');
  console.log(`manifest.json → ${webps.length} image(s):`);
  webps.forEach(w => console.log('    ' + w));
}

main().catch(e => { console.error(e); process.exit(1); });
