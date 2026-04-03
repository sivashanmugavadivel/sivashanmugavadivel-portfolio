import { useMemo } from 'react'

const postFiles = import.meta.glob('../data/blog/*.md', { query: '?raw', import: 'default' })

function slugFromPath(path) {
  return path.replace('../data/blog/', '').replace('.md', '')
}

// Lightweight browser-safe frontmatter parser (replaces gray-matter)
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
    // Parse arrays like ["a", "b"] or [a, b]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
    } else {
      val = val.replace(/^["']|["']$/g, '')
    }
    data[key] = val
  }
  return { data, content }
}

export function usePosts() {
  const posts = useMemo(() => {
    return Object.entries(postFiles).map(([path, _loader]) => {
      const slug = slugFromPath(path)
      return { slug, _loader, path }
    })
  }, [])

  return posts
}

export async function loadPost(slug) {
  const entry = Object.entries(postFiles).find(([path]) =>
    path.includes(`/${slug}.md`)
  )
  if (!entry) return null
  const raw = await entry[1]()
  const { data: frontmatter, content } = parseFrontmatter(raw)
  return { slug, frontmatter, content }
}

export async function loadAllPosts() {
  const entries = await Promise.all(
    Object.entries(postFiles).map(async ([path, loader]) => {
      const raw = await loader()
      const { data: frontmatter } = parseFrontmatter(raw)
      return { slug: slugFromPath(path), frontmatter }
    })
  )
  return entries.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
}
