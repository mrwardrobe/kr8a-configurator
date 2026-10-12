# KR8A

A design preview for KR8A sideboards, built with Next.js 14, React, React Three Fiber and Three.js.

## Run locally

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Run `npm run typecheck`, `npm run test`, and `npm run build` before merging changes. The prototype was developed and tested with Node 22.

## What is implemented

- An editorial homepage based on the supplied Claude Design homepage export, with responsive layouts, a wall-fit journey, starting designs, materials preview and FAQ.
- A six-stage sideboard configurator: size, fronts, inside, finish, base and handles.
- Parametric 3D carcass, doors, drawer stacks, internal fittings and base options. Doors and drawers open interactively.
- One normalized configuration model in millimetres for controls, 3D geometry, URL sharing, local drafts, saved designs and the downloadable design brief.
- An explicit pricing boundary. No production price or checkout is shown until KR8A provides approved rules and a commercial order service.
- Server-rendered homepage content, metadata, canonical URLs, `sitemap.xml`, `robots.txt`, and a non-indexed configurator to avoid indexing customer configurations.

The hero image at `public/images/kr8a-hero-provisional.jpg` is a **generated concept image** based on the supplied Claude layout's image description. It is not a photograph of a KR8A product or customer installation.

## Design source and recovery

The original Antigravity checkout was recovered from `~/iCloud Drive (Archive)/Desktop/KR8A_clean`, including its uncommitted 3D changes. Its Git remote is [`mrwardrobe/kr8a-configurator`](https://github.com/mrwardrobe/kr8a-configurator), whose only branch at inspection was `main`. The two Claude Design `.dc.html` exports supplied by the owner are preserved in `design-reference/claude-redesign/`. See that folder's README for missing dependencies.

See [architecture](docs/architecture.md) and [launch readiness](docs/launch-readiness.md) for data boundaries and remaining decisions.
