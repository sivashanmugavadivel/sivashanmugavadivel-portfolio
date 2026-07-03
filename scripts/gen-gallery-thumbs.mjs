// One-off: generate small thumbnails of the gallery photos for lightweight use
// (e.g. the home-page 3D sphere). Run with:  node scripts/gen-gallery-thumbs.mjs
// Source: public/gallery/<category>/<file>  →  public/gallery-thumbs/<category>/<file>.jpg
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'

const SRC = 'public/gallery'
const OUT = 'public/gallery-thumbs'
const WIDTH = 360        // plenty for small sphere tiles
const QUALITY = 70

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...(await walk(p)))
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) files.push(p)
  }
  return files
}

const files = await walk(SRC)
let done = 0, saved = 0, orig = 0
let failed = 0
for (const file of files) {
  const rel = path.relative(SRC, file)
  const outPath = path.join(OUT, rel).replace(/\.(png|webp)$/i, '.jpg')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  try {
    await sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width: WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(outPath)
    orig += (await fs.stat(file)).size
    saved += (await fs.stat(outPath)).size
    done++
  } catch (e) {
    failed++
    console.warn('skip (unreadable):', rel, '-', e.message)
  }
}
if (failed) console.log(`Skipped ${failed} unreadable image(s)`)
console.log(`Generated ${done} thumbs → ${OUT}`)
console.log(`Original: ${(orig / 1048576).toFixed(1)} MB  →  Thumbs: ${(saved / 1048576).toFixed(1)} MB`)
