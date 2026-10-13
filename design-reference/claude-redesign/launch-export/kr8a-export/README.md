# KR8A: homepage and sideboard configurator (design prototype)

## Run locally

Serve the folder over HTTP. Opening the files by double-click will not work, because the pages load sibling scripts with `fetch`.

```
cd kr8a-export
python3 -m http.server 8080      # or: npx serve .
```

Open http://localhost:8080/ and choose Homepage or Configurator. Add `#mobile` to the configurator URL for the phone frame.

**Internet is required** on first load for:
- Fonts: Geist, JetBrains Mono and Libre Caslon Display from Google Fonts. They are not bundled. Without a connection the page falls back to system fonts.
- three.js 0.165.0, plus OrbitControls, RoomEnvironment and RoundedBoxGeometry, imported from `https://esm.sh/three@0.165.0` inside `kr8a-viewer.js`. This is not bundled either. To go fully offline, download these modules and change the `CDN` constant at the top of `kr8a-viewer.js`.

There is no build step and no npm install.

## Files

| File | Purpose |
| --- | --- |
| `KR8A Homepage.dc.html` | Homepage. A "Design Component" page: template plus a logic class. |
| `KR8A Configurator.dc.html` | Configurator UI: sizing panel, fronts, inside, finish, base, handles, review. |
| `support.js` | Runtime that renders `.dc.html` files. Supplied by the design environment. Required by both pages. |
| `kr8a-engine.js` | Product model: options, limits, validation, price, serialisation, component list. Plain JS, exposes `window.KR8A`. |
| `kr8a-viewer.js` | `<kr8a-viewer>` web component. Lazy three.js renderer for a config. |
| `image-slot.js` | `<image-slot>` drag-and-drop photo placeholder. Dropped images persist in the browser (localStorage). |
| `assets/kr8a-hero.png` | Hero photo, cropped from a screenshot of your existing site. Low resolution. Replace with the original. |
| `assets/crop-*.png` | Detail crops from the same photo (grain, base, styled top). Placeholders for real photography. |
| `captures/` | Reference screenshots (see below). |

Nothing replaced any of the files you listed. All of them are included. There are no separate 3D model files or texture images. Geometry is built in code, and wood and paint textures are drawn procedurally on canvas (`KR8A.grainCanvas`).

## Configurator model (`kr8a-engine.js`)

Units are millimetres. A config is:

```
{ w, h, d, fronts: ['D'|'R'|'O', ...], inside: ['S'|'I'|'V', ...], shelves: [n, ...],
  sp, finish, interior, base, handle, light }
```

### Options
- **Size:** width 1200-2400, height 600-900, depth 350-550, all in 10 mm steps.
- **Bays:** 2, 3 or 4. The counts offered depend on width (see constraints).
- **Fronts per bay:** `D` door, `R` three-drawer stack, `O` open bay. Preset arrangements, for example DRD, DRRD, RDDR, DOOD, are in `PATTERNS`.
- **Inside per bay:** `S` shelves (0-3), `I` two inner drawers behind the door (max 1 shelf), `V` upright record dividers (no shelves). Drawer bays have no interior options.
- **Shelf height offset `sp`:** -50 to +50 percent, applied to all shelves.
- **Finish (6):** Natural oak, Smoked oak, Walnut, Black oak, Warm white, Deep green.
- **Interior:** match exterior, Warm white, Black oak, Deep green.
- **Base (4):** slim metal legs (150 mm), timber legs (160), recessed plinth (70), floating (110).
- **Handles (3):** handleless push-to-open, minimal pull (grip routed into the top edge), architectural bar handle.
- **Interior light:** on or off.

