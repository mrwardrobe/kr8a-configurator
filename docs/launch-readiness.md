# Launch readiness — 13 October 2026

## Working and verified locally

- Homepage, configurator and 404 page respond successfully; the production build completes.
- Wall-fit width is carried into the configurator through a deterministic configuration link.
- Width, height, depth, fronts, fit-out, shelf position, interior lighting, finish, base and handle controls update the normalized design, illustrative estimate and supplied Claude 3D view.
- Doors open and drawers slide in the browser; the review sheet shows the matching design.
- A draft survives reload on the same device. Share links, saved designs and JSON design briefs are available.
- Desktop (1440 px), tablet (768 px), phone (390 px) and small phone (320 px) layouts were inspected. A 320 px overflow was corrected.
- TypeScript, model tests and the production build pass.

## Still required before a commercial launch

1. **Production rules:** KR8A must approve dimensional limits, structural bay constraints, material codes, finish samples, panel construction, hardware, fixing methods and tolerances. The current values are provisional.
2. **Pricing:** No approved rate card exists. The Claude prototype's £1,495 default and live formula are displayed as illustrative estimates. `priceDesign` has no active production rules.
3. **Order path:** No checkout, payment, enquiry API, order database or delivery/tax rules were present in the recovered repository. Review currently ends with a shareable/downloadable design brief; it does not place an order or notify KR8A.
4. **Manufacturing:** The visual geometry is not a CNC cut list. Grain, edging, machining, joinery, hardware clearances and supplier file formats need an approved compiler and validation workflow.
5. **Brand content and imagery:** The supplied hero and detail images are low-resolution screenshot crops, not original photography. Obtain approved high-resolution product and material images. Supplier/assembly details, lead times, warranty and returns copy also need confirmation.
6. **Operations:** Add analytics, error monitoring, accessibility audit on physical devices and cross-browser performance testing once deployment infrastructure is identified.

No production deployment or live payment setting was changed.

## Pre-launch editorial update — 26 October 2026

The KR8A pre-launch homepage, collection guides, materials/process/story pages and five journal articles have been implemented in code. The public homepage now states that orders are not open and no longer displays the prototype price. The configurator files and their geometry/pricing rules were not changed.

The early-access form is coded but intentionally disabled. Resend Contacts is the selected private store, with a dedicated KR8A segment and double opt-in; no Resend API key, verified sending address, segment, Turnstile keys or official contact email is configured in the Vercel project yet. No real submission or email delivery has been tested, so the form must remain off. See `docs/seo-launch.md` for activation requirements.

The first editorial SEO audit verified 14 indexable sitemap entries, distinct titles, canonical paths, one H1 per page and internal links. Contact/legal pages remain noindexed until the official business and privacy details are supplied. The bedside collection adds a fifteenth indexable entry. Mobile layout was implemented in CSS; browser inspection is tracked separately.

## Bedside collection update — 26 October 2026

The owner-approved bedroom image is included unchanged as the primary visual for `/bedside-tables` and a homepage feature. The new page describes the image as a design concept visualization and explains dimensions, drawer/open storage, materials and construction without treating a rendering as confirmed production specification. Navigation, footer, materials, journal and sitemap link to the collection. The sideboard configurator remains unchanged. The current collection is a coming-soon concept; no ordering or payment capability was added.
