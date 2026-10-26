# KR8A pre-launch website handover

## Current state

The public-facing code is a KR8A coming-soon site for sideboards and bedside tables. The sideboard configurator remains an unmodified prototype at `/configurator` with `noindex`. The homepage does not present its illustrative price or link customers into an order journey. The form renders disabled and the API returns HTTP 503 until `WAITLIST_ENABLED=true` **and** all required configuration is present. No production deployment, payment or live email send was made by these changes.

The sideboard hero and detail pictures are low-resolution reference crops from the supplied Claude Design export. Their captions identify them as design-prototype imagery. The bedside collection uses the owner-approved image `public/images/kr8a-bedside-concept.png` unchanged; its source SHA-256 is `9f596afede76f26948cb4a677f4c8dcb3333875f50546d78ce55d4e2e49b39ce`. It is labelled as a design concept visualization, not a manufactured-product photograph. Next.js Image serves responsive optimized variants without changing the stored source. Obtain approved high-resolution sideboard photography before a full commercial launch.

## Early-access design

Resend is the chosen managed service for both confirmation email delivery and private signup records. A dedicated KR8A segment keeps this list separate from any other contacts. A visitor must tick an unticked marketing-consent box, complete Cloudflare Turnstile, receive a confirmation email, and press a confirmation button before the address is added to Resend. The contact records the initial consent timestamp, confirmation timestamp and wording version as custom properties. Resend's broadcast unsubscribe handling must be enabled for future launch emails.

The confirmation link is signed, expires after 48 hours and does not add a contact on GET, which prevents email-link scanners from confirming automatically. The form also uses a honeypot and timing check. The API accepts same-origin requests only. API keys and the signing secret are server-side environment variables.

Before activation, create a KR8A segment and three **string** contact properties in Resend: `kr8a_consent_at`, `kr8a_confirmed_at`, `kr8a_consent_version`. Confirm that `RESEND_FROM_EMAIL` uses a verified sending domain. Restrict access to the Resend account and use a key with the access needed to send email and manage contacts. Set the values in `.env.local` for a protected test environment; never commit keys. Configure a Turnstile widget for the exact test host, then a separate widget for the final public host.

Run a complete test with an address controlled by the owner: submit the form, receive the email, open the link, press Confirm, and verify the contact is in the KR8A segment with all three consent properties. Verify duplicate submission, expired link, invalid Turnstile token, unsubscribe and deletion in Resend. Only then set `WAITLIST_ENABLED=true` in the intended environment. Do not set it in production until the official contact email, privacy/controller details, retention policy and sending domain are confirmed.

If Resend responds with an error, the site does not tell the visitor they joined. The form does not add unconfirmed addresses to the contact list. A transactional verification email may be sent to an unconfirmed address only after the visitor requests it; marketing begins only after confirmation.

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

No analytics are installed. If analytics are added later, update cookie/privacy information and implement the necessary consent controls before activation.
