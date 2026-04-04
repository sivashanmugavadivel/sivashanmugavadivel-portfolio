import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/* ── Auto-scan public/gallery/ subfolders and write src/data/gallery.json ──
   Drop images into public/gallery/<category>/ — no manual JSON editing needed.
   Supported formats: jpg, jpeg, png, webp, avif, gif
*/
function galleryAutoScan() {
  const GALLERY_DIR = path.resolve('public/gallery')
  const OUT_FILE    = path.resolve('src/data/gallery.json')
  const IMG_EXT     = /\.(jpg|jpeg|png|webp|avif|gif)$/i

  function scan() {
    if (!fs.existsSync(GALLERY_DIR)) return

    const entries = []

    // Each subfolder = one category
    const categories = fs.readdirSync(GALLERY_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const category of categories) {
      const catDir = path.join(GALLERY_DIR, category)
      const files = fs.readdirSync(catDir).filter(f => IMG_EXT.test(f))

      for (const file of files) {
        const stat = fs.statSync(path.join(catDir, file))
        entries.push({
          filename: file,
          category,
          // caption defaults to filename without extension — user can override manually
          caption: path.basename(file, path.extname(file)).replace(/[-_]/g, ' '),
          date: stat.mtime.toISOString().slice(0, 10),
        })
      }
    }

    // Sort newest first
    entries.sort((a, b) => b.date.localeCompare(a.date))

    fs.writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2))
    console.log(`[gallery] Scanned ${entries.length} images across ${categories.length} categories → gallery.json`)
  }

  return {
    name: 'gallery-auto-scan',
    buildStart() { scan() },
    configureServer(server) {
      scan()
      // Watch gallery dir and all subfolders (depth:1 = one level of subfolders)
      server.watcher.add(GALLERY_DIR)
      // Re-scan on: new image added, image deleted, new folder created, folder deleted
      const rescan = f => { if (f.startsWith(path.resolve(GALLERY_DIR))) scan() }
      server.watcher.on('add',       rescan)
      server.watcher.on('unlink',    rescan)
      server.watcher.on('addDir',    rescan)
      server.watcher.on('unlinkDir', rescan)
    },
  }
}

export default defineConfig({
  plugins: [react(), galleryAutoScan()],
  base: '/',
})
