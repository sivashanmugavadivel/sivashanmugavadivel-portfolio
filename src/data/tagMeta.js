export const TAG_COLORS = {
  recipe: '#f59e0b',
  breakfast: '#10b981',
  'high-protein': '#3b82f6',
  healthy: '#22c55e',
  shrimp: '#f97316',
  react: '#61dafb',
  design: '#a78bfa',
  animation: '#ec4899',
  tech: '#6366f1',
  travel: '#06b6d4',
  nature: '#84cc16',
  places: '#14b8a6',
  lifestyle: '#f43f5e',
  fitness: '#8b5cf6',
  food: '#f59e0b',
  lunch: '#ef4444',
  dinner: '#a855f7',
}

export const TAG_ICONS = {
  recipe: '🍳',
  breakfast: '🌅',
  'high-protein': '💪',
  healthy: '🥗',
  shrimp: '🦐',
  react: '⚛️',
  design: '🎨',
  animation: '✨',
  tech: '💻',
  travel: '✈️',
  nature: '🌿',
  places: '📍',
  lifestyle: '🌟',
  fitness: '🏋️',
  food: '🍽️',
  lunch: '🥘',
  dinner: '🍜',
}

export const tagColor = tag => TAG_COLORS[tag] || '#7c3aed'
export const tagIcon = tags => {
  for (const t of tags) if (TAG_ICONS[t]) return TAG_ICONS[t]
  return '📝'
}
