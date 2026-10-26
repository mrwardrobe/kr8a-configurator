# KR8A pre-launch website handover

## Current state

The public-facing code is a KR8A coming-soon site. The configurator remains an unmodified prototype at `/configurator` with `noindex`. The homepage no longer presents its illustrative price or links customers into an order journey. The form renders disabled and the API returns HTTP 503 until `WAITLIST_ENABLED=true` **and** all required configuration is present. No production deployment, payment or live email send was made by this change.

The hero and detail pictures are low-resolution reference crops from the supplied Claude Design export. Their captions identify them as design-prototype imagery. Obtain approved high-resolution product photography before a full commercial launch.

## Early-access design

Resend is the chosen managed service for both confirmation email delivery and private signup records. A dedicated KR8A segment keeps this list separate from any other contacts. A visitor must tick an unticked marketing-consent box, complete Cloudflare Turnstile, receive a confirmation email, and press a confirmation button before the address is added to Resend. The contact records the initial consent timestamp, confirmation timestamp and wording version as custom properties. Resend's broadcast unsubscribe handling must be enabled for future launch emails.

The confirmation link is signed, expires after 48 hours and does not add a contact on GET, which prevents email-link scanners from confirming automatically. The form also uses a honeypot and timing check. The API accepts same-origin requests only. API keys and the signing secret are server-side environment variables.

Before activation, create a KR8A segment and three **string** contact properties in Resend: `kr8a_consent_at`, `kr8a_confirmed_at`, `kr8a_consent_version`. Confirm that `RESEND_FROM_EMAIL` uses a verified sending domain. Restrict access to the Resend account and use a key with the access needed to send email and manage contacts. Set the values in `.env.local` for a protected test environment; never commit keys. Configure a Turnstile widget for the exact test host, then a separate widget for the final public host.

Run a complete test with an address controlled by the owner: submit the form, receive the email, open the link, press Confirm, and verify the contact is in the KR8A segment with all three consent properties. Verify duplicate submission, expired link, invalid Turnstile token, unsubscribe and deletion in Resend. Only then set `WAITLIST_ENABLED=true` in the intended environment. Do not set it in production until the official contact email, privacy/controller details, retention policy and sending domain are confirmed.

If Resend responds with an error, the site does not tell the visitor they joined. The form does not add unconfirmed addresses to the contact list. A transactional verification email may be sent to an unconfirmed address only after the visitor requests it; marketing begins only after confirmation.

## Search and content

Indexable routes have distinct titles, descriptions, canonical URLs and a single H1. The sitemap includes only the homepage, substantive sideboard pages, materials, process, story and journal articles. Contact, privacy, cookies, confirmation pages and the configurator are `noindex` while contact and policy details are being finalized. `robots.txt` leaves the configurator crawlable so its `noindex` can be seen, and excludes the API. A Search Console verification meta tag appears only if `GOOGLE_SITE_VERIFICATION` is configured.

The narrow and shallow topics share one page because both are about compact spaces; two-metre proportions are covered on the long-sideboard page. This avoids several near-duplicate pages. The text does not promise a 30 cm depth or final hardware, pricing, delivery or EGGER board SKUs.

## Launch sequence

1. Confirm the legal business identity, official contact mailbox, privacy request address, data retention process and final host (`kr8a.com` or `www.kr8a.com`). Review the legal pages with appropriate advice before indexing them.
2. Replace the prototype image crops with approved high-resolution photography and exact finish imagery. Confirm production material references and supported product dimensions before changing any provisional wording.
3. Create/verify the Resend sending domain and KR8A segment/properties; configure Turnstile and environment variables in a protected preview. Test the full signup and unsubscribe flow there. Set `WAITLIST_ENABLED=true` only after success.
4. Run `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run audit:site`. Manually inspect desktop and mobile pages, keyboard navigation and the email flow. The owner requested that localhost not be opened automatically.
5. After owner approval, merge the reviewed branch into the production branch and deploy through the existing Vercel project. Update DNS/domain routing so the chosen canonical KR8A host serves this project. Check live `robots.txt`, `sitemap.xml`, canonicals, image loading and all routes. The current `kr8a.com` site is separate from this checkout; DNS/domain changes require coordination.
6. Add the chosen domain to Search Console, configure `GOOGLE_SITE_VERIFICATION`, verify ownership and submit the sitemap only with authorized account access. Do not submit unfinished product pages or enable checkout.

No analytics are installed. If analytics are added later, update cookie/privacy information and implement the necessary consent controls before activation.
