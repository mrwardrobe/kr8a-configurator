# KR8A analytics, privacy and launch handover

This implementation prepares the feature branch for review. It is not a legal compliance certificate or a production activation. New signup and measurement stay off by default. No live email or marketing campaign was sent during implementation.

## What is installed

- `@vercel/analytics` 2.0.1 and `@vercel/speed-insights` 2.0.0, using their official Next.js components once in the root layout.
- No GA4, advertising tags, tag manager, cross-site profiling, session replay or custom reporting dashboard. Vercel and Search Console are sufficient for the launch questions. Reconsider GA4 only for a specific reporting need that those services cannot answer.
- Next.js updated from 14.2.35 to the patched 15.5.28 line. Async page params/cookies were adapted outside the configurator. A scoped PostCSS 8.5.32 override removes Next's vulnerable pinned 8.4.31 dependency. Review/remove that override when a future Next release includes a patched version itself.
- Approved typography is served as local WOFF2 assets with SIL licences. Google Fonts is no longer a runtime dependency.

## Vercel account evidence and activation

The connected API identifies project `kr8a-configurator` (`prj_0VyeLRzBBN9GWRPwa18qVpMHSoef`) in team `team_fdAaJQ48Mq6FPvcoJ7aKqU6q`. Its environment-variable list was empty at inspection. Its domains did not include `kr8a.com`. The project response does not expose Analytics/Speed Insights enabled status or the custom-event entitlement: **these have not been verified as enabled**.

In the existing project's dashboard, review Web Analytics and Speed Insights, enable them if needed and check the plan/usage allowance. Do not purchase or upgrade a plan automatically. Vercel's custom-events documentation limits that feature to supported paid plans; leave `ANALYTICS_CUSTOM_EVENTS_ENABLED=false` unless entitlement is confirmed. Page-view and performance integration can operate without custom events.

Use server-side `ANALYTICS_ENABLED=true` only for the intended production build after the service settings and notice have been reviewed. Runtime collection also requires `VERCEL_ENV=production`, exact origin `https://kr8a.com`, a safe referrer and the visitor's current opt-in. A Vercel preview cannot collect even if the flags were mistakenly enabled. The controls remain available on preview for inspection, labelled inactive; there is no initial consent banner on an inactive deployment.

The settings are build-time inputs to the layout: redeploy after changing them. Do not promote a preview without a production build using the correct production configuration.

## Measurement contract

All events depend on audience-measurement consent, production eligibility and the custom-event feature flag. There is no buffering or retrospective event replay after consent. Refusing does not disable the site or form.

| Event | Exact trigger | Properties / duplicate protection |
| --- | --- | --- |
| Automatic page view | Official Analytics Next integration on an allowlisted public page | The only page-view integration; queries/fragments removed, no manual page-view calls |
| `collection_viewed` | Visit `/sideboards` or `/bedside-tables` while measurement is permitted | `collection`: finite enum; once per collection per loaded document, including SPA navigation |
| `journal_to_product` | A same-origin link clicked from an allowlisted Journal article to a real sideboard, bedside or materials page | `collection`: finite enum; `article`: published, allowlisted slug; one document listener |
| `early_access_started` | First focus within an enabled form | No properties; once per rendered form |
| `early_access_requested` | Signup API returns success and confirms that Resend accepted the verification email | No properties; form disables after success; failure/429/503 never counts |
| `early_access_confirmed` | Confirmation POST returns a new successful contact confirmation, after segment/contact operations succeed | No properties; repeats return `newlyConfirmed=false`; shared contact lock prevents concurrent success |
| Speed Insights vitals | Official Speed Insights integration, after performance opt-in, on public allowlisted pages | URL is filtered independently; no private-page vitals |

The email-confirmation page is private and has no measured page view. If audience consent already exists (or the visitor chooses it there), its new-confirmation event uses the fixed URL `https://kr8a.com/early-access/confirmed`. The token-bearing URL is never transmitted as an analytics URL. A manually entered success URL does not count or assert success: status comes from an authenticated five-minute HttpOnly result cookie.

There are no implemented free tools or new configurator events. Reserve `free_tool_used` with a fixed tool ID and `configurator_started` / `configuration_reviewed` without dimensions for later approval. None is emitted now. The sideboard configurator, geometry, plinth, prices and manufacturing logic have no source changes.

