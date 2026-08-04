/**
 * Shared data for the storefront design previews (storefront-design-*.html).
 *
 * Mirrors config.json → garage.accessories plus the photo manifest in
 * src/data/itemImages.json, flattened so the preview files stay standalone.
 * Nothing imports this at build time — it exists only so the six previews can
 * show the real catalogue without each one carrying its own copy.
 *
 * Photo paths resolve against public/, which is where the dev server and a
 * plain file:// open both find them.
 */
window.SF = (function () {
  const BASE = 'public/'

  const cats = [
    {
      id: 'camera', label: 'Camera & Accessories', icon: '📷',
      items: [
        { name: 'Insta360 X5', featured: true,
          imgs: ['insta360 x5_1.jpg', 'insta360 x5_2.jpg', 'insta360 x5_3.jpg'],
          links: [['Insta360', 'https://www.insta360.com/sal/x5?utm_source=AffiliateCenter&utm_medium=copylink&utm_term=INRSGGO3OY3'], ['Amazon', 'https://amzn.in/d/0gU0cXaW']] },
        { name: 'Insta360 X4 Air',
          imgs: ['insta360 x4 air_1.jpg', 'insta360 x4 air_2.jpg', 'insta360 x4 air_3.jpg'],
          links: [['Insta360', 'https://www.insta360.com/sal/x4-air?utm_source=AffiliateCenter&utm_medium=copylink&utm_term=INRSGGO3OY3'], ['Amazon', 'https://amzn.in/d/04ylvhYu']] },
        { name: 'Insta360 Ace Pro 2', featured: true,
          imgs: ['insta360 Ace pro 2_1.jpg', 'insta360 Ace pro 2_2.jpg', 'insta360 Ace pro 2_3.jpg', 'insta360 Ace pro 2_4.jpg'],
          links: [['Insta360', 'https://www.insta360.com/sal/ace-pro-2?utm_source=AffiliateCenter&utm_medium=copylink&utm_term=INRSGGO3OY3'], ['Amazon', 'https://amzn.in/d/0j5mlyWS']] },
        { name: 'Insta360 Heavy Duty Clamp',
          imgs: ['insta360 heavy duty clamp_1.jpg', 'insta360 heavy duty clamp_2.jpg'],
          links: [['Amazon', 'https://amzn.in/d/0hr1hLI6']] },
        { name: 'TELESIN Camera Clamp Handlebar Bike Mount',
          imgs: ['TELESIN Camera Clamp Handlebar Bike Mount_1.jpg', 'TELESIN Camera Clamp Handlebar Bike Mount_2.jpg'],
          links: [['Amazon', 'https://amzn.in/d/08shcZQH']] },
      ],
    },
    {
      id: 'lighting', label: 'Lighting', icon: '💡',
      items: [
        { name: 'FutureEye X80', featured: true,
          imgs: ['FutureEye X80_1.jpg', 'FutureEye X80_2.jpg', 'FutureEye X80_3.jpg', 'FutureEye X80_4.jpg', 'FutureEye X80_5.jpg'],
          links: [['Amazon', 'https://a.co/d/00IW1eUF']] },
      ],
    },
    {
      id: 'helmet', label: 'Helmet & Accessories', icon: '🎧',
      items: [
        { name: 'Sena 60S EVO', featured: true,
          imgs: ['sena 60s evo_1.jpg', 'sena 60s evo_2.jpg', 'sena 60s evo_3.jpg', 'sena 60s evo_4.jpg'],
          links: [['Amazon', 'https://a.co/d/05C8wMTZ']] },
      ],
    },
    {
      id: 'safety', label: 'Safety', icon: '🛡️',
      items: [
        { name: 'Headlight Grill',
          imgs: ['Headlight Grill_1.jpg', 'Headlight Grill_2.jpg', 'Headlight Grill_3.jpg'],
          links: [['Amazon', 'https://amzn.in/d/0hDBui68']] },
        { name: 'Handlebar Brace Pad',
          imgs: ['Handlebar Brace Pad_1.jpg'],
          links: [['Amazon', 'https://amzn.in/d/0b8r9VKh']] },
        { name: 'Suspension Forks Cover',
          imgs: ['Suspension Forks cover_1.jpg', 'Suspension Forks cover_2.jpg'],
          links: [['Amazon', 'https://amzn.in/d/0hzQSdbK']] },
        { name: 'Dashboard Screen Protector',
          imgs: ['Dashboard Screen Protector_1.jpg'],
          links: [['Amazon', 'https://amzn.in/d/09icZe3A']] },
        { name: 'Fork Sliders',
          imgs: ['FORK SLIDERS_1.png', 'FORK SLIDERS_2.png'],
          links: [['Motocare', 'https://motocare.co.in/product-details/fork-sliders-for-bear-650']] },
        { name: 'Saddle Stay with Plate with Footrest', featured: true,
          imgs: ['SADDLE STAY WITH PLATE WITH FOOTREST_1.png', 'SADDLE STAY WITH PLATE WITH FOOTREST_2.jpg'],
          links: [['Motocare', 'https://motocare.co.in/product-details/saddle-stay-with-plate-with-footrest-for-bear-650']] },
        { name: 'Crash Guard with Sliders', featured: true,
          imgs: ['CRASH GUARD WITH SLIDERS_1.png', 'CRASH GUARD WITH SLIDERS_2.jpg'],
          links: [['Motocare', 'https://motocare.co.in/product-details/crash-guard-with-dual-sliders-for-bear-650']] },
        { name: 'Tyre Hugger',
          imgs: ['Tyre Hugger_1.jpg', 'Tyre Hugger_2.jpg', 'Tyre Hugger_3.jpg'],
          links: [['Motocare', 'https://motocare.co.in/product-details/tyre-hugger-for-bear-650']] },
      ],
    },
    {
      id: 'essentials', label: 'Essentials', icon: '🔌',
      items: [
        { name: '100W Fast Two-Way Charging',
          imgs: ['100W Fast Two-Way Charging_1.jpg', '100W Fast Two-Way Charging_2.jpg', '100W Fast Two-Way Charging_3.jpg', '100W Fast Two-Way Charging_4.jpg'],
          links: [['Amazon', 'https://a.co/d/07qIgKj1']] },
      ],
    },
  ]

  const all = cats.flatMap(c => c.items.map(i => ({ ...i, cat: c })))

  return {
    note: "The gear actually bolted to the bike. Links go straight to where each one was bought.",
    cats,
    all,
    count: all.length,
    withPhotos: all.filter(i => i.imgs.length).length,
    photoCount: all.reduce((n, i) => n + i.imgs.length, 0),
    vendors: [...new Set(all.flatMap(i => i.links.map(l => l[0])))],
    featured: all.filter(i => i.featured),
    /** Spaces in the filenames have to be encoded to survive as a URL. */
    url(file) {
      return BASE + 'mygarage/items/' + encodeURIComponent(file)
    },

    /** public/bear650 holds a 37-frame 360° spin of the bike, wild-honey01..37. */
    bikeFrames: 37,
    bike(n) {
      const i = ((Math.round(n) - 1) % 37 + 37) % 37 + 1
      return BASE + 'bear650/wild-honey' + String(i).padStart(2, '0') + '.png'
    },
  }
})()
