# Product architecture

## One canonical design

`lib/sideboardEngine.ts` owns the versioned `SideboardConfig` shape, limits, options, normalization, bay proportions, serialization and customer summary. Dimensions are **millimetres** throughout this layer. Controls call `normalizeConfig` before updating state; URL imports and saved designs are normalized again at their entry points. The 3D scene converts millimetres to metres at its rendering boundary. This keeps the UI, geometry and review sheet aligned.

The current width range (1200–2400 mm) follows the supplied Claude prototype description. Height, depth, bay widths, panel thickness, reveals, bases, finishes and hardware are design-preview values. They are not manufacturing specifications. A production rules version must be introduced before taking payment or issuing CNC files.

## Price, order and manufacture

`lib/pricing.ts` defines a typed pricing boundary. With no approved rules it returns `unavailable`; the UI says “Price on enquiry.” Future pricing rules should run on the server, use an immutable rate-card version, and return integer pence. The server must validate the submitted configuration again and persist the exact configuration and pricing versions with the order.

A sensible order pipeline is:

1. Customer edits a versioned configuration and reviews the dimensions and options.
2. Server validates it against the current production rule set and calculates an authoritative quote.
3. Customer confirms delivery details, payment and the exact approved quote; the order stores a frozen design snapshot.
4. A separate manufacturing compiler converts that snapshot to a checked component specification, then a supplier-specific cut list after joinery, tolerances, grain direction, fittings and CNC constraints are approved.

The downloaded JSON is a **design brief only**. It is intentionally not called a cut list, production order, or quote. No order records, payment session, email delivery or supplier integration exist yet.

## Site and search

The homepage is indexable static HTML. The configurator is `noindex`, and `robots.txt` disallows it so arbitrary `?c=` links cannot create a crawl trap. The sitemap currently includes only the homepage. Future product landing pages should be curated, useful pages backed by a specific starting configuration and truthful product content; generated customer states should stay non-indexable.

The homepage 3D viewer loads only near the wall-fit section. The hero image is optimized by Next Image. The configurator loads its WebGL scene on the dedicated route.
