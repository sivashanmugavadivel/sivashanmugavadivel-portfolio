// One-off: compress the video-preview clips into short, muted, low-res loops so
// they load fast and don't bloat the Pages deploy. Run:
//   node scripts/compress-previews.mjs
// Overwrites each public/video-previews/*.mp4 in place (originals backed up to
// video-previews/_orig/ the first time).
import { execFileSync } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import { promises as fs } from 'fs'
import path from 'path'

const DIR = 'public/video-previews'
const BACKUP = path.join(DIR, '_orig')
const DURATION = 8      // seconds kept (it loops anyway)
const HEIGHT = 640      // scaled-down height
const CRF = 30          // higher = smaller/lower quality

await fs.mkdir(BACKUP, { recursive: true })
const files = (await fs.readdir(DIR)).filter(f => /\.mp4$/i.test(f))

let before = 0, after = 0
for (const f of files) {
  const src = path.join(DIR, f)
  const bak = path.join(BACKUP, f)
  // Keep an original copy once, then always compress from the original.
  try { await fs.access(bak) } catch { await fs.copyFile(src, bak) }
  // Encode straight to the target (input is the backup copy → no conflict).
  execFileSync(ffmpegPath, [
    '-y', '-i', bak,
    '-t', String(DURATION),
    '-an',                                   // drop audio (previews are muted)
    '-vf', `scale=-2:${HEIGHT}`,
    '-c:v', 'libx264', '-crf', String(CRF), '-preset', 'veryfast',
    '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    src,
  ], { stdio: 'ignore' })
  before += (await fs.stat(bak)).size
  after += (await fs.stat(src)).size
  console.log(`${f}: ${(after / 1048576).toFixed(2)} MB`)
}
console.log(`\nTotal: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB`)