No event accepts a free-form form/configuration payload. Email, names, photos, measurements and IP addresses are not event properties. Allowlisted paths are shared with the sitemap. Unknown/private paths are dropped; all query strings and fragments are removed. Referrers containing queries, identifiers in unknown paths or credentials cause collection to be disabled for that document. `Referrer-Policy: no-referrer` applies across the site. Providers necessarily receive network requests; this is not a claim that no IP is ever processed by hosting or measurement infrastructure.

## Consent and browser storage

A first eligible production visit offers equally straightforward Accept optional, Reject optional and Manage preferences actions. The native modal has labelled independent switches for audience/performance, neither selected initially, a close control, keyboard focus trapping and Escape support. The fixed Privacy choices button reopens it. The configurator's interface is left alone.

`kr8a-privacy-v1` holds only two booleans, version and timestamp for 180 days. Bad, expired or future-dated records default to no consent. Cross-tab changes are applied through storage events. If storage is blocked, the choice applies in memory to the current page; there is no persistent identifier fallback. With JavaScript disabled no measurement loads.

Provider components mount only after the relevant opt-in. Their send-time filters read the live choice, so withdrawal stops subsequent event/vital transmission even if a previously loaded script still has listeners. Historic aggregate reports are not deleted through a browser toggle. Vercel Analytics does not use an analytics cookie here; we have deliberately chosen opt-in for both services rather than assuming a PECR exemption.

The ICO now describes a statistical-purposes exception with conditions, including an easy objection mechanism. This implementation does **not** rely on that exception: a cookieless SDK is not itself an assessment of all processing. Owner/legal review remains necessary.

The cookie page inventories the existing configurator keys, the new essential choice record and the five-minute encrypted result cookie. Cloudflare's optional pre-clearance cookie must stay disabled. Preview-authentication/toolbar storage is platform tooling, not part of KR8A marketing.

## Signup and unsubscribe security

Resend remains the private contact store and email provider. Use a dedicated KR8A Resend workspace/account and segment: contacts and global unsubscribe are account-wide, so a segment alone is not isolation from unrelated brands. Configure the three string properties `kr8a_consent_at`, `kr8a_confirmed_at`, `kr8a_consent_version`. Version v2 is tied to the exact wording in `lib/marketingConsent.ts`; keep an archived copy if wording changes.

Upstash Redis is the selected shared store for ephemeral security controls. It is not a second mailing list. Use a separate protected test database and production database, preferably through the existing Vercel team's Storage/Marketplace UI. Provisioning, provider terms and regions remain owner setup; no store was provisioned or paid subscription created in this task.

- POSTs must have the configured exact origin. Preview tests require an explicit HTTPS `.vercel.app` test origin; confirmations point back to that test origin, never accidentally to the live domain.
- Streamed request bodies are bounded to 4096 bytes even if Content-Length is missing or forged. Content types, email, explicit consent, honeypot, timing, bot-token length, Turnstile hostname and action are validated.
- Turnstile loads only after interaction with an enabled form. Siteverify is server-side; its token is not reused after a failed attempt. Configure action `early_access` and pre-clearance off.
- Shared Redis limits: 30 send attempts/minute globally, 8 per IP/15 minutes, 3 per email/hour; management actions 12/email/15 minutes. IP/email limit keys use an HMAC with a separate server secret. No raw address or IP is stored in Redis or emitted in application logs. Failed security storage closes signup rather than bypassing its limits.
- Confirmation/unsubscribe links use AES-256-GCM authenticated encryption with purpose separation. Confirmations expire in 48 hours, email cancellation links in 180 days. Old readable signed tokens are rejected. They were never used for live sending in this checkout.
- Opening a link does not change a subscription. A POST button is required, protecting against email scanners. A per-address lock serializes confirmation/withdrawal for up to 60 seconds. Repeat confirmations preserve original consent evidence and are not new conversions.
- A globally unsubscribed contact is never silently reactivated. A pending withdrawal blocks older confirmation links for 48 hours. An unsubscribe POST works even when new signups are disabled; failed Resend updates do not claim success.
- All new server secrets are non-public. Requests use timeouts and avoid logging bodies, tokens, addresses or provider responses. Private routes/API responses have no-store and noindex headers.
- No unsafe file-upload endpoint exists. Frame/object/base restrictions, nosniff, no-referrer and disabled camera/microphone/geolocation were added. This minimal CSP does not purport to be a complete script nonce policy; tightening it requires separate 3D/Turnstile compatibility checks.

