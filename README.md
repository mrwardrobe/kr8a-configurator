# KR8A

A pre-launch KR8A sideboard website, built with Next.js 14 and the supplied Claude Design Three.js configurator engine and viewer.

## Run locally

```sh
npm ci
npm run dev
```

When you are ready to inspect it manually, open `http://localhost:3000`. Run `npm run typecheck`, `npm run test`, `npm run build`, and `npm run audit:site` before merging changes. The prototype was developed and tested with Node 22.

The owner confirmed `kr8a.com` as the public domain. Canonical URLs and the sitemap default to `https://kr8a.com`; set `NEXT_PUBLIC_SITE_URL` only if the deployed canonical origin differs.

## What is implemented

- An editorial coming-soon homepage, substantial sideboard and materials pages, process and story pages, and five journal articles adapted from the owner's SEO brief. The supplied Claude hero and detail reference crops are retained and labelled as prototype imagery.
- A gated double-opt-in early-access flow designed around Resend Contacts and Cloudflare Turnstile. It is **inactive** until the owner confirms contact/privacy details and a full delivery-and-storage test passes.
- A six-stage sideboard configurator: size, fronts, inside, finish, base and handles.
- The supplied Claude parametric Three.js viewer, including carcass, doors, drawer stacks, internal fittings, procedural wood and base options. Doors and drawers open interactively.
- One normalized configuration model in millimetres for controls, 3D geometry, URL sharing, local drafts, saved designs and the downloadable design brief.
- The Claude prototype's live pricing formula, clearly labelled as an illustrative estimate. The separate production pricing boundary remains unavailable until KR8A provides approved rules and a commercial order service.
- Server-rendered homepage content, distinct page metadata, canonical URLs, structured data, `sitemap.xml`, `robots.txt`, and a non-indexed configurator to avoid indexing customer configurations.

The image at `public/images/kr8a-hero-reference.png` and its three detail crops came from the supplied Claude export. The export README identifies them as low-resolution crops from an existing KR8A-site screenshot, not original product photography. Approved high-resolution imagery is still needed before launch.

## Design source and recovery

The original Antigravity checkout was recovered from `~/iCloud Drive (Archive)/Desktop/KR8A_clean`, including its uncommitted 3D changes. Its Git remote is [`mrwardrobe/kr8a-configurator`](https://github.com/mrwardrobe/kr8a-configurator). The initial two Claude Design `.dc.html` exports and the later complete launch ZIP are preserved in `design-reference/claude-redesign/`. See that folder's README for provenance and scope.

See [architecture](docs/architecture.md), [launch readiness](docs/launch-readiness.md) and [SEO launch handover](docs/seo-launch.md) for data boundaries, setup and remaining decisions.
