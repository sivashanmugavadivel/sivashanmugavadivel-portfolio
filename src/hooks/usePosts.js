import { useMemo } from 'react'
import matter from 'gray-matter'

const postFiles = import.meta.glob('../data/blog/*.md', { query: '?raw', import: 'default' })

function slugFromPath(path) {
  return path.replace('../data/blog/', '').replace('.md', '')
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
  const { data: frontmatter, content } = matter(raw)
  return { slug, frontmatter, content }
}

export async function loadAllPosts() {
  const entries = await Promise.all(
    Object.entries(postFiles).map(async ([path, loader]) => {
      const raw = await loader()
      const { data: frontmatter } = matter(raw)
      return { slug: slugFromPath(path), frontmatter }
    })
  )
  return entries.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
}