## Operational retention and rights procedure

This schedule is proposed in the policy and requires owner approval before signup activates. Software tests cannot certify its operation.

1. Assign an owner for a monthly list review. In the dedicated Resend account, identify KR8A contacts with consent/confirmation older than 24 months and no later relevant interaction/renewal. Review before deleting; do not export addresses into analytics, chat, Git or issue trackers.
2. Keep a restricted suppression record where necessary to prevent future marketing; review necessity annually. Do not confuse deleting a contact with unsubscribing it: removing suppression can allow an accidental later import. Document the balance between erasure and necessary suppression for each request.
3. For a rights/deletion request, verify the requester proportionately via the official mailbox. Locate records in Resend and any support mailbox; withdraw/suppress sending immediately where requested. Remove unnecessary contact data and seek processor deletion where applicable. Document outcome and any necessary retained data privately; normally respond within one month, subject to applicable law.
4. Unconfirmed emails are not stored as contacts. Resend delivery content/logs follow its actual plan retention (currently documented as 30 days on standard plans); review its DPA, subprocessors and deletion terms. Do not claim every copy disappears when a confirmation link expires.
5. Redis limits expire after 60 seconds, 15 minutes or one hour; locks 60 seconds; pending suppression 48 hours. A private HMAC record can still be personal data: include Upstash in the processor/transfer review. Rotate the rate secret carefully; rotating it resets rate-limit/suppression keys.
6. Record actual Vercel request-log and aggregate-report retention in the processing register for the chosen plan. Restrict access/MFA. Review regions, international transfers and applicable UK safeguards for all four providers. Do not assume EU SCCs alone complete the UK assessment.
7. Keep the Resend domain's open/click tracking disabled; verify the received test email contains no unexpected tracking pixel or rewritten links. Future marketing must use the dedicated KR8A segment and working Broadcast unsubscribe facility; test unsubscribe before any campaign. No campaign sender or marketing automation was added here.

## Owner details still required

Official contact/privacy mailbox; verified legal operator and contact/postal address; any legally applicable company disclosures; approval of the retention schedule and responsible operator; verified processor agreements, regions, UK transfer mechanisms and assessments; actual hosting/report retention. Do not invent a DPO or registration details. Legal/contact pages remain noindexed pending final review.

## Reporting specification (real data only)

Use existing provider dashboards; no fabricated counters or custom dashboard is published.

| Question / metric | Source and interpretation |
| --- | --- |
| Organic clicks, impressions, CTR, average position | Search Console Performance, filtered to the canonical domain, date, page and UK where useful. Average position is not a guaranteed ranking. |
| Search landing-page performance | Search Console page report + Vercel landing pages/referrers, same period. These systems have different measurement bases; do not join visitors to email contacts. |
| Visitors and public page views | Vercel Web Analytics after activation. Consent/ad-blocking filters make this a measured subset, not all visitors. |
| Sideboard vs bedside interest | Collection page views and, if entitled, `collection_viewed` / `journal_to_product` by finite collection property. |
| Started → requested → confirmed | Custom-event counts for the same date range, with the above definitions. A requested email is not a subscriber. There may be cross-day or cross-device confirmations. |
| Confirmed active signups | Resend KR8A segment, consent properties present, globally subscribed; authoritative operational count. Never expose addresses in reporting. |
| Early-access conversion | Confirmed measurement events / consented measured visitors, explicitly labelled an indicative consented-sample rate. Separately report actual confirmed contacts without claiming attribution. |
| Future configuration → order | Not available: no confirmed commercial order/payment system exists. Define events and server-side order truth only when that journey exists. |

Review weekly after enough real activity exists. No traffic, ranking, signup or conversion figures are claimed by this handover.

## Exact production sequence

