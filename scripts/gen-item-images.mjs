/**
 * Builds src/data/itemImages.json from the files in public/mygarage/items.
 *
 * Naming convention: "<product name>_<n>.<ext>" — e.g. "insta360 x5_1.jpg",
 * "insta360 x5_2.jpg". Everything before the final "_<n>" is the product name,
 * matched loosely against the accessory names in config.json (case, spaces and
 * punctuation are ignored), so the files can stay named however is convenient.
 *
 * The images are left in public/ and served verbatim — this only records which
 * files exist, so nothing gets copied or hashed twice into the build.
 *
 * Runs automatically before `npm run dev` and `npm run build`. Add or remove
 * images and the next start picks them up; no code changes needed.
 */

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const IMAGE_DIR = join(root, 'public', 'mygarage', 'items')
const OUT_FILE = join(root, 'src', 'data', 'itemImages.json')
const PUBLIC_PREFIX = 'mygarage/items'
const EXTS = /\.(jpe?g|png|webp|avif|gif)$/i

/** Loose key so "SADDLE STAY..." and "Saddle Stay with..." land in the same bucket. */
const keyOf = name => name.toLowerCase().replace(/[^a-z0-9]/g, '')

let files = []
try {
  files = readdirSync(IMAGE_DIR).filter(f => EXTS.test(f))
} catch {
  console.warn(`[item-images] no ${PUBLIC_PREFIX} directory — writing an empty manifest`)
}

const groups = {}
for (const file of files) {
  const base = file.replace(EXTS, '')
  // Trailing "_<n>" is the sequence number; without one the image sorts first
  const match = base.match(/^(.*?)_(\d+)$/)
  const [name, order] = match ? [match[1], Number(match[2])] : [base, 0]
  const key = keyOf(name)
  ;(groups[key] ||= []).push({ order, file })
}

const manifest = {}
for (const key of Object.keys(groups).sort()) {
  manifest[key] = groups[key]
    .sort((a, b) => a.order - b.order || a.file.localeCompare(b.file))
    .map(e => `${PUBLIC_PREFIX}/${e.file}`)
}

mkdirSync(dirname(OUT_FILE), { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n')

const total = Object.values(manifest).reduce((n, list) => n + list.length, 0)
console.log(`[item-images] ${total} image(s) across ${Object.keys(manifest).length} product(s)`)
