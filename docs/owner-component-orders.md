# Owner component orders

The owner workspace is at `/owner/cutting-lists` on the feature preview. Use the stable branch-preview address for consistent browser storage:

https://kr8a-configurator-git-feature-claud-14818b-mrwardrobes-projects.vercel.app/owner/cutting-lists

## What is implemented

- Separate owner interface using the existing KR8A typography and palette. There are no links from public navigation.
- Up to 30 component projects, each with supplier, order reference, furniture quantity, notes, revision and reviewer.
- Editable panels with finished length, width and thickness in millimetres, quantities per furniture unit, supplier material / decor / texture code, grain direction, four edge specifications and machining instructions.
- An orientation guide: L1/L2 run along the finished length; W1/W2 run along the finished width. The drawing is a labelled face view, not a scaled CAD drawing.
- Hardware lines with supplier item codes and quantities. No unconfirmed hinge or runner selection is inferred.
- Component-level checks and a four-part owner review. Specification edits invalidate the previous project approval. Changes to a panel or fitting also clear that line's check.
- Draft CSVs labelled **DRAFT — DO NOT ORDER**. Owner-reviewed CSVs become available only when all fields, quantities, line checks and project review checks pass.
- Net panel area and specified edge lengths, multiplied by furniture quantity and grouped by material and thickness. These are not sheet purchase quantities: no nesting, cutting waste, saw kerf or machining allowance is calculated.
- Browser-local persistence, downloadable JSON workspace backups and confirmed backup restore. Backups are schema validated and cannot import trusted approvals; restored projects and lines need fresh review. Reopening locally stored drafts uses that same fresh-review rule.
- Imports from a K3 code, KR8A design URL or downloaded design brief. Imports seed only the existing prototype component preview, retain their source code, and make the missing front/base/drawer/hardware information explicit.
- CSV cells are quoted and spreadsheet formula injection is neutralised. Imports are limited to 2 MB and bounded row/project counts.

## Ordering workflow

1. Create a manual project, or import a configurator design as an incomplete starting point.
2. Add or correct every panel and fitting against the approved construction drawings. Specify actual supplier board and edging codes, finished dimensions, grain and machining references. Include fronts, base/plinth and drawer-box parts as applicable; these are not automatically generated.
3. Enter supplier, order reference and furniture quantity. Review the multiplied quantities and material summary.
4. Check every line, enter the reviewer's name and complete the project review checklist. Confirm with the supplier how finished sizes, edging allowances and machining should be specified.
5. Mark that revision reviewed and export the owner-reviewed CSV. Send it to the supplier yourself for confirmation. Keep a JSON backup and the issued revision's CSV.

The interface sends no orders, emails or payment requests. An owner-reviewed spreadsheet is not a CNC program, an automated engineering approval or a secure server audit trail.

## Access and privacy

The workspace is available only in local development or a Vercel `preview` environment. It always returns 404 in production and unknown environments, even though its code is part of the application build. `lib/ownerAccess.ts` owns this boundary.

Vercel's existing project deployment SSO protects the current `*.vercel.app` previews (`all_except_custom_domains`). Do not attach a public custom domain to the owner preview. This is a preview access arrangement, not an implemented KR8A owner account system.

The route is dynamic, noindex/noarchive and private/no-store. It is excluded from public navigation, sitemap and the measurement allowlist. Component data stays in this browser's local storage until the owner downloads a file. No customer names, addresses or contact details are needed.

Local storage belongs to a specific browser and origin. A new unique preview URL has a different store. Use the stable branch URL and keep backups; browser data can still be cleared or unavailable. Corrupt stored data is not automatically overwritten during recovery. Backup replacement is a separate explicit action in the interface.

## Before enabling on the live site

- Add and test authenticated owner access with server-side enforcement and sign-out. Do not remove the production gate as a shortcut.
- Choose private persistent storage and a revision/audit model if projects must survive browser loss or be shared across devices. Production ordering approval must be enforced on the server, not inferred from browser state.
- Obtain the supplier's required spreadsheet format, panel/edge orientation conventions and finished-versus-cut-size rules. Add a versioned supplier export adapter with a supplier-reviewed reference order.
- Approve construction, material and hardware rules before generating complete lists automatically from configurator geometry. The existing prototype's limited `componentsPreview` must not become a production manufacturing compiler by renaming it.
- Complete a real reference component order and compare the supplier's confirmation to the exported revision before treating the workflow as production validated.

## Verification

42 automated tests currently pass, including panel validation, batch and edge arithmetic, material/thickness grouping, hardware totals, approval invalidation, draft/reviewed export gating, signed design imports, safe CSVs, backup validation and production route gating. Build, TypeScript and the 25-route/21-sitemap-entry site audit pass.

A production-build HTTP check returned 404, `X-Robots-Tag: noindex` and private/no-store for the owner route. The response contained no owner workspace content; the public sitemap contained no owner route.

Preview browser verification is recorded below after testing. No production deployment or supplier order is authorized by this document.
