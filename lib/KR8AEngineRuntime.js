/* KR8A sideboard product engine — framework-free, units in mm.
   config → validate → price → summary → serialise → component list.
   EVERYTHING here is ILLUSTRATIVE for the design prototype: limits, finishes, bases and pricing are not confirmed. */
const KR8A = (function () {
  const LIMITS = {
    width: { min: 1200, max: 2400, step: 10 },
    height: { min: 600, max: 900, step: 10 },
    depth: { min: 350, max: 550, step: 10 },
    bays: [2, 3, 4],
    bayWidth: { min: 350, max: 800 },
    drawerBayMax: 620, drawerMinCarcass: 400,
    panel: 18, front: 19, gap: 3
  };
  const FINISHES = [
    { id: 'oak', blurb: 'Warm, straight-grain oak.', name: 'Natural oak', family: 'Timber', base: '#B98A55', grain: '#84582F', strength: .6, rough: .6 },
    { id: 'smk', blurb: 'Oak darkened to a deep, even brown.', name: 'Smoked oak', family: 'Timber', base: '#745337', grain: '#46301F', strength: .55, rough: .58 },
    { id: 'wal', blurb: 'Rich, dark walnut with a soft figure.', name: 'Walnut', family: 'Timber', base: '#5E4231', grain: '#36241A', strength: .65, rough: .52 },
    { id: 'blk', blurb: 'Oak stained near-black, grain still visible.', name: 'Black oak', family: 'Timber', base: '#2B2724', grain: '#151311', strength: .55, rough: .62 },
    { id: 'wht', blurb: 'A soft, warm white paint.', name: 'Warm white', family: 'Painted', base: '#E9E3D7', strength: 0, rough: .8 },
    { id: 'grn', blurb: 'A deep, calm green paint.', name: 'Deep green', family: 'Painted', base: '#2F3D33', strength: 0, rough: .76 }
  ];
  const INTERIORS = [{ id: 'mat', name: 'Match exterior' }, { id: 'wht', name: 'Warm white' }, { id: 'blk', name: 'Black oak' }, { id: 'grn', name: 'Deep green' }];
  const BASES = [
    { id: 'mtl', name: 'Slim metal legs', note: 'Blackened steel, 14 mm', h: 150 },
    { id: 'leg', name: 'Timber legs', note: 'Tapered, in the cabinet finish', h: 160 },
    { id: 'plt', name: 'Recessed plinth', note: 'Low and grounded', h: 70 },
    { id: 'flt', name: 'Floating', note: 'Deep-set base, cabinet hovers', h: 110 }
  ];
  const HANDLES = [
    { id: 'psh', name: 'Handleless', note: 'Push to open' },
    { id: 'grp', name: 'Minimal pull', note: 'Grip routed into the top edge' },
    { id: 'bar', name: 'Architectural handle', note: 'Slim bronze bar' }
  ];
  const INSIDES = [
    { id: 'S', name: 'Shelves', note: 'Adjustable on a 32 mm hole line' },
    { id: 'I', name: 'Inner drawers', note: 'Two drawers behind the door' },
    { id: 'V', name: 'Record dividers', note: 'Upright slots for LPs and books' }
  ];
  const HARDWARE = { hinge: 'Concealed soft-close hinges', runner: 'Soft-close full-extension runners', pins: 'Metal shelf pins' }; // ILLUSTRATIVE
  const FRONTS = [{ id: 'D', name: 'Door' }, { id: 'R', name: 'Drawers' }, { id: 'O', name: 'Open' }];
  const PATTERNS = {
    2: ['DD', 'DR', 'RR', 'DO'],
    3: ['DDD', 'DRD', 'RDR', 'DOD'],
    4: ['DDDD', 'DRRD', 'RDDR', 'DOOD']
  };
  const PRICING = { // ILLUSTRATIVE ONLY — not commercial prices
    currency: 'GBP', base: 420, perSqM: 150,
    front: { D: 45, R: 160, O: 15 }, shelf: 20, light: 85, inside: { S: 0, I: 120, V: 40 },
    finish: { oak: 1, smk: 1.06, wal: 1.24, blk: 1.1, wht: .94, grn: .94 },
    interior: { mat: 0, wht: 35, blk: 35, grn: 35 },
    basePrice: { mtl: 90, leg: 60, plt: 0, flt: 70 },
    handle: { psh: 0, grp: 0, bar: 18 }
  };
  const DEFAULT = { w: 2000, h: 750, d: 450, fronts: ['D', 'D', 'D', 'D'], inside: ['S', 'S', 'S', 'S'], shelves: [1, 1, 1, 1], sp: 0, finish: 'oak', interior: 'mat', base: 'plt', handle: 'psh', light: 0 };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const byId = (list, id) => list.find(x => x.id === id) || list[0];
  const carcassHeight = c => c.h - byId(BASES, c.base).h;
  const bayWidthFor = (w, n) => (w - LIMITS.panel * 2 - LIMITS.gap * (n + 1)) / n;
  const bayWidth = c => bayWidthFor(c.w, c.fronts.length);
  function bayOptions(w) { return LIMITS.bays.filter(n => { const b = bayWidthFor(w, n); return b >= LIMITS.bayWidth.min && b <= LIMITS.bayWidth.max; }); }
  function bayReason(w, n) { const b = bayWidthFor(w, n); return b > LIMITS.bayWidth.max ? 'Doors too wide at this width' : b < LIMITS.bayWidth.min ? 'Doors too narrow at this width' : ''; }
  function frontAllowed(c, f) { return f !== 'R' || (bayWidth(c) <= LIMITS.drawerBayMax && carcassHeight(c) >= LIMITS.drawerMinCarcass); }

  function validate(input) {
    const c = Object.assign({}, DEFAULT, input || {}), notes = [];
    [['w', 'width'], ['h', 'height'], ['d', 'depth']].forEach(([k, n]) => { const L = LIMITS[n]; c[k] = clamp(Math.round((+c[k] || DEFAULT[k]) / L.step) * L.step, L.min, L.max); });
    c.finish = byId(FINISHES, c.finish).id; c.interior = byId(INTERIORS, c.interior).id;
    c.base = byId(BASES, c.base).id; c.handle = byId(HANDLES, c.handle).id;
    c.sp = clamp(+c.sp || 0, -50, 50); c.light = c.light ? 1 : 0;
    const opts = bayOptions(c.w); let n = (c.fronts || []).length;
    if (!opts.includes(n)) { const nn = opts.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a, opts[0]); notes.push(`${nn} bays at ${c.w} mm`); n = nn; }
    c.fronts = Array.from({ length: n }, (_, i) => (c.fronts || [])[i] || 'D');
    c.shelves = Array.from({ length: n }, (_, i) => clamp(+((c.shelves || [])[i] ?? 1), 0, 3));
    c.fronts = c.fronts.map(f => frontAllowed(c, f) ? f : (notes.push('Drawers swapped for doors at this size'), 'D'));
    c.inside = Array.from({ length: n }, (_, i) => { const v = (c.inside || [])[i] || 'S'; return c.fronts[i] === 'R' ? 'S' : (v === 'I' && carcassHeight(c) < 420) ? 'S' : ['S', 'I', 'V'].includes(v) ? v : 'S'; });
    c.shelves = c.shelves.map((s, i) => c.fronts[i] === 'R' || c.inside[i] === 'V' ? 0 : c.inside[i] === 'I' ? Math.min(s, 1) : s);
    return { config: c, notes: [...new Set(notes)] };
  }
  function price(c) {
    const P = PRICING, W = c.w / 10, H = c.h / 10, D = c.d / 10;
    let v = P.base + (2 * (W * D + H * D) + W * H * 2) / 10000 * P.perSqM;
    c.fronts.forEach(f => { v += P.front[f]; if (f !== 'O') v += P.handle[c.handle] * (f === 'R' ? 3 : 1); });
    c.shelves.forEach(s => v += s * P.shelf);
    c.inside.forEach((x, i) => { if (c.fronts[i] !== 'R') v += P.inside[x]; });
    v = v * P.finish[c.finish] + P.interior[c.interior] + P.basePrice[c.base] + (c.light ? P.light : 0);
    return { amount: Math.round(v / 10) * 10 - 5, currency: P.currency, illustrative: true };
  }
  const fmt = n => '£' + Math.round(n).toLocaleString('en-GB');
  function frontsText(c) {
    const d = c.fronts.filter(x => x === 'D').length, r = c.fronts.filter(x => x === 'R').length, o = c.fronts.filter(x => x === 'O').length;
    return [d && `${d} door${d > 1 ? 's' : ''}`, r && `${r * 3} drawers`, o && `${o} open bay${o > 1 ? 's' : ''}`].filter(Boolean).join(' · ');
  }
  function insideText(c) {
    const s = c.shelves.reduce((a, b) => a + b, 0), I = c.inside.filter((x, i) => x === 'I' && c.fronts[i] !== 'R').length, V = c.inside.filter((x, i) => x === 'V' && c.fronts[i] !== 'R').length;
    return [s && `${s} shel${s === 1 ? 'f' : 'ves'}`, I && `${I * 2} inner drawers`, V && `${V} record bay${V > 1 ? 's' : ''}`].filter(Boolean).join(' · ') || 'Clear';
  }
  function summary(c) {
    const f = byId(FINISHES, c.finish), s = c.shelves.reduce((a, b) => a + b, 0);
    return [
      ['Size', `${c.w} × ${c.h} × ${c.d} mm`],
      ['Layout', frontsText(c)],
      ['Finish', f.name],
      ['Base', byId(BASES, c.base).name],
      ['Opening', byId(HANDLES, c.handle).name],
      ['Inside', insideText(c)],
      ['Interior', `${c.interior === 'mat' ? f.name : byId(INTERIORS, c.interior).name}${c.light ? ' · lit' : ''}`],
      ['Hardware', 'Soft-close throughout']
    ];
  }
  function encode(c) { return ['K3', c.w, c.h, c.d, c.fronts.join(''), c.inside.join(''), c.shelves.join(''), c.sp, c.finish, c.interior, c.base, c.handle, c.light].join('-'); }
  function decode(s) {
    // The shelf offset is signed: splitting on '-' loses negative values.
    const match = /^K3-(\d{4})-(\d{3})-(\d{3})-([DRO]{2,4})-([SIV]{2,4})-([0-3]{2,4})-(-?\d{1,2}(?:\.\d+)?)-(oak|smk|wal|blk|wht|grn)-(mat|wht|blk|grn)-(mtl|leg|plt|flt)-(psh|grp|bar)-([01])$/.exec(String(s || ''));
    if (!match) return null;
    const p = ['K3', ...match.slice(1)];
    if (p[4].length !== p[5].length || p[4].length !== p[6].length) return null;
    return validate({ w: +p[1], h: +p[2], d: +p[3], fronts: p[4].split(''), inside: p[5].split(''), shelves: p[6].split('').map(Number), sp: +p[7], finish: p[8], interior: p[9], base: p[10], handle: p[11], light: +p[12] }).config;
  }
  function components(c) {
    const t = LIMITS.panel, ch = carcassHeight(c), bw = bayWidth(c), s = c.shelves.reduce((a, b) => a + b, 0);
    return [
      { part: 'Top', qty: 1, l: c.w, w: c.d, t }, { part: 'Bottom', qty: 1, l: c.w - 2 * t, w: c.d, t },
      { part: 'Side', qty: 2, l: ch - t, w: c.d, t }, { part: 'Divider', qty: c.fronts.length - 1, l: ch - 2 * t, w: c.d - 40, t },
      { part: 'Back', qty: 1, l: c.w - 2 * t, w: ch - 2 * t, t: 9 }, { part: 'Shelf', qty: s, l: Math.round(bw - 4), w: c.d - 60, t }
    ].filter(x => x.qty > 0);
  }
  function grainCanvas(f, W = 1024, H = 512) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'); x.fillStyle = f.base; x.fillRect(0, 0, W, H);
    let seed = f.id.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 2147483647;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const k = W / 1024;
    if (f.strength > 0) {
      for (let i = 0; i < 14; i++) { x.globalAlpha = .06 * f.strength; x.fillStyle = rnd() > .5 ? f.grain : '#fff'; x.fillRect(0, rnd() * H, W, (10 + rnd() * 50) * k); }
      for (let i = 0; i < 460; i++) {
        const y0 = rnd() * H, amp = (1.5 + rnd() * 9) * k, fr = (.0015 + rnd() * .005) / k, ph = rnd() * 6;
        x.strokeStyle = f.grain; x.globalAlpha = (.03 + rnd() * .15) * f.strength; x.lineWidth = (.35 + rnd() * 1.6) * k;
        x.beginPath();
        for (let px = 0; px <= W; px += 6) { const py = y0 + Math.sin(px * fr + ph) * amp + Math.sin(px * fr * 3.3 + ph) * amp * .3; px ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.stroke();
      }
      for (let i = 0; i < 70; i++) { x.globalAlpha = .05 * f.strength; x.fillStyle = f.grain; x.fillRect(rnd() * W, rnd() * H, (20 + rnd() * 140) * k, 1); }
    }
    const img = x.getImageData(0, 0, W, H), d = img.data, amp = f.strength > 0 ? 9 : 4;
    for (let i = 0; i < d.length; i += 4) { const n = (rnd() - .5) * amp; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    x.putImageData(img, 0, 0); x.globalAlpha = 1;
    return cv;
  }
  const swatchCache = {};
  function swatch(id) { if (!swatchCache[id]) swatchCache[id] = grainCanvas(byId(FINISHES, id), 256, 256).toDataURL('image/jpeg', .85); return swatchCache[id]; }

  return { INSIDES, HARDWARE, insideText, LIMITS, FINISHES, INTERIORS, BASES, HANDLES, FRONTS, PATTERNS, PRICING, DEFAULT, byId, bayOptions, bayReason, bayWidth, frontAllowed, carcassHeight, validate, price, fmt, frontsText, summary, encode, decode, components, grainCanvas, swatch };
})();
if (typeof window !== 'undefined') window.KR8A = KR8A;
export default KR8A;