1. Owner completes/reviews the legal details, retention responsibilities, processor agreements and UK transfers. Add public fields from `.env.example` only when verified.
2. In the **existing KR8A Vercel project**, verify Web Analytics and Speed Insights enablement, plan entitlement and usage limits. Set the appropriate production measurement flags; keep custom events off without entitlement. GA4 remains absent.
3. Provision protected test Resend/Turnstile/Redis configuration with owner-controlled emails only. Add secrets through the provider/Vercel secret UI, never chat or Git. Set preview `WAITLIST_TEST_ORIGIN` and `WAITLIST_TEST_EMAILS`; configure a Turnstile hostname for that exact preview alias. Keep preview protection on.
4. Enable only the controlled test form and complete the requested verification email → confirm POST → private contact/consent record journey. Check repeat/expired/tampered links, bot failure, rate limits, provider failure, withdrawal before confirmation, repeated confirmation, unsubscribe and deletion. Inspect the email for tracking. No marketing message is needed for this test. Run a deliberately addressed owner-controlled Broadcast unsubscribe test only with explicit authorization for that test.
5. Record test evidence and approve the launch gate. Add **separate production** credentials/segment/Redis/widget and verified sending-domain settings; set `WAITLIST_ENABLED=true` and `WAITLIST_LAUNCH_APPROVED=true` only after the tests and legal review pass. Leave both false if any dependency is unfinished. Deploy again when build-time form settings change.
6. Run `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run audit:site`, `npm audit --omit=dev`. Review the final preview/commit. Owner approval is required before merge or production deployment.
7. After approval, merge/release through the existing Git/Vercel production branch and connect `kr8a.com` to the intended project. Redirect the alternate www host to `https://kr8a.com`. Check the canonical custom domain, HTTPS, headers, public indexability, robots and sitemap, private noindex and 404s. Vercel hostname aliases stay noindexed. Do not make DNS/domain changes in this task.
8. For Search Console, add a Domain property and complete its DNS verification in the authorised owner's account, or use URL-prefix verification with `GOOGLE_SITE_VERIFICATION` and a new production build. No ownership verification or sitemap submission has been completed. After verification and a live-domain check, submit `https://kr8a.com/sitemap.xml` there.
9. Make a controlled consented production visit; verify one page-view stream, measurement refusal/withdrawal, correct event counts and Speed Insights arrival in the real dashboards. Site functionality must remain intact with scripts blocked. Check final production cookies and provider logs/retention. Monitor initial signup errors and usage limits without logging personal data.

## Primary references reviewed

- ICO: [storage/access exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/), [privacy information](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/), [international transfers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/).
- Vercel: [Web Analytics privacy](https://vercel.com/docs/analytics/privacy-policy), [custom events and entitlement](https://vercel.com/docs/analytics/custom-events), [configuration](https://vercel.com/docs/analytics/package), [Speed Insights privacy](https://vercel.com/docs/speed-insights/privacy-policy) and [configuration](https://vercel.com/docs/speed-insights/package).
- Resend: [security, storage and retention](https://resend.com/security), [DPA](https://resend.com/legal/dpa), [unsubscribe and global status](https://resend.com/blog/unsubscribe-topics).
- Cloudflare: [Turnstile operation](https://developers.cloudflare.com/turnstile/), [pre-clearance](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/pre-clearance/).
- Next.js: [v15 upgrade](https://nextjs.org/docs/app/guides/upgrading/version-15), [patched image advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw). Dependency versions are also checked against the live npm advisory database.

## Verification recorded for this implementation

- Production build and TypeScript checks pass on Next.js 15.5.28 with the patched PostCSS dependency.
- All 27 automated tests pass, including existing configurator/model tests and new consent/filter/body-limit/encryption/signup/withdrawal tests. Service tests use explicit doubles; they do not prove delivery through live Resend or persistence in a real Redis store.
- The production-style SEO audit checks 25 routes / 21 sitemap entries, canonical origin, unique titles, one H1, internal links, Article data, absence of external font links and absence of measurement scripts in initial HTML.
- HTTP-only checks on a loopback build verified 10 rendered routes, privacy/noindex/no-store headers, Vercel-host noindex, rejection of a forged `?status=ok` success display, all three disabled signup APIs, local font delivery and canonical robots. No localhost browser tab was opened.
- The production dependency advisory audit reports zero known vulnerabilities. Browser bundle inspection found none of the server-secret identifiers.
- Real Vercel dashboard measurements, provider enablement/entitlement, real mailbox delivery, actual Resend contact storage, live Redis limits, provider unsubscribe delivery and physical-device accessibility remain release checks; they have not been described as completed.