### Constraints (applied by `validate()`)
- Every value is clamped and rounded to its step.
- Bay width = (width − 2×18 − 3×(bays+1)) / bays. A bay count is only allowed if the bay width is 350-800 mm. If the current count becomes invalid, the nearest valid count is chosen and a notice is shown.
- Drawers need a bay no wider than 620 mm and a carcass height of at least 400 mm (height minus base height). Otherwise they are swapped for doors.
- Inner drawers need a carcass height of at least 420 mm. Otherwise they become shelves.
- Drawer bays always report 0 shelves. Divider bays always report 0 shelves.
- "Fit my sideboard" (wall width plus Tight/Balanced/Generous = 20/50/100 mm each side) sets width to floor((wall − 2×gap) / 10) × 10, clamped to the width limits.

### Geometry (`kr8a-viewer.js`)
- Panel thickness 18 mm, front thickness 19 mm, 3 mm gap between fronts, 9 mm back panel.
- Carcass is top, bottom, two sides, dividers between bays and a back. Fronts sit proud by 2 mm.
- Doors hinge on the outer edge (left half of the bays hinge left, right half hinge right). Concealed hinge cups: 2 per door, 3 if the door is taller than 620 mm.
- Drawers: three per stack, with side runners, boxes and fronts. Open drawers stagger out. The close motion slows near the end to read as soft-close.
- Interior detail: shelf pins, a 32 mm hole line behind shelf bays, inner drawer boxes and record dividers.
- Edges use a small radius. Timber textures use a bump map. Materials are physical (clearcoat on timber, sheen on paint). Lighting is one shadow-casting key light, a fill light and a room environment.
- Props on top (books, bowl, vase), the wall and the floor are scene dressing only, not part of the specification.
- `KR8A.components(config)` returns a customer-level parts list (top, bottom, sides, dividers, back, shelves) with lengths, widths and thicknesses. It is a starting point for a cut list, not a manufacturing output.

### Serialisation
`KR8A.encode(config)` returns a string such as `K3-2000-750-450-DDDD-SSSS-1111-0-oak-mat-plt-psh-0`. `KR8A.decode()` validates it back into a config. The configurator reads `?c=` from the URL. Copy link, Share and the homepage starting points use it. Configurations in the app are not meant to be indexed by search engines. This prototype has no server and no sitemap or metadata.

### Pricing (`PRICING` in `kr8a-engine.js`)
```
price = (base + surfaceArea_m2 × perSqM
         + Σ front price (D 45, R 160, O 15)
         + Σ handle price per door (bar 18) or per drawer (×3)
         + Σ shelves × 20
         + Σ inside option price (I 120, V 40))
        × finish multiplier + interior price + base price + light (85)
price is rounded to the nearest 10, minus 5
```
Surface area is the outside shell, in cm converted to m². The default config (2000 × 750 × 450, four oak doors, plinth, handleless) comes to **£1,495**.

## Placeholders (not confirmed by KR8A)
- **All prices and multipliers.** The UI labels them "Illustrative".
- **All size limits, bay limits, drawer and shelf rules, base heights.**
- **All six finishes and their descriptions.** Marked as design explorations; no sample availability is promised.
- **Hardware:** soft-close hinges and runners are shown but the specification is to be confirmed.
- **Delivery, assembly, guarantee, returns, lead times, "how it is made", reviews.** The dashed or "to be supplied" boxes on the homepage.
- **Photography:** the hero is cropped from a screenshot. The "In detail" row uses crops of it plus an empty handle slot. Use the image slots to try your own photos.
- **Early-access form:** does not send or store anything.
- **"Enquire to order" and "Continue":** show a message only. There is no checkout or enquiry backend.
- **Company copy:** "What is KR8A" and "Approach" lines come from your existing site text, as you supplied it.

## Captures

All in `captures/`. They were taken in the design preview at about 924 × 540 px, so desktop shots are of a short, narrow window and show the compact layout. The phone shots are the `#mobile` frame (390 × 844). Reload at a larger size to see the wide layout.

- `desktop-home-*`: hero, fit-to-wall, starting points, open doors
- `desktop-configurator-*`: Size, Finish, Inside, "Your KR8A"
- `mobile-configurator-*`: Finish, Inside, "Your KR8A"

Not captured: the homepage on a phone, and the configurator at 1280 px wide and above.
