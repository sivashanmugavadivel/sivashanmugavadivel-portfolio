import { useMemo } from 'react'

const mdFiles   = import.meta.glob('../data/blog/*.md',   { query: '?raw', import: 'default' })
const jsonFiles = import.meta.glob('../data/blog/*.json', { eager: true })

function slugFromPath(path, ext) {
  return path.replace(`../data/blog/`, '').replace(ext, '')
}

// Lightweight browser-safe frontmatter parser
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const yamlBlock = match[1]
  const content = match[2].trim()
  const data = {}
  for (const line of yamlBlock.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let val = line.slice(colonIdx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
    } else {
      val = val.replace(/^["']|["']$/g, '')
    }
    data[key] = val
  }
  return { data, content }
}

// Extract frontmatter fields from a JSON post object
function jsonToFrontmatter(data) {
  const { sections, coverImage, cookTime, difficulty, servings, location, duration, author, ...frontmatter } = data
  return {
    frontmatter,
    sections: sections || [],
    meta: { coverImage, cookTime, difficulty, servings, location, duration, author },
  }
}

export function usePosts() {
  const posts = useMemo(() => {
    return Object.entries(mdFiles).map(([path, _loader]) => ({
      slug: slugFromPath(path, '.md'), _loader, path,
    }))
  }, [])
  return posts
}

export async function loadPost(slug) {
  // Try JSON first
  const jsonEntry = Object.entries(jsonFiles).find(([path]) => path.includes(`/${slug}.json`))
  if (jsonEntry) {
    const raw = jsonEntry[1].default ?? jsonEntry[1]
    const { frontmatter, sections, meta } = jsonToFrontmatter(raw)
    return { slug, frontmatter, sections, meta, _source: 'json' }
  }

  // Fall back to MD
  const mdEntry = Object.entries(mdFiles).find(([path]) => path.includes(`/${slug}.md`))
  if (!mdEntry) return null
  const raw = await mdEntry[1]()
  const { data: frontmatter, content } = parseFrontmatter(raw)
  return { slug, frontmatter, content, _source: 'md' }
}

export async function loadAllPosts() {
  // Load MD posts
  const mdPosts = await Promise.all(
    Object.entries(mdFiles).map(async ([path, loader]) => {
      const raw = await loader()
      const { data: frontmatter } = parseFrontmatter(raw)
      return { slug: slugFromPath(path, '.md'), frontmatter, _source: 'md' }
    })
  )

  // Load JSON posts (already parsed by Vite — eager: true)
  const jsonPosts = Object.entries(jsonFiles).map(([path, mod]) => {
    const raw = mod.default ?? mod
    const { frontmatter } = jsonToFrontmatter(raw)
    return { slug: slugFromPath(path, '.json'), frontmatter, _source: 'json' }
  })

  // Merge — JSON wins on slug collision (deduplicate)
  const seen = new Set()
  const all = [...jsonPosts, ...mdPosts].filter(p => {
    if (seen.has(p.slug)) return false
    seen.add(p.slug)
    return true
  })

  return all.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
}
