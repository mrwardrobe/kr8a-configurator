# KR8A pre-launch website handover

## Current state

The public-facing code is a KR8A coming-soon site for sideboards and bedside tables. The sideboard configurator remains an unmodified prototype at `/configurator` with `noindex`. The homepage does not present its illustrative price or link customers into an order journey. The form renders disabled and the API returns HTTP 503 until `WAITLIST_ENABLED=true` **and** all required configuration is present. No production deployment, payment or live email send was made by these changes.

The sideboard hero and detail pictures are low-resolution reference crops from the supplied Claude Design export. Their captions identify them as design-prototype imagery. The bedside collection uses the owner-approved image `public/images/kr8a-bedside-concept.png` unchanged; its source SHA-256 is `9f596afede76f26948cb4a677f4c8dcb3333875f50546d78ce55d4e2e49b39ce`. It is labelled as a design concept visualization, not a manufactured-product photograph. Next.js Image serves responsive optimized variants without changing the stored source. Obtain approved high-resolution sideboard photography before a full commercial launch.

## Early-access design

The updated implementation and activation sequence are documented in [privacy-analytics-launch.md](privacy-analytics-launch.md). That handover supersedes the original signup/analytics activation notes below.

Resend is the selected private contact/email provider, using a dedicated KR8A workspace and segment with double opt-in. The exact marketing wording and version are shared in `lib/marketingConsent.ts`. Email links use authenticated encryption, expire, and require a POST button. Opening a link does not subscribe or unsubscribe. Repeat confirmations preserve original evidence and do not count as new conversions. A signed URL alone no longer exposes a readable email payload.

Upstash Redis provides shared request limits, confirmation locks and pending-withdrawal protection with short-lived HMAC keys. No store or email credentials have been provisioned here. The form fails closed until all configuration is available; production also requires `WAITLIST_LAUNCH_APPROVED=true`. Protected preview testing is restricted to explicitly approved test addresses and the configured preview origin. Unsubscribe handling remains available when new signups are disabled.

The official contact/operator details, retention process, processor/UK-transfer review, verified sending domain and full controlled delivery/storage/unsubscribe test are still required before activation. Never place keys in public environment variables or commit them. No live email or marketing campaign has been sent by this implementation.

## Search and content

Indexable routes have distinct titles, descriptions, canonical URLs and a single H1. The sitemap includes only the homepage, substantive sideboard and bedside-table pages, materials, process, story and journal articles. Contact, privacy, cookies, confirmation pages and the configurator are `noindex` while contact and policy details are being finalized. `robots.txt` leaves the configurator crawlable so its `noindex` can be seen, and excludes the API. A Search Console verification meta tag appears only if `GOOGLE_SITE_VERIFICATION` is configured.

The narrow and shallow topics share one page because both are about compact spaces; two-metre proportions are covered on the long-sideboard page. This avoids several near-duplicate pages. The text does not promise a 30 cm depth or final hardware, pricing, delivery or EGGER board SKUs.

The bedside-table collection has one substantial page. The concept depicts one drawer and an open lower compartment; supported dimensions, 18 mm panel engineering, exact finishes, drawer hardware and handles still need production confirmation. There is no floating bedside-table product, so the site does not claim one or create a keyword page for it.

The second Journal pack adds five substantial, distinct articles covering EGGER material claims, solid timber versus engineered board, choosing sideboard size, shallow storage and precision-built flat-pack furniture. Each article has its own metadata, canonical URL and Article structured data; the sitemap is generated from the same article list. The new articles use typography rather than unapproved photography. The EGGER piece uses its 2025/26 group figure only as a combined recycled-wood-and-sawmill-by-product measure, not as a recycled percentage for any KR8A board. The exact board SKU, chain-of-custody claim, product footprint, hardware and tested assembly details remain unconfirmed. Primary-source links appear alongside the articles where manufacturer or material claims are discussed.

## Launch sequence

1. Confirm the legal business identity, official contact mailbox, privacy request address, data retention process and final host (`kr8a.com` or `www.kr8a.com`). Review the legal pages with appropriate advice before indexing them.
2. Replace the prototype image crops with approved high-resolution photography and exact finish imagery. Confirm production material references and supported product dimensions before changing any provisional wording.
3. Create/verify the Resend sending domain and KR8A segment/properties; configure Turnstile and environment variables in a protected preview. Test the full signup and unsubscribe flow there. Set `WAITLIST_ENABLED=true` only after success.
4. Run `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run audit:site`. Manually inspect desktop and mobile pages, keyboard navigation and the email flow. The owner requested that localhost not be opened automatically.
5. After owner approval, merge the reviewed branch into the production branch and deploy through the existing Vercel project. Update DNS/domain routing so the chosen canonical KR8A host serves this project. Check live `robots.txt`, `sitemap.xml`, canonicals, image loading and all routes. The current `kr8a.com` site is separate from this checkout; DNS/domain changes require coordination.
6. Add the chosen domain to Search Console, configure `GOOGLE_SITE_VERIFICATION`, verify ownership and submit the sitemap only with authorized account access. Do not submit unfinished product pages or enable checkout.

Official Vercel Web Analytics and Speed Insights packages are now installed behind production-origin and visitor-consent gates. GA4 is not installed. Privacy/cookie controls, private-route exclusions and the measurement contract are covered in [privacy-analytics-launch.md](privacy-analytics-launch.md). Provider enablement, paid-plan custom-event entitlement, production traffic and Search Console ownership/submission have not been verified or activated.
