// Generate card thumbnails for the 360° panoramas. Run with:
//   node scripts/gen-pano-thumbs.mjs          (only what's missing)
//   node scripts/gen-pano-thumbs.mjs --force  (re-cut everything)
//
// Source: public/360image/<file>.jpg  →  public/360image/thumbs/<file>_thumb.jpg
//
// The panoramas themselves are 8000px equirectangular and 12–14 MB each; the
// gallery card only ever shows one small and flat, so it reads the thumb and
// leaves the full file to the 360 viewer.
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const SRC = 'public/360image'
const OUT = 'public/360image/thumbs'
const WIDTH = 1600       // ~2× the widest the card is ever drawn
const QUALITY = 72

const force = process.argv.includes('--force')

const exists = async p => !!(await fs.stat(p).catch(() => null))

const entries = await fs.readdir(SRC, { withFileTypes: true })
const files = entries
  .filter(e => e.isFile() && /\.(jpe?g|png|webp)$/i.test(e.name))
  .map(e => e.name)

await fs.mkdir(OUT, { recursive: true })

let done = 0, skipped = 0, orig = 0, saved = 0
for (const name of files) {
  const base = name.replace(/\.[^.]+$/, '')
  const outPath = path.join(OUT, `${base}_thumb.jpg`)
  if (!force && (await exists(outPath))) { skipped++; continue }
  const inPath = path.join(SRC, name)
  await sharp(inPath, { failOn: 'none' })
    .resize({ width: WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(outPath)
  orig += (await fs.stat(inPath)).size
  saved += (await fs.stat(outPath)).size
  done++
  console.log(`thumb → ${path.basename(outPath)}`)
}

if (skipped) console.log(`Skipped ${skipped} that already had a thumb (use --force to re-cut)`)
console.log(`Generated ${done} thumb(s) → ${OUT}`)
if (done) {
  console.log(`Source: ${(orig / 1048576).toFixed(1)} MB  →  Thumbs: ${(saved / 1048576).toFixed(2)} MB`)
}
