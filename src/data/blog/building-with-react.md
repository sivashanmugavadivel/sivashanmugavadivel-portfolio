---
title: "Building Modern UIs with React and Framer Motion"
date: "2025-04-01"
tags: ["react", "animation", "framer-motion"]
excerpt: "Animations make interfaces feel alive. Here's how I approach motion design in React using Framer Motion — from simple transitions to scroll-triggered sequences."
---

# Building Modern UIs with React and Framer Motion

Animation is one of the most powerful tools in a web developer's toolkit. When done well, motion makes an interface feel responsive, alive, and intentional. When done poorly, it just gets in the way.

## Why Framer Motion?

Framer Motion is my go-to animation library for React because it:

- Keeps animation logic close to the component
- Has a beautifully simple API (`whileHover`, `whileInView`, `AnimatePresence`)
- Handles complex orchestration like stagger and layout animations with minimal code

## The Patterns I Use Most

### 1. Scroll-triggered reveals

```jsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-80px' }}
  transition={{ duration: 0.6 }}
>
  Content that fades in on scroll
</motion.div>
```

### 2. Staggered children

```jsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}
```

### 3. Page transitions with AnimatePresence

```jsx
<AnimatePresence mode="wait">
  <motion.div key={location.pathname} initial={...} animate={...} exit={...}>
    <Routes />
  </motion.div>
</AnimatePresence>
```

## Final Thoughts

The best animations are the ones users don't consciously notice — they just make everything feel smoother and more natural. Start subtle, and always respect `prefers-reduced-motion`.
