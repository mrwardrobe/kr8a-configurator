/* <kr8a-viewer> — lazy three.js renderer for a KR8A sideboard config (mm).
   Attrs/props: config (obj|JSON), view ('34'|'front'|'side'|'detail'|'grain'|'base'|'bay:N'),
   opened ('none'|'all'|'bay:N'), dims, idle, pad (px reserved at bottom for UI).
   Click any front to open/close it. Emits 'ready' and window 'kr8a-bay' {bay}. */
(function () {
  let libs = null;
  const load = () => libs || (libs = Promise.all([
    import('three'), import('three/examples/jsm/controls/OrbitControls.js'),
    import('three/examples/jsm/environments/RoomEnvironment.js'), import('three/examples/jsm/geometries/RoundedBoxGeometry.js')
  ]).then(([T, O, R, RB]) => ({ T, Orbit: O.OrbitControls, Room: R.RoomEnvironment, RBox: RB.RoundedBoxGeometry })));
  const bool = v => v === true || v === 'true';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = t => t * t * (3 - 2 * t);

  function planarUV(g, vert, ox, oy) {
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (az >= ax && az >= ay) { u = p.getX(i); v = p.getY(i); } else if (ay >= ax) { u = p.getX(i); v = p.getZ(i); } else { u = p.getZ(i); v = p.getY(i); }
      if (vert) [u, v] = [v, u];
      uv.setXY(i, u / 1.1 + ox, v / .55 + oy);
    }
    uv.needsUpdate = true; return g;
  }
  function shadowCanvas(blur) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); x.filter = `blur(${blur}px)`; x.fillStyle = '#000'; x.fillRect(56, 56, 144, 144); return c;
  }

  class KR8AViewer extends HTMLElement {
    static get observedAttributes() { return ['config', 'view', 'opened', 'dims', 'idle', 'pad', 'top', 'wall', 'spin', 'styled']; }
    constructor() { super(); Object.assign(this, { _cfg: null, _styled: true, _vis: true, _wall: 0, _spin: false, _view: '34', _spec: 'none', _dims: false, _idle: true, _dirty: 2, _last: performance.now(), _st: new Map(), _movers: [], _pad: 0, _padCur: 0 }); }
    set config(v) { if (!v) return; this._cfg = typeof v === 'string' ? JSON.parse(v) : v; this._poke(); this._sync(); }
    set view(v) { if (v && v !== this._view) { this._view = v; this._poke(); this._fly(); } }
    set opened(v) { v = v || 'none'; if (v !== this._spec) { this._spec = v; this._poke(); this._applySpec(); } }
    set dims(v) { this._dims = bool(v); if (this._svg) this._svg.style.opacity = this._dims ? 1 : 0; this._dirty = 2; }
    set top(v) { const p = Math.max(0, +v || 0); if (p !== this._top) { this._top = p; this._padMove = true; } }
    set wall(v) { this._wall = +v || 0; this._dirty = 2; }
    set spin(v) { this._spin = bool(v); this._poke(); }
    set styled(v) { const s = v !== false && v !== 'false'; if (s !== this._styled) { this._styled = s; if (this._ready) this._build(); } }
    set idle(v) { this._idle = v !== false && v !== 'false'; }
    set pad(v) { const p = Math.max(0, +v || 0); if (p !== this._pad) { this._pad = p; if (!this._r) this._padCur = p; this._padMove = true; } }
    attributeChangedCallback(n, o, v) { if (o !== v) this[n] = v; }
    _poke() { this._last = performance.now(); if (this._ctl) this._ctl.autoRotate = false; this._dirty = 2; }

    connectedCallback() {
      Object.assign(this.style, { display: 'block', position: 'relative', width: '100%', height: '100%', touchAction: 'none' });
      this._msg = document.createElement('div');
      Object.assign(this._msg.style, { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', font: '500 11px "JetBrains Mono", monospace', letterSpacing: '.14em', textTransform: 'uppercase', color: '#6A6259', pointerEvents: 'none' });
      this._msg.textContent = 'Preparing your sideboard';
      this.appendChild(this._msg);
      const start = () => load().then(L => this._init(L)).catch(() => { this._msg.textContent = '3D view unavailable — your specification is listed in the summary'; });
      if ('IntersectionObserver' in window) {
        this._vis = false;
        this._io = new IntersectionObserver(es => { this._vis = es[0].isIntersecting; if (this._vis) { if (!this._started) { this._started = true; start(); } this._dirty = 2; } }, { rootMargin: '150px' });
        this._io.observe(this);
      } else start();
    }
    disconnectedCallback() { this._dead = true; this._io && this._io.disconnect(); this._ro && this._ro.disconnect(); this._r && this._r.dispose(); }

    _init(L) {
      if (this._dead || this._r) return;
      const { T } = L; this.L = L;
      let r; try { r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); } catch (e) { this._msg.textContent = '3D view unavailable'; return; }
      this._r = r;
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = .96;
      r.shadowMap.enabled = true; r.shadowMap.type = T.VSMShadowMap;
      Object.assign(r.domElement.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', outline: 'none', cursor: 'grab' });
      r.domElement.setAttribute('role', 'img'); r.domElement.setAttribute('aria-label', '3D view of your sideboard. Drag to rotate, scroll or pinch to zoom, click a door or drawer to open it.');
      this.insertBefore(r.domElement, this._msg);
      this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Object.assign(this._svg.style, { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: this._dims ? 1 : 0, transition: 'opacity .5s ease', overflow: 'visible' });
      this.appendChild(this._svg);

      const s = this._scene = new T.Scene();
      s.environment = new T.PMREMGenerator(r).fromScene(new L.Room(), .04).texture; s.environmentIntensity = .42;
      const key = new T.DirectionalLight(0xfff1e0, 2.3); key.position.set(-1.8, 3.4, 2.6); key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.radius = 10; key.shadow.blurSamples = 16;
      Object.assign(key.shadow.camera, { left: -3.2, right: 3.2, top: 3, bottom: -3, near: .5, far: 11 }); s.add(key);
      const fill = new T.DirectionalLight(0xf1ece4, .5); fill.position.set(2.5, 1.5, 1.8); s.add(fill);
      s.add(new T.HemisphereLight(0xfffaf2, 0xd6cdbf, .32));
      const floor = new T.Mesh(new T.PlaneGeometry(16, 16), new T.MeshStandardMaterial({ color: '#DACEBA', roughness: .94 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
      this._wallM = new T.Mesh(new T.PlaneGeometry(16, 6), new T.MeshStandardMaterial({ color: '#E8E0D2', roughness: 1 }));
      this._wallM.position.set(0, 2.9, -.25); this._wallM.receiveShadow = true; s.add(this._wallM);
      this._contact = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadowCanvas(20)), transparent: true, depthWrite: false }));
      this._contact.rotation.x = -Math.PI / 2; this._contact.position.y = .0015; s.add(this._contact);

      this._cam = new T.PerspectiveCamera(26, 1, .05, 60);
      const c = this._ctl = new L.Orbit(this._cam, r.domElement);
      Object.assign(c, { enableDamping: true, dampingFactor: .075, enablePan: false, minAzimuthAngle: -1.45, maxAzimuthAngle: 1.45, minPolarAngle: .3, maxPolarAngle: Math.PI / 2 - .03, rotateSpeed: .55, zoomSpeed: .6, autoRotateSpeed: -.35 });
      c.addEventListener('change', () => this._dirty = 2);
      c.addEventListener('start', () => { this._flyS = null; this._poke(); });
      c.addEventListener('end', () => { this._last = performance.now(); });

      this._G = new T.Group(); s.add(this._G);
      this._mats = {};
      this._metal = new T.MeshStandardMaterial({ color: '#1d1b19', metalness: .8, roughness: .4 });
      this._zinc = new T.MeshStandardMaterial({ color: '#a8a7a3', metalness: .9, roughness: .35 });
      this._bronze = new T.MeshStandardMaterial({ color: '#7a5c3c', metalness: .9, roughness: .32 });
      this._hole = new T.MeshBasicMaterial({ color: '#2a2521', transparent: true, opacity: .55 });
      this._glow = new T.MeshBasicMaterial({ color: '#ffe2b8' });

      this._ray = new T.Raycaster(); this._ndc = new T.Vector2();
      const el = r.domElement;
      el.addEventListener('pointerdown', e => { this._down = [e.clientX, e.clientY]; el.style.cursor = 'grabbing'; });
      el.addEventListener('pointerup', e => {
        el.style.cursor = 'grab';
        if (this._down && Math.hypot(e.clientX - this._down[0], e.clientY - this._down[1]) < 6) this._click(e);
        this._down = null;
      });
      el.addEventListener('pointermove', e => { if (this._down || this._hoverQ) return; this._hoverQ = requestAnimationFrame(() => { this._hoverQ = 0; el.style.cursor = this._pick(e) ? 'pointer' : 'grab'; }); });

      this._ro = new ResizeObserver(() => this._resize()); this._ro.observe(this);
      this._ready = true; this._resize(); this._sync(true);
      this._msg.remove(); this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
      const loop = () => { if (this._dead) return; requestAnimationFrame(loop); if (this._vis) this._tick(); }; loop();
    }
    _resize() {
      if (!this._r) return; const w = this.clientWidth || 1, h = this.clientHeight || 1;
      this._r.setSize(w, h, false); this._cam.aspect = w / h; this._offset();
      if (this._cur) this._fly(true);
    }
    _offset() {
      const w = this.clientWidth || 1, h = this.clientHeight || 1, p = Math.max(-h * .3, Math.min((this._padCur || 0) - (this._top || 0), h * .6));
      if (Math.abs(p) > .5) this._cam.setViewOffset(w, h + Math.abs(p), 0, p > 0 ? p : 0, w, h); else this._cam.clearViewOffset();
      this._cam.updateProjectionMatrix(); this._dirty = 2;
    }
    _sync(first) {
      if (!this._ready || !this._cfg || !window.KR8A) return;
      const t = window.KR8A.validate(this._cfg).config, prev = this._t; this._t = t;
      if (!this._cur || first) { this._cur = { w: t.w, h: t.h, d: t.d }; this._build(); this._fly(true); return; }
      const same = prev && ['fronts', 'shelves', 'inside'].every(k => prev[k].join() === t[k].join()) && ['finish', 'interior', 'base', 'handle', 'sp', 'light'].every(k => prev[k] === t[k]);
      if (reduce()) this._cur = { w: t.w, h: t.h, d: t.d };
      if (!same || reduce()) this._build();
      if (prev && (prev.w !== t.w || prev.h !== t.h)) this._refit = true;
      if (prev && String(this._view).startsWith('bay:') && prev.fronts.length !== t.fronts.length) this._fly();
    }
    _mat(fid, key) {
      const K = window.KR8A, T = this.L.T, f = K.byId(K.FINISHES, fid), k = fid + key;
      if (!this._mats[k]) {
        const tex = new T.CanvasTexture(K.grainCanvas(f)); tex.colorSpace = T.SRGBColorSpace; tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.anisotropy = 8;
        const timber = f.strength > 0;
        this._mats[k] = new T.MeshPhysicalMaterial({ map: tex, bumpMap: tex, bumpScale: timber ? .5 : .12, roughness: f.rough, clearcoat: timber ? .1 : 0, clearcoatRoughness: .6, sheen: timber ? 0 : .2, sheenRoughness: .85, sheenColor: new T.Color('#fff') });
      }
      return this._mats[k];
    }
    _box(w, h, d, mat, x, y, z, vert, cast = true) {
      const { RBox, T } = this.L;
      const g = Math.min(w, h, d) > .005 ? planarUV(new RBox(w, h, d, 3, .002), vert, (x * 1.7 + z) % 1, (y * 2.1) % 1) : new T.BoxGeometry(w, h, d);
      const m = new T.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m;
    }
    _plain(geo, mat, x, y, z, parent) { const m = new this.L.T.Mesh(geo, mat); m.position.set(x, y, z); (parent || this._G).add(m); return m; }

    _build() {
      const K = window.KR8A, T = this.L.T, c = Object.assign({}, this._t, this._cur), G = this._G;
      G.traverse(o => { if (o.isMesh || o.isInstancedMesh) o.geometry.dispose(); }); G.clear();
      const ext = this._mat(c.finish, 'e'), int = c.interior === 'mat' ? ext : this._mat(c.interior, 'i');
      const W = c.w / 1000, H = c.h / 1000, D = c.d / 1000, t = .018, fT = .019, g = .003;
      const bH = K.byId(K.BASES, c.base).h / 1000, ch = H - bH, n = c.fronts.length;
      G.add(this._box(W, t, D, ext, 0, H - t / 2, 0));
      G.add(this._box(W - 2 * t, t, D, ext, 0, bH + t / 2, 0));
      [-1, 1].forEach(sx => G.add(this._box(t, ch - t, D, ext, sx * (W / 2 - t / 2), bH + (ch - t) / 2, 0, true)));
      G.add(this._box(W - 2 * t, ch - 2 * t, .009, int, 0, bH + ch / 2, -D / 2 + .012, true));
      const zl = -W / 2 + t, zw = W - 2 * t, fy0 = bH + t, fh = ch - 2 * t, fw = (zw - (n + 1) * g) / n, fhh = fh - 2 * g;
      const fz = D / 2 - .002 - fT / 2, inBack = -D / 2 + .017, inFront = D / 2 - .024, inD = inFront - inBack, inZ = (inBack + inFront) / 2;
      this._movers = []; this._bays = []; this._hits = [];
      const holes = [];
      const reg = (obj, key, kind, bay, extra) => { obj.userData = Object.assign({ key, kind, bay }, extra); this._movers.push(obj); obj.traverse(o => { if (o.isMesh) { o.userData.mover = obj; this._hits.push(o); } }); };
      for (let i = 0; i < n; i++) {
        const x0 = zl + g + i * (fw + g), xc = x0 + fw / 2, f = c.fronts[i], ins = c.inside[i];
        const iL = i > 0 ? x0 - g / 2 + t / 2 : zl, iR = i < n - 1 ? x0 + fw + g / 2 - t / 2 : W / 2 - t, iw = iR - iL, ix = (iL + iR) / 2;
        this._bays.push(xc);
        if (i > 0) G.add(this._box(t, fh, inD, int, x0 - g / 2, fy0 + fh / 2, inZ, true));
        // inside
        if (f !== 'R') {
          let shelfFloor = fy0;
          if (ins === 'I') {
            const ih = Math.min(.15, fh * .24);
            for (let k = 0; k < 2; k++) {
              const dg = new T.Group(), y = fy0 + .006 + ih / 2 + (1 - k) * (ih + .006);
              dg.position.set(ix, y, 0);
              const bd = inD - .04, w2 = iw - .03, fzI = inFront - .012;
              dg.add(this._box(w2 + .02, ih - .004, .016, int, 0, 0, fzI, false));
              dg.add(this._box(w2 * .3, .012, .004, this._hole, 0, ih / 2 - .018, fzI + .0085, false, false));
              dg.add(this._box(w2, .012, bd, int, 0, -ih / 2 + .012, fzI - .008 - bd / 2, false, false));
              [-1, 1].forEach(s2 => { dg.add(this._box(.012, ih - .03, bd, int, s2 * (w2 / 2 - .006), -.008, fzI - .008 - bd / 2, false, false)); this._plain(new T.BoxGeometry(.005, .009, bd * .96), this._zinc, s2 * (w2 / 2 + .0035), -ih / 2 + .02, fzI - .008 - bd / 2, dg); });
              dg.add(this._box(w2, ih - .03, .012, int, 0, -.008, fzI - .008 - bd, false, false));
              [-1, 1].forEach(s2 => this._plain(new T.BoxGeometry(.008, .012, inD - .01), this._zinc, ix + s2 * (iw / 2 - .004), y - ih / 2 + .02, inZ));
              G.add(dg); reg(dg, `${i}:i${k}`, 'drawer', i, { out: bd * .8, inner: true, k });
            }
            shelfFloor = fy0 + 2 * (ih + .006) + .02;
          }
          if (ins === 'V') {
            const cnt = Math.max(2, Math.floor(iw / .15)), vh = fh * .78;
            for (let k = 1; k <= cnt; k++) G.add(this._box(.01, vh, inD - .05, int, iL + (iw * k) / (cnt + 1), fy0 + vh / 2, inZ - .01, true));
          }
          const sh = c.shelves[i], span = fy0 + fh - shelfFloor, step = span / (sh + 1);
          for (let k = 1; k <= sh; k++) {
            const y = shelfFloor + step * k + (c.sp / 100) * step * .8 * (ins === 'I' ? 0 : 1);
            G.add(this._box(iw - .002, t, inD - .015, int, ix, y, inZ - .006));
            [iL + .004, iR - .004].forEach(px => [inBack + .037, inFront - .037].forEach(pz => { const pin = this._plain(new T.CylinderGeometry(.0025, .0025, .012, 8), this._zinc, px, y - t / 2 - .003, pz); pin.rotation.z = Math.PI / 2; }));
          }
          if (ins === 'S') for (let y = fy0 + .096; y < fy0 + fh - .06; y += .032) [inBack + .037, inFront - .037].forEach(z => { holes.push([iL + .0006, y, z, 1]); holes.push([iR - .0006, y, z, -1]); });
          if (c.light) {
            G.add(this._box(iw - .04, .004, .012, this._glow, ix, H - t - .004, inFront - .03, false, false));
            const pl = new T.PointLight(0xffd7a8, .35, .9, 1.6); pl.position.set(ix, H - t - .05, inFront - .06); G.add(pl);
          }
        }
        // fronts
        if (f === 'D') {
          const left = i < n / 2, piv = new T.Group();
          piv.position.set(left ? x0 : x0 + fw, fy0 + g + fhh / 2, D / 2 - .002);
          this._front(piv, fw, fhh, fT, ext, left ? fw / 2 : -fw / 2, 0, -fT / 2, c.handle, false, left ? fw - .05 : -fw + .05);
          const hx = left ? .024 : -.024, hn = fhh > .62 ? 3 : 2;
          for (let k = 0; k < hn; k++) {
            const hy = -fhh / 2 + .09 + (k * (fhh - .18)) / (hn - 1);
            const cup = this._plain(new T.CylinderGeometry(.0175, .0175, .004, 24), this._zinc, hx, hy, -fT - .002, piv); cup.rotation.x = Math.PI / 2;
            this._plain(new T.BoxGeometry(.014, .03, .004), this._zinc, hx + (left ? .012 : -.012), hy, -fT - .003, piv);
            const sideX = left ? iL + .005 : iR - .005;
            this._plain(new T.BoxGeometry(.006, .02, .05), this._zinc, sideX, fy0 + g + fhh / 2 + hy, inFront - .03);
            this._plain(new T.BoxGeometry(.012, .012, .05), this._zinc, sideX + (left ? .008 : -.008), fy0 + g + fhh / 2 + hy, inFront - .008);
          }
          G.add(piv); reg(piv, `${i}:d`, 'door', i, { dir: left ? -1 : 1 });
        } else if (f === 'R') {
          const dh = (fhh - 2 * g) / 3;
          for (let k = 0; k < 3; k++) {
            const dg = new T.Group(), y = fy0 + g + dh / 2 + (2 - k) * (dh + g); dg.position.set(xc, y, 0);
            this._front(dg, fw, dh, fT, ext, 0, 0, fz, c.handle, true, 0);
            const bd = inD - .03, bz = fz - fT / 2 - bd / 2, bh = dh - .05, w2 = iw - .03;
            dg.add(this._box(w2, .012, bd, int, ix - xc, -dh / 2 + .03, bz, false, false));
            [-1, 1].forEach(s2 => { dg.add(this._box(.012, bh, bd, int, ix - xc + s2 * (w2 / 2 - .006), -.005, bz, false, false)); this._plain(new T.BoxGeometry(.005, .009, bd * .96), this._zinc, ix - xc + s2 * (w2 / 2 + .0035), -dh / 2 + .03, bz, dg); });
            dg.add(this._box(w2, bh, .012, int, ix - xc, -.005, bz - bd / 2, false, false));
            [-1, 1].forEach(s2 => this._plain(new T.BoxGeometry(.008, .012, inD - .01), this._zinc, ix + s2 * (iw / 2 - .004), y - dh / 2 + .03, inZ));
            G.add(dg); reg(dg, `${i}:r${k}`, 'drawer', i, { out: bd * .85, k });
          }
        }
      }
      if (holes.length) {
        const im = new T.InstancedMesh(new T.CircleGeometry(.0026, 10), this._hole, holes.length), m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1), up = new T.Vector3(0, 1, 0);
        holes.forEach(([x, y, z, s2], j) => { q.setFromAxisAngle(up, s2 * Math.PI / 2); m4.compose(new T.Vector3(x, y, z), q, sc); im.setMatrixAt(j, m4); });
        G.add(im);
      }
      let contact = .6, spread = 1.5;
      const add = (geo, mat, x, y, z) => { const m = this._plain(geo, mat, x, y, z); m.castShadow = true; return m; };
      if (c.base === 'plt') G.add(this._box(W - .05, bH, D - .05, ext, 0, bH / 2, -.012));
      else if (c.base === 'flt') { G.add(this._box(W - .26, bH, D - .2, this._metal, 0, bH / 2, -.02, false)); contact = .75; spread = 1.25; }
      else if (c.base === 'leg') {
        const lx = W / 2 - .07, lz = D / 2 - .07, xs = W > 1.7 ? [-lx, 0, lx] : [-lx, lx];
        xs.forEach(x => [-lz, lz].forEach(z => add(planarUV(new T.CylinderGeometry(.019, .012, bH, 28), true, 0, 0), ext, x, bH / 2, z)));
        contact = .35;
      } else {
        const lx = W / 2 - .035, lz = D / 2 - .045, xs = W > 1.8 ? [-lx, 0, lx] : [-lx, lx];
        xs.forEach(x => [-lz, lz].forEach(z => add(new T.BoxGeometry(.014, bH, .014), this._metal, x, bH / 2, z)));
        [-lz, lz].forEach(z => add(new T.BoxGeometry(W - .07, .01, .014), this._metal, 0, bH - .005, z));
        contact = .3;
      }
      if (this._wallM) this._wallM.position.z = -D / 2 - .015;
      if (this._styled) this._props(G, W, H);
      this._contact.scale.set(W * spread + .2, D * spread * 1.4 + .2, 1); this._contact.material.opacity = contact;
      this._applySpec(true); this._pose_movers(); this._dirty = 2;
    }
    _props(G, W, H) {
      const T = this.L.T, cer = new T.MeshStandardMaterial({ color: '#EAE3D6', roughness: .7 }), dk = new T.MeshStandardMaterial({ color: '#2B2724', roughness: .55 });
      const lathe = (pts, mat, x, z) => { const m = new T.Mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), 48), mat); m.position.set(x, H, z); m.castShadow = true; m.receiveShadow = true; G.add(m); };
      lathe([[0, 0], [.04, 0], [.066, .05], [.072, .115], [.055, .185], [.028, .245], [.03, .285], [.022, .285], [.0, .27]], cer, W * .32, -.02);
      lathe([[0, 0], [.04, 0], [.085, .03], [.115, .065], [.11, .07], [.09, .045], [0, .04]], dk, -W * .06, .03);
      const cols = ['#7B6853', '#BDB2A0', '#3F4A44', '#9A6B4F']; let y = H;
      cols.slice(0, 3).forEach((c, i) => { const hh = .03 + i * .004, b = new T.Mesh(new T.BoxGeometry(.27 - i * .015, hh, .2), new T.MeshStandardMaterial({ color: c, roughness: .8 })); b.position.set(-W * .34, y + hh / 2, 0); b.rotation.y = (i - 1) * .12; b.castShadow = true; G.add(b); y += hh; });
    }
    _front(parent, w, h, d, mat, x, y, z, handle, drawer, kx) {
      const T = this.L.T;
      if (handle === 'grp') {
        const lip = .024;
        parent.add(this._box(w, h - lip, d, mat, x, y - lip / 2, z, !drawer));
        parent.add(this._box(w, lip, d * .3, mat, x, y + h / 2 - lip / 2, z - d * .35, false));
      } else parent.add(this._box(w, h, d, mat, x, y, z, !drawer));
      if (handle === 'bar') {
        const L = drawer ? Math.min(.16, w * .35) : Math.min(.2, h * .35), by = drawer ? y + h * .18 : y + h / 2 - .06 - L / 2, bx = drawer ? x : kx;
        const bar = this._plain(drawer ? new T.BoxGeometry(L, .008, .008) : new T.BoxGeometry(.008, L, .008), this._bronze, bx, by, z + d / 2 + .02, parent); bar.castShadow = true;
        [-1, 1].forEach(s => this._plain(new T.BoxGeometry(.006, .006, .02), this._bronze, drawer ? bx + s * L * .4 : bx, drawer ? by : by + s * L * .4, z + d / 2 + .01, parent));
      }
    }
    _goalFor(m) {
      const sp = this._spec;
      if (sp === 'all') return 1;
      if (sp.startsWith('bay:')) return m.userData.bay === +sp.slice(4) ? 1 : 0;
      return 0;
    }
    _applySpec(keep) {
      (this._movers || []).forEach(m => {
        const u = m.userData; let st = this._st.get(u.key);
        const goal = this._goalFor(m);
        if (!st) { st = { t: keep && this._built ? 0 : goal, goal, delay: 0 }; this._st.set(u.key, st); }
        if (keep && this._built && st.goal === goal) return;
        this._setGoal(u, st, goal);
      });
      this._built = true;
    }
    _setGoal(u, st, goal) {
      if (st.goal === goal && st.t === goal) return;
      st.goal = goal;
      st.delay = reduce() ? 0 : goal ? (u.inner ? 24 + u.k * 6 : u.kind === 'drawer' ? u.k * 7 : 0) : (u.kind === 'door' && this._hasInner(u.bay) ? 16 : u.kind === 'drawer' && !u.inner ? (2 - u.k) * 5 : 0);
      this._dirty = 2;
    }
    _hasInner(bay) { return this._movers.some(m => m.userData.inner && m.userData.bay === bay && this._st.get(m.userData.key).t > .01); }
    _pick(e) {
      if (!this._hits || !this._hits.length) return null;
      const rc = this._r.domElement.getBoundingClientRect();
      this._ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      this._ray.setFromCamera(this._ndc, this._cam);
      const hit = this._ray.intersectObjects(this._hits, false)[0];
      return hit ? hit.object.userData.mover : null;
    }
    _click(e) {
      const m = this._pick(e); if (!m) return;
      const u = m.userData, st = this._st.get(u.key), goal = st.goal ? 0 : 1;
      this._setGoal(u, st, goal);
      if (u.kind === 'door') this._movers.filter(x => x.userData.inner && x.userData.bay === u.bay).forEach(x => this._setGoal(x.userData, this._st.get(x.userData.key), goal));
      if (u.inner && goal) { const d = this._movers.find(x => x.userData.kind === 'door' && x.userData.bay === u.bay); if (d) { const ds = this._st.get(d.userData.key); if (!ds.goal) { this._setGoal(d.userData, ds, 1); st.delay = 24; } } }
      this._poke();
      window.dispatchEvent(new CustomEvent('kr8a-bay', { detail: { bay: u.bay, open: !!goal } }));
    }
    _step() {
      let moving = false;
      this._movers.forEach(m => {
        const st = this._st.get(m.userData.key); if (!st || st.t === st.goal) return;
        moving = true;
        if (st.delay > 0) { st.delay--; return; }
        if (reduce()) { st.t = st.goal; return; }
        if (st.goal > st.t) st.t = Math.min(1, st.t + Math.max(.012, (1 - st.t) * .085));
        else st.t = Math.max(0, st.t - (st.t > .14 ? Math.max(.022, st.t * .09) : .0042)); // soft-close: last stretch eases in on the damper
        if (Math.abs(st.t - st.goal) < .002) st.t = st.goal;
      });
      if (moving) this._pose_movers();
      return moving;
    }
    _pose_movers() {
      this._movers.forEach(m => {
        const st = this._st.get(m.userData.key), t = st ? st.t : 0, u = m.userData;
        if (u.kind === 'door') m.rotation.y = u.dir * smooth(t) * 1.72;
        else m.position.z = u.out * t;
      });
    }
    _pose() {
      const K = window.KR8A, T = this.L.T, c = this._t, W = c.w / 1000, H = c.h / 1000, D = c.d / 1000;
      const bH = K.byId(K.BASES, c.base).h / 1000, fov = this._cam.fov * Math.PI / 180, a = this._cam.aspect || 1.5;
      const hh = this.clientHeight || 1, full = hh + Math.abs(Math.max(-hh * .3, Math.min((this._pad || 0) - (this._top || 0), hh * .6))), k = Math.max(.12, (hh - (this._pad || 0) - (this._top || 0) - 20) / full);
      const fit = Math.max((H * 1.22) / (2 * Math.tan(fov / 2) * k), ((W + D * .9) * 1.1) / (2 * Math.tan(fov / 2) * a), 1.3);
      let P;
      if (String(this._view).startsWith('bay:')) {
        const bi = +this._view.slice(4), bx = (this._bays || [])[bi] || 0, bw = W / c.fronts.length;
        P = [-.2 - (bx > 0 ? -.12 : .12), .2, Math.max(.6, Math.min(.9, (bw * 3.2) / W)), bx, bH + (H - bH) * .5, D * .2];
      } else P = {
        '34': [-.62, .2, 1, 0, H * .46, 0], front: [0, .04, 1, 0, H * .48, 0], side: [-1.32, .1, .9, 0, H * .46, 0],
        detail: [-.42, .14, .34, W * .22, H - .1, D / 2], grain: [-.18, .12, .62, -W * .12, H * .6, D / 2],
        base: [-.5, .02, .55, -W * .28, bH * .7 + .04, D / 2]
      }[this._view] || [-.62, .2, 1, 0, H * .46, 0];
      const dist = fit * Math.min(1, P[2] * (a < 1 ? 1.7 : 1)), tg = new T.Vector3(P[3], P[4], P[5]);
      const pos = new T.Vector3(tg.x + Math.sin(P[0]) * Math.cos(P[1]) * dist, tg.y + Math.sin(P[1]) * dist, tg.z + Math.cos(P[0]) * Math.cos(P[1]) * dist);
      this._ctl.minDistance = Math.min(dist, fit) * .3; this._ctl.maxDistance = fit * 1.9;
      return { pos, tg };
    }
    _fly(instant) {
      if (!this._cam || !this._t) return;
      const { pos, tg } = this._pose();
      if (instant || reduce()) { this._cam.position.copy(pos); this._ctl.target.copy(tg); this._ctl.update(); this._dirty = 2; return; }
      this._flyS = { p0: this._cam.position.clone(), t0: this._ctl.target.clone(), p1: pos, t1: tg, k: 0 };
    }
    _drawDims() {
      if (!this._t || !this._svg) return;
      const T = this.L.T, c = Object.assign({}, this._t, this._cur), W = c.w / 1000, H = c.h / 1000, D = c.d / 1000;
      const w = this.clientWidth, h = this.clientHeight;
      const pr = (x, y, z) => { const v = new T.Vector3(x, y, z).project(this._cam); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h]; };
      const off = .09;
      const lines = [
        { a: pr(-W / 2, 0, D / 2 + off), b: pr(W / 2, 0, D / 2 + off), e: [[pr(-W / 2, 0, D / 2), pr(-W / 2, 0, D / 2 + off + .02)], [pr(W / 2, 0, D / 2), pr(W / 2, 0, D / 2 + off + .02)]], t: Math.round(c.w) },
        { a: pr(-W / 2 - off, 0, D / 2), b: pr(-W / 2 - off, H, D / 2), e: [[pr(-W / 2, H, D / 2), pr(-W / 2 - off - .02, H, D / 2)], [pr(-W / 2, 0, D / 2), pr(-W / 2 - off - .02, 0, D / 2)]], t: Math.round(c.h) },
        { a: pr(W / 2 + off, 0, -D / 2), b: pr(W / 2 + off, 0, D / 2), e: [[pr(W / 2, 0, -D / 2), pr(W / 2 + off + .02, 0, -D / 2)], [pr(W / 2, 0, D / 2), pr(W / 2 + off + .02, 0, D / 2)]], t: Math.round(c.d) }
      ];
      let html = '';
      const stroke = 'stroke="#1B1916" stroke-width="1"';
      lines.forEach(L => {
        const [ax, ay] = L.a, [bx, by] = L.b, len = Math.hypot(bx - ax, by - ay); if (len < 30) return;
        const ux = (bx - ax) / len, uy = (by - ay) / len, nx = -uy * 5, ny = ux * 5;
        L.e.forEach(([p, q]) => html += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#1B1916" stroke-opacity=".28" stroke-width="1"/>`);
        html += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" ${stroke}/>`;
        [[ax, ay], [bx, by]].forEach(([x, y]) => html += `<line x1="${x - ux * 4 - nx}" y1="${y - uy * 4 - ny}" x2="${x + ux * 4 + nx}" y2="${y + uy * 4 + ny}" ${stroke}/>`);
        const mx = (ax + bx) / 2, my = (by + ay) / 2, label = `${L.t} mm`, lw = label.length * 7.2 + 14;
        html += `<rect x="${mx - lw / 2}" y="${my - 10}" width="${lw}" height="20" fill="#ECE7DF"/><text x="${mx}" y="${my + 4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing=".04em" fill="#1B1916">${label}</text>`;
      });
      if (this._wall > 0) {
        const WL = this._wall / 1000, wy = H + .15, ink = '#1B1916';
        const A = pr(-WL / 2, wy, -D / 2), Bp = pr(WL / 2, wy, -D / 2), A0 = pr(-WL / 2, 0, -D / 2), B0 = pr(WL / 2, 0, -D / 2);
        html += `<line x1="${A0[0]}" y1="${A0[1]}" x2="${A[0]}" y2="${A[1] - 8}" stroke="${ink}" stroke-opacity=".35" stroke-dasharray="3 4"/><line x1="${B0[0]}" y1="${B0[1]}" x2="${Bp[0]}" y2="${Bp[1] - 8}" stroke="${ink}" stroke-opacity=".35" stroke-dasharray="3 4"/>`;
        html += `<line x1="${A[0]}" y1="${A[1]}" x2="${Bp[0]}" y2="${Bp[1]}" stroke="${ink}"/>`;
        const lab = (x, y, t) => { const lw = t.length * 7.2 + 14; return `<rect x="${x - lw / 2}" y="${y - 10}" width="${lw}" height="20" fill="rgba(236,231,223,.94)"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="${ink}">${t}</text>`; };
        html += lab((A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2, 'Your space ' + Math.round(this._wall) + ' mm');
        const g = Math.round((this._wall - c.w) / 2);
        if (g > 5) { const my = H * .55, l1 = pr(-WL / 2, my, -D / 2), l2 = pr(-W / 2, my, -D / 2), r1 = pr(W / 2, my, -D / 2), r2 = pr(WL / 2, my, -D / 2);
          html += `<line x1="${l1[0]}" y1="${l1[1]}" x2="${l2[0]}" y2="${l2[1]}" stroke="${ink}"/><line x1="${r1[0]}" y1="${r1[1]}" x2="${r2[0]}" y2="${r2[1]}" stroke="${ink}"/>`;
          if (Math.abs(l2[0] - l1[0]) > 34) html += lab((l1[0] + l2[0]) / 2, l1[1] - 14, g + ''); if (Math.abs(r2[0] - r1[0]) > 34) html += lab((r1[0] + r2[0]) / 2, r1[1] - 14, g + ''); }
      }
      this._svg.innerHTML = html;
    }
    _tick() {
      if (!this._r || !this._t) return;
      let anim = this._step();
      if (this._padMove) {
        const g = this._pad || 0; this._padCur += (g - this._padCur) * .14;
        if (Math.abs(g - this._padCur) < .5 || reduce()) { this._padCur = g; this._padMove = false; if (!this._flyS) this._fly(); }
        this._offset(); anim = true;
      }
      const cu = this._cur, t = this._t;
      if (cu && (cu.w !== t.w || cu.h !== t.h || cu.d !== t.d)) {
        ['w', 'h', 'd'].forEach(k => { cu[k] += (t[k] - cu[k]) * .22; if (Math.abs(t[k] - cu[k]) < .5) cu[k] = t[k]; });
        this._build(); anim = true;
      }
      if (this._refit && !this._flyS && cu.w === t.w && cu.h === t.h) { this._refit = false; this._fly(); }
      if (this._flyS) {
        const f = this._flyS; f.k = Math.min(1, f.k + .028); const e = 1 - Math.pow(1 - f.k, 3);
        this._cam.position.lerpVectors(f.p0, f.p1, e); this._ctl.target.lerpVectors(f.t0, f.t1, e);
        if (f.k >= 1) this._flyS = null; anim = true;
      }
      if (this._idle && !reduce() && !this._ctl.autoRotate && performance.now() - this._last > (this._spin ? 700 : 7000) && this._view === '34' && !this._flyS) { this._ctl.autoRotate = true; this._ctl.autoRotateSpeed = .45; }
      if (this._ctl.autoRotate) { const a = this._ctl.getAzimuthalAngle(); if (a < -.95) this._ctl.autoRotateSpeed = -.45; else if (a > -.3) this._ctl.autoRotateSpeed = .45; anim = true; }
      this._ctl.update();
      if (anim || this._dirty > 0) { this._r.render(this._scene, this._cam); if (this._dims) this._drawDims(); this._dirty--; }
    }
  }
  if (!customElements.get('kr8a-viewer')) customElements.define('kr8a-viewer', KR8AViewer);
})();
export {};
