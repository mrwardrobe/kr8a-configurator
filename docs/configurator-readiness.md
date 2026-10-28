# Configurator reliability pass — 28 October 2026

The configurator still uses the supplied Claude Design engine and Three.js viewer. The imported reference export is retained unchanged in `design-reference/claude-redesign/launch-export/kr8a-export/`.

## Implemented

- Signed shelf offsets now survive K3 share links, including links previously generated with negative offsets. Malformed links are rejected. Previous base64url design links remain supported.
- Draft storage tolerates unavailable storage, exhausted quota and malformed data. Names persist with drafts. Saved designs recover independently of a damaged current draft. Data stays in this browser; there is no account or cloud design store.
- Shared configurations take precedence over local drafts. A shared URL follows subsequent edits so refreshing does not restore its old configuration. Names remain local and are not placed in shared URLs.
- Dimension controls support typed values as well as sliders, with the existing 10 mm steps and limits. Height explicitly includes the base. Wall-fit clearance no longer rounds away half-millimetres.
- Inside chapters open and focus the selected bay, as in the supplied Claude export. Finish, base and handle chapters use the supplied detail cameras. Camera/display changes no longer resubmit the product configuration to the viewer.
- Review uses a native modal dialog with keyboard focus containment, Escape dismissal and background scroll lock. Reset clears camera/display options and wall-fit inputs.
- Wood effects and solid colours are described as decorative board explorations. Proposed hardware is explicitly unconfirmed.

No furniture geometry, base or plinth dimensions, pricing formula or component calculations were changed. Payments and ordering remain unavailable. The JSON design brief remains a customer specification preview, not a CNC cut list or an approved quotation. Configurator URLs and designs remain excluded from measurement.

## Commercial and manufacturing decisions still required

1. Confirm production dimension limits and increments, cabinet/bay constraints, board and front thicknesses, back construction, plinth construction and tolerances with the manufacturer.
2. Supply the supported EGGER decor and texture codes, matching edging and physical sample approvals. Procedural wood/colour previews cannot establish a finish match.
3. Confirm hinges, drawer system, available front/interior combinations, load limits, opening clearances and installation requirements. Do not infer a Blum commitment from editorial articles.
4. Approve a versioned price card including material, hardware, manufacture, packaging, delivery, tax treatment and margin. `lib/pricing.ts` deliberately reports production pricing unavailable until approved rules exist.
5. Validate a manufacturer-reviewed reference design and BOM before enabling any cut-list/CNC output or paid orders. Capture the validated configuration and approved rule versions with each future quotation/order.

The existing engine/adapter/pricing boundaries support this progression without a new commerce or manufacturing system being introduced prematurely.

## Automated verification

`npm test`: 33 passing tests. Coverage includes negative/positive shelf positions across all four existing bases, share-link price/summary consistency, malformed links, legacy links, unavailable storage, corrupt-draft recovery and draft/name migration. Existing pricing, geometry constraints, privacy and signup tests remain passing.

`npm run build`, `npm run typecheck`, `npm run audit:site` and `git diff --check` are the release checks. Preview browser findings are recorded below after verification; no production release is authorized by this document.
