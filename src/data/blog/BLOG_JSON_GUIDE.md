# Blog Post JSON Guide

Drop a `.json` file in `src/data/blog/` to create a new blog post. No code changes needed.

---

## Top-Level Fields

| Field | Required | Description |
|---|---|---|
| `slug` | ✅ | URL-friendly ID — must match the filename (e.g. `my-post.json` → `"slug": "my-post"`) |
| `title` | ✅ | Post title shown in card and detail page |
| `date` | ✅ | Format: `"YYYY-MM-DD"` — used for sorting |
| `tags` | ✅ | Array of tags — controls icon and accent color |
| `excerpt` | ✅ | Short summary shown on card back and detail page callout |
| `author` | ✅ | Shown in footer of detail page |
| `cookTime` | ⬜ | Recipe: shown as meta pill (e.g. `"15 min"`) |
| `difficulty` | ⬜ | Recipe: shown as meta pill (e.g. `"Easy"`) |
| `servings` | ⬜ | Recipe: shown as meta pill (e.g. `"2"`) |
| `location` | ⬜ | Travel: shown as meta pill (e.g. `"Ooty, Tamil Nadu"`) |
| `duration` | ⬜ | Travel: shown as meta pill (e.g. `"2 days"`) |

---

## Available Tags

| Tag | Color | Icon |
|---|---|---|
| `recipe` | Amber | 🍳 |
| `breakfast` | Emerald | 🌅 |
| `high-protein` | Blue | 💪 |
| `healthy` | Green | 🥗 |
| `shrimp` | Orange | 🦐 |
| `travel` | Cyan | ✈️ |
| `nature` | Lime | 🌿 |
| `places` | Teal | 📍 |
| `lifestyle` | Rose | 🌟 |
| `fitness` | Purple | 🏋️ |
| `food` | Amber | 🍽️ |
| `react` | Cyan | ⚛️ |
| `design` | Violet | 🎨 |
| `tech` | Indigo | 💻 |

> To add a new tag, edit `src/data/tagMeta.js` and add one line each to `TAG_COLORS` and `TAG_ICONS`.

---

## Section Types

Every post has a `sections` array. Sections render in order — mix and match any types.

---

### `text`
Prose content. Supports markdown (`**bold**`, `*italic*`, `[links](url)`, etc.)

```json
{
  "type": "text",
  "body": "This is a paragraph. Supports **bold**, *italic*, and [links](https://example.com)."
}
```

---

### `image`
Single image block. Supports alignment and size control.

```json
{
  "type": "image",
  "src": "/blog/photos/my-photo.jpg",
  "alt": "Description of image",
  "caption": "Optional caption below image",
  "align": "center",
  "size": "full",
  "maxHeight": 420
}
```

**`align` options** — standalone image block:

| Value | Behaviour |
|---|---|
| `"left"` | Image pushed to left, 60% wide |
| `"center"` | Image centered, full width (default) |
| `"right"` | Image pushed to right, 60% wide |

**`float` option** — text wraps around image (use instead of `align`):

| Value | Behaviour |
|---|---|
| `"left"` | Image floats left, text wraps on the right |
| `"right"` | Image floats right, text wraps on the left |

> When using `float`, place the image section **just before** a `text` section so the text wraps around it.

**`size` options:**

| Value | Width |
|---|---|
| `"small"` | 30% |
| `"medium"` | 50% |
| `"large"` | 75% |
| `"full"` | 100% (default) |
| `"400px"` | any exact CSS value |

**`maxHeight`** — max height in pixels before the image crops (default: `420`)

---

### `gallery`
Multiple images in a responsive grid.

```json
{
  "type": "gallery",
  "heading": "Optional heading above grid",
  "images": [
    { "src": "/blog/photos/photo1.jpg", "alt": "First photo", "caption": "Caption 1" },
    { "src": "/blog/photos/photo2.jpg", "alt": "Second photo" },
    { "src": "https://example.com/photo3.jpg", "alt": "External photo" }
  ]
}
```

---

### `video`
YouTube embed or local video file.

```json
{
  "type": "video",
  "youtubeId": "dQw4w9WgXcQ",
  "caption": "Optional caption below video"
}
```

For a local video file:
```json
{
  "type": "video",
  "src": "/blog/videos/my-video.mp4",
  "caption": "Optional caption"
}
```

> `youtubeId` is the part after `?v=` in the YouTube URL.
> Example: `https://youtube.com/watch?v=dQw4w9WgXcQ` → `"youtubeId": "dQw4w9WgXcQ"`

---

### `ingredient-group`
A labeled list of ingredients (recipe).

```json
{
  "type": "ingredient-group",
  "heading": "Main Ingredients",
  "items": [
    "1 cup mushrooms, sliced",
    "3 eggs",
    "1 tsp oil",
    "Salt to taste"
  ]
}
```

---

### `steps`
Numbered step-by-step instructions.

```json
{
  "type": "steps",
  "heading": "Instructions",
  "items": [
    {
      "step": 1,
      "title": "Prepare ingredients",
      "body": "Wash and chop all vegetables."
    },
    {
      "step": 2,
      "title": "Cook",
      "body": "Heat oil in a pan on medium flame."
    }
  ]
}
```

---

### `nutrition`
Nutrition facts table with optional notes and score.

