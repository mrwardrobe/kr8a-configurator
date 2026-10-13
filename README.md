# KR8A

A design preview for KR8A sideboards, built with Next.js 14, React and the supplied Claude Design Three.js configurator engine and viewer.

## Run locally

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Run `npm run typecheck`, `npm run test`, and `npm run build` before merging changes. The prototype was developed and tested with Node 22.

The owner confirmed `kr8a.com` as the public domain. Canonical URLs and the sitemap default to `https://kr8a.com`; set `NEXT_PUBLIC_SITE_URL` only if the deployed canonical origin differs.

## What is implemented

- An editorial homepage based on the supplied Claude Design homepage export, with responsive layouts, a wall-fit journey, starting designs, materials preview and FAQ. The original Claude hero and detail reference crops are included; the React page adapts the layout rather than reproducing every pixel.
- A six-stage sideboard configurator: size, fronts, inside, finish, base and handles.
- The supplied Claude parametric Three.js viewer, including carcass, doors, drawer stacks, internal fittings, procedural wood and base options. Doors and drawers open interactively.
- One normalized configuration model in millimetres for controls, 3D geometry, URL sharing, local drafts, saved designs and the downloadable design brief.
- The Claude prototype's live pricing formula, clearly labelled as an illustrative estimate. The separate production pricing boundary remains unavailable until KR8A provides approved rules and a commercial order service.
- Server-rendered homepage content, metadata, canonical URLs, `sitemap.xml`, `robots.txt`, and a non-indexed configurator to avoid indexing customer configurations.

The image at `public/images/kr8a-hero-reference.png` and its three detail crops came from the supplied Claude export. The export README identifies them as low-resolution crops from an existing KR8A-site screenshot, not original product photography. Approved high-resolution imagery is still needed before launch.

## Design source and recovery

The original Antigravity checkout was recovered from `~/iCloud Drive (Archive)/Desktop/KR8A_clean`, including its uncommitted 3D changes. Its Git remote is [`mrwardrobe/kr8a-configurator`](https://github.com/mrwardrobe/kr8a-configurator). The initial two Claude Design `.dc.html` exports and the later complete launch ZIP are preserved in `design-reference/claude-redesign/`. See that folder's README for provenance and scope.

See [architecture](docs/architecture.md) and [launch readiness](docs/launch-readiness.md) for data boundaries and remaining decisions.
