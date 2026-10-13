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