```json
{
  "type": "nutrition",
  "heading": "Nutrition Information",
  "rows": [
    { "nutrient": "Calories",      "amount": "~350 kcal" },
    { "nutrient": "Protein",       "amount": "~24 g" },
    { "nutrient": "Carbohydrates", "amount": "~12 g" },
    { "nutrient": "Fat",           "amount": "~19 g" }
  ],
  "notes": "Key vitamins: Vitamin B12, Selenium. Keeps you full 3–4 hours.",
  "score": "9 / 10"
}
```

---

### `callout`
Highlighted info box. Four visual styles.

```json
{
  "type": "callout",
  "variant": "tip",
  "body": "Marinate for the full 15 minutes for deeper flavor."
}
```

**`variant` options:**

| Value | Color | Icon |
|---|---|---|
| `"tip"` | Green | 💡 |
| `"warning"` | Amber | ⚠️ |
| `"info"` | Blue | ℹ️ |
| `"note"` | Purple | 📌 |

---

### `places`
List of locations/points of interest (travel posts).

```json
{
  "type": "places",
  "heading": "Must Visit",
  "items": [
    {
      "name": "Ooty Lake",
      "description": "Scenic boating lake in the heart of town.",
      "tip": "Go early morning to avoid crowds."
    },
    {
      "name": "Botanical Gardens",
      "description": "150-year-old gardens with rare plant species."
    }
  ]
}
```

---

### `divider`
A horizontal visual separator between sections.

```json
{
  "type": "divider"
}
```

---

## Complete Example — Recipe Post

```json
{
  "slug": "spicy-mushroom-masala-omelet",
  "title": "Spicy Mushroom Masala Omelet – Easy High-Protein Breakfast",
  "date": "2026-02-10",
  "tags": ["recipe", "breakfast", "high-protein", "healthy"],
  "excerpt": "Bold spices, earthy mushrooms, and fluffy eggs — ready in 15 minutes.",
  "author": "Siva Shanmuga Vadivel",
  "cookTime": "15 min",
  "difficulty": "Easy",
  "servings": "1",
  "sections": [
    {
      "type": "image",
      "src": "/blog/photos/omelet.jpg",
      "alt": "Mushroom masala omelet",
      "float": "right",
      "size": "small"
    },
    {
      "type": "text",
      "body": "A quick, flavorful, protein-packed breakfast ready in under 15 minutes."
    },
    {
      "type": "ingredient-group",
      "heading": "Main Ingredients",
      "items": ["3 eggs", "1 cup mushrooms, sliced", "1 tsp oil", "Salt to taste"]
    },
    {
      "type": "ingredient-group",
      "heading": "Masala Mix",
      "items": ["1/2 tsp red chili powder", "1/4 tsp garam masala"]
    },
    {
      "type": "divider"
    },
    {
      "type": "steps",
      "heading": "Instructions",
      "items": [
        { "step": 1, "title": "Marinate mushrooms", "body": "Mix with spices, rest 15 min." },
        { "step": 2, "title": "Cook filling", "body": "Sauté onion, garlic, mushrooms." },
        { "step": 3, "title": "Make omelet", "body": "Pour eggs over filling, fold and cook." }
      ]
    },
    {
      "type": "callout",
      "variant": "tip",
      "body": "Marinate the full 15 minutes for deeper spice flavor."
    },
    {
      "type": "image",
      "src": "/blog/photos/omelet-final.jpg",
      "alt": "Finished omelet",
      "caption": "Ready in under 15 minutes",
      "align": "center",
      "size": "large"
    },
    {
      "type": "nutrition",
      "heading": "Nutrition Information",
      "rows": [
        { "nutrient": "Calories", "amount": "~350 kcal" },
        { "nutrient": "Protein",  "amount": "~24 g" }
      ],
      "notes": "Keeps you full for 3–4 hours.",
      "score": "9 / 10"
    }
  ]
}
```

---

## Complete Example — Travel Post

```json
{
  "slug": "exploring-ooty",
  "title": "Exploring Ooty – The Queen of Hill Stations",
  "date": "2026-04-10",
  "tags": ["travel", "nature", "places"],
  "excerpt": "Tea gardens, misty mountains, and colonial charm in the Nilgiris.",
  "author": "Siva Shanmuga Vadivel",
  "location": "Ooty, Tamil Nadu",
  "duration": "2 days",
  "sections": [
    {
      "type": "text",
      "body": "Ooty sits at 2240m in the Nilgiri hills — a refreshing escape."
    },
    {
      "type": "gallery",
      "images": [
        { "src": "/blog/photos/ooty1.jpg", "alt": "Tea garden", "caption": "Tea estates" },
        { "src": "/blog/photos/ooty2.jpg", "alt": "Ooty lake" }
      ]
    },
    {
      "type": "places",
      "heading": "Must Visit",
      "items": [
        {
          "name": "Ooty Lake",
          "description": "Scenic boating lake in the heart of town.",
          "tip": "Go early morning to avoid crowds."
        }
      ]
    },
    {
      "type": "video",
      "youtubeId": "YOUR_VIDEO_ID",
      "caption": "Nilgiri Mountain Railway"
    },
    {
      "type": "callout",
      "variant": "info",
      "body": "Best time to visit: April–June and September–November."
    }
  ]
}
```

---

## Adding Local Images

1. Place image files in `public/blog/photos/`
2. Reference in JSON as `"/blog/photos/filename.jpg"`

External URLs work as-is:
```json
{ "src": "https://example.com/image.jpg" }
```
