# Product architecture

## One canonical design

`lib/KR8AEngineRuntime.js` is the supplied Claude engine. It owns the prototype options, constraints, illustrative price, K3 share code, summary and component preview. `lib/sideboardEngine.ts` is a typed adapter that normalizes the versioned app configuration, maps older saved designs, and passes the same validated values to the UI and supplied viewer in `components/KR8AViewerRuntime.js`. Dimensions are **millimetres** through the application; the viewer converts to Three.js units at its rendering boundary.

The width range (1200–2400 mm), other limits, panel thickness, reveals, bases, finishes, hardware and geometry come from the supplied prototype. They are design-preview values, not approved manufacturing specifications. A production rules version must be introduced before taking payment or issuing CNC files.

## Price, order and manufacture

The supplied engine computes a live **illustrative** estimate so customers can see the prototype's pricing behaviour. `lib/pricing.ts` remains the separate authoritative pricing boundary; with no approved rules it returns `unavailable`. The review makes the distinction explicit. Future production pricing should run on the server, use an immutable rate-card version, and return integer pence. The server must validate the submitted configuration again and persist the exact configuration and pricing versions with the order.

A sensible order pipeline is:

1. Customer edits a versioned configuration and reviews the dimensions and options.
2. Server validates it against the current production rule set and calculates an authoritative quote.
3. Customer confirms delivery details, payment and the exact approved quote; the order stores a frozen design snapshot.
4. A separate manufacturing compiler converts that snapshot to a checked component specification, then a supplier-specific cut list after joinery, tolerances, grain direction, fittings and CNC constraints are approved.

The downloaded JSON is a **design brief only**. It is intentionally not called a cut list, production order, or quote. No order records, payment session, email delivery or supplier integration exist yet.

## Site and search

The homepage is indexable static HTML. The configurator is `noindex`, and `robots.txt` disallows it so arbitrary `?c=` links cannot create a crawl trap. The sitemap currently includes only the homepage. Future product landing pages should be curated, useful pages backed by a specific starting configuration and truthful product content; generated customer states should stay non-indexable.

The homepage 3D viewer loads only near the wall-fit section. The supplied reference imagery is optimized by Next Image. The configurator loads its WebGL scene on the dedicated route using locally bundled Three.js, without the prototype's esm.sh runtime dependency.
