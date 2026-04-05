export function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

export function getGreeting() {
  const map = {
    morning:   'Good morning 👋',
    afternoon: 'Good afternoon ☀️',
    evening:   'Good evening 🌙',
    night:     'Good night 🌟',
  }
  return map[getTimeOfDay()]
}
