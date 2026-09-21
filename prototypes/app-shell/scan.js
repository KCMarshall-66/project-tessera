/* Continuous-scanning visuals for the app: the Tessera mosaic (Dashboard) and
   the signal flow (Monitoring & Alerts). Ported from the exploration in
   ../explorations/continuous-scanning.html. Exposes window.TesseraScan.

   All signals, vendors and counts are fictional sample data. The four scripted
   signals below are replayed on a timer (and on the "Simulate a signal" button)
   to stand in for the real scanning service. */
(function (global) {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCAN = 5; // seconds per mosaic pass; matches --scan-pass in scan.css

  /* Scripted signals. Vendors, tiers and owners match vendors.html; src is the index
     of the public-internet source in the signal flow; impact is the points the new task
     adds to the Dashboard's portfolio risk score (sample values). */
  var SIGNALS = [
    { vendor: 'Vantage Identity Verify', sub: 'Identity & Access · US + EU', sev: 'critical', category: 'Credential exposure', title: 'Live API keys found in a public code repository',           source: 'Public code repositories',      src: 1, conf: 94, sla: '4 hours',  owner: 'Priya N.',  tier: 'high',   impact: 2.0 },
    { vendor: 'Solace Payments API',     sub: 'Payments · US',              sev: 'critical', category: 'Data breach',         title: 'Customer records appear in a newly posted breach dump',      source: 'Breach dumps & paste sites',    src: 0, conf: 89, sla: '4 hours',  owner: 'Priya N.',  tier: 'high',   impact: 1.9 },
    { vendor: 'Vertex Analytics',        sub: 'Data Platform · US',         sev: 'high',     category: 'Vulnerability',       title: 'Critical CVE unpatched on an internet-facing server',        source: 'Internet-wide scans',           src: 4, conf: 91, sla: '24 hours', owner: 'Marcus C.', tier: 'medium', impact: 0.8 },
    { vendor: 'Cascade CRM',             sub: 'Sales Tooling · Canada',     sev: 'high',     category: 'Exposed service',     title: 'Staging server found through certificate logs, no login',    source: 'Certificate transparency logs', src: 3, conf: 88, sla: '24 hours', owner: 'Marcus C.', tier: 'high',   impact: 1.0 }
  ];

  /* ---------- Small helpers ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function ago(ms) { var s = Math.round(ms / 1000); return s < 45 ? 'Just now' : s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min ago' : Math.round(s / 3600) + ' h ago'; }

  /* ---------- The 612-vendor portfolio behind the mosaic ---------- */
  // The 24 vendors from vendors.html keep their real names and tiers; the other
  // 588 get generated names. Tier totals match the Dashboard's stat card.
  var REAL = [
    ['Ironclad Identity', 'critical'], ['Northwind AI Labs', 'critical'], ['Harborlight Cloud', 'critical'], ['Glasswing Contract AI', 'critical'],
    ['Solace Payments API', 'high'], ['Cascade CRM', 'high'], ['Fortify Endpoint Security', 'high'], ['Keystone Payroll', 'high'], ['Onyx Fraud Detection', 'high'], ['Vantage Identity Verify', 'high'],
    ['Vertex Analytics', 'medium'], ['Nimbus Cloud Storage', 'medium'], ['Aurora HR Suite', 'medium'], ['Meridian Comms', 'medium'], ['Lattice Data Warehouse', 'medium'], ['Sentinel Background Checks', 'medium'], ['Coppermill Payments', 'medium'], ['Foundry DevOps Platform', 'medium'],
    ['Beacon Legal Docs', 'low'], ['Pulsecheck Support Desk', 'low'], ['Driftwood Marketing Suite', 'low'], ['Quartzline Analytics', 'low'], ['Bramblecore Ticketing', 'low'], ['Wren Legal Research', 'low']
  ];
  var PRE = ['Alder', 'Brightwave', 'Calder', 'Dunmore', 'Ember', 'Fable', 'Gantry', 'Hollis', 'Indigo', 'Juniper', 'Kestrel', 'Lumen', 'Marlow', 'Nettle', 'Orchard', 'Pinnacle', 'Quill', 'Ridgeway', 'Slate', 'Talon', 'Umber', 'Vireo', 'Willow', 'Yarrow', 'Zephyr', 'Ashgrove', 'Bluffton', 'Copperfield', 'Deepwell', 'Elmstead', 'Fernhill', 'Greystone', 'Harrowgate', 'Ivybridge', 'Jadestone', 'Kingfisher', 'Larkspur', 'Millbrook', 'Northgate', 'Oakhaven'];
  var SUF = ['Payments', 'Cloud', 'Analytics', 'Identity', 'Logistics', 'Secure', 'HR Suite', 'Data', 'Support Desk', 'Legal', 'Marketing', 'DevOps', 'Health', 'Billing', 'Telecom', 'Insights'];
  var TIER_TOTALS = { critical: 24, high: 118, medium: 302, low: 168 };

  function portfolio(N) {
    var r = rng(101), i, j;
    var names = [];
    for (i = 0; i < PRE.length; i++) for (j = 0; j < SUF.length; j++) names.push(PRE[i] + ' ' + SUF[j]);
    shuffle(names, r);
    var tiers = [], left = {};
    for (var t in TIER_TOTALS) left[t] = TIER_TOTALS[t];
    REAL.forEach(function (v) { left[v[1]]--; });
    for (var k in left) for (i = 0; i < left[k]; i++) tiers.push(k);
    shuffle(tiers, r);

    var list = [];
    REAL.forEach(function (v) { list.push({ name: v[0], tier: v[1], real: true }); });
    for (i = 0; list.length < N; i++) list.push({ name: names[i], tier: tiers[i], real: false });
    shuffle(list, r);
    var byName = {};
    list.forEach(function (v, idx) { byName[v.name] = idx; });
    return { list: list, byName: byName };
  }

  /* ---------- Investigation task queue ---------- */
  function taskCard(s, ts, isNew) {
    var el = mk('article', 'scan-task scan-task--' + s.sev + (isNew ? ' is-new' : ''));
    el.dataset.t = ts;
    el.innerHTML =
      '<div class="scan-task__top"><span class="scan-sev scan-sev--' + s.sev + '">' + cap(s.sev) + '</span><span>' + s.category + '</span><span class="scan-task__time">' + ago(Date.now() - ts) + '</span></div>' +
      '<h4 class="scan-task__vendor">' + s.vendor + '</h4>' +
      '<p class="scan-task__title">' + s.title + '</p>' +
      '<div class="scan-task__meta"><span>Source · ' + s.source + '</span><span>AI confidence ' + s.conf + '%</span></div>' +
      '<div class="scan-task__foot"><span class="scan-task__sla">Respond within ' + s.sla + '</span><span>Suggested · ' + s.owner + '</span><button type="button" class="scan-task__open">Open task</button></div>';
    return el;
  }
  setInterval(function () {
    document.querySelectorAll('.scan-task[data-t] .scan-task__time').forEach(function (t) {
      t.textContent = ago(Date.now() - Number(t.closest('.scan-task').dataset.t));
    });
  }, 5000);

  function queue(list, opts) {
    var max = (opts && opts.max) || 3;
    function trim() { while (list.children.length > max) list.lastElementChild.remove(); }
    return {
      // items: [{ signal, agoMs }], oldest last
      seed: function (items) { items.forEach(function (it) { list.appendChild(taskCard(it.signal, Date.now() - it.agoMs, false)); }); trim(); },
      push: function (s) { list.insertBefore(taskCard(s, Date.now(), !REDUCE), list.firstChild); trim(); }
    };
  }

  /* ---------- Runner: visibility, auto-replay, demo button ---------- */
  function runner(panel, fire, opts) {
    opts = opts || {};
    var btn = opts.button || null;
    var st = { busy: false, visible: false, started: false, i: 0, auto: 0 };
    var auto = !REDUCE && opts.auto !== false;

    function go(isAuto) {
      if (st.busy) return;
      st.busy = true; if (btn) btn.disabled = true;
      if (isAuto) st.auto++;
      var s = SIGNALS[st.i++ % SIGNALS.length];
      fire(s, function () { st.busy = false; if (btn) btn.disabled = false; });
    }
    if (btn) btn.addEventListener('click', function () { go(false); });

    new IntersectionObserver(function (entries) {
      st.visible = entries[0].isIntersecting;
      panel.classList.toggle('is-paused', !st.visible);
      if (st.visible && !st.started && auto) { st.started = true; setTimeout(function () { go(true); }, opts.firstDelay || 2500); }
    }, { threshold: 0.25 }).observe(panel);

    if (auto) {
      setInterval(function () {
        if (st.visible && !document.hidden && st.auto < (opts.maxAuto || 4)) go(true);
      }, opts.interval || 14000);
    }
    return { go: function () { go(false); } };
  }

  /* ---------- Tessera mosaic ---------- */
  var RED = ['Ironclad Identity', 'Northwind AI Labs', 'Harborlight Cloud', 'Glasswing Contract AI', 'Keystone Payroll', 'Fortify Endpoint Security', 'Onyx Fraud Detection'];
  var AMBER = ['Aurora HR Suite', 'Meridian Comms', 'Lattice Data Warehouse', 'Sentinel Background Checks', 'Coppermill Payments', 'Foundry DevOps Platform', 'Beacon Legal Docs', 'Solace Payments API', 'Cascade CRM'];
  var AMBER_EXTRA = 6; // generated vendors, to reach 15 open findings

  function mosaic(root, opts) {
    opts = opts || {};
    var COLS = opts.cols || 34, N = 612;
    var grid = mk('div', 'mosaic__grid'), bar = mk('div', 'mosaic__bar'), tip = mk('div', 'mosaic__tip');
    grid.style.gridTemplateColumns = 'repeat(' + COLS + ', 1fr)';
    root.appendChild(grid); root.appendChild(bar); root.appendChild(tip);

    var port = portfolio(N), r = rng(29), tiles = [];
    var redSet = {}, amberSet = {};
    RED.forEach(function (n) { redSet[port.byName[n]] = 1; });
    AMBER.forEach(function (n) { amberSet[port.byName[n]] = 1; });
    for (var added = 0; added < AMBER_EXTRA;) {
      var k = Math.floor(r() * N);
      if (!port.list[k].real && !amberSet[k]) { amberSet[k] = 1; added++; }
    }

    for (var i = 0; i < N; i++) {
      var col = i % COLS;
      var t = mk('span', 'tile' + (redSet[i] ? ' red' : amberSet[i] ? ' amber' : ''));
      t.dataset.i = i;
      t.style.setProperty('--d', (((col + 0.5) / COLS) / 1.07 * SCAN).toFixed(3) + 's');
      grid.appendChild(t);
      tiles.push({ el: t, col: col, state: redSet[i] ? 'red' : amberSet[i] ? 'amber' : 'clear', sev: null });
    }

    function recount() {
      if (!opts.countEl) return;
      opts.countEl.textContent = tiles.filter(function (t) { return t.state === 'red' || (t.state === 'hot' && t.sev === 'critical'); }).length;
    }
    recount();

    /* Hover: name and tier of any tile */
    var STATE_LABEL = { clear: 'Monitored, clear', amber: 'Open finding', red: 'Critical signal open' };
    grid.addEventListener('mouseover', function (e) {
      var el = e.target.closest('.tile'); if (!el) return;
      var idx = Number(el.dataset.i), v = port.list[idx], t = tiles[idx];
      tip.innerHTML = '<b>' + v.name + '</b><span>' + cap(v.tier) + ' tier · ' + (t.state === 'hot' ? cap(t.sev) + ' signal open' : STATE_LABEL[t.state]) + '</span>';
      var rr = root.getBoundingClientRect(), tr = el.getBoundingClientRect();
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var x = tr.left - rr.left + tr.width / 2 - w / 2;
      tip.style.left = Math.max(0, Math.min(x, rr.width - w)) + 'px';
      var y = tr.top - rr.top - h - 8;
      tip.style.top = (y < 0 ? tr.bottom - rr.top + 8 : y) + 'px';
      tip.classList.add('is-on');
    });
    grid.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });

    function barCol() {
      var a = bar.getAnimations && bar.getAnimations()[0];
      if (!a || a.currentTime == null) return null;
      return Math.max(0, ((a.currentTime % (SCAN * 1000)) / (SCAN * 1000)) * 1.07 * COLS);
    }

    function pickTile(s) {
      var idx = port.byName[s.vendor];
      if (idx !== undefined && tiles[idx].state !== 'red' && tiles[idx].state !== 'hot') return idx;
      var pool = []; tiles.forEach(function (t, j) { if (t.state === 'clear') pool.push(j); });
      return pick(pool);
    }

    // Finds the vendor's tile, waits for the scan line to reach it, then flags it.
    function flag(s, done) {
      var idx = pickTile(s), t = tiles[idx];
      var phi = barCol();
      var wait = (REDUCE || phi === null) ? 0 : ((t.col - phi + COLS) % COLS) / COLS * SCAN * 1000 / 1.07 + 150;
      setTimeout(function () {
        t.state = 'hot'; t.sev = s.sev;
        t.el.className = 'tile hot' + (s.sev === 'high' ? ' hot--high' : '');
        recount();
        if (!REDUCE) {
          var rr = grid.getBoundingClientRect(), tr = t.el.getBoundingClientRect();
          var tag = mk('span', 'scan-tag scan-tag--' + s.sev);
          tag.textContent = s.vendor;
          root.appendChild(tag);
          var y = tr.top - rr.top - 34; if (y < 0) y = tr.top - rr.top + tr.height + 8;
          var w = tag.offsetWidth;
          tag.style.top = y + 'px';
          tag.style.left = Math.max(0, Math.min(tr.left - rr.left - w / 2 + tr.width / 2, rr.width - w)) + 'px';
          setTimeout(function () { tag.remove(); }, 7000);
        }
        done();
      }, wait);
    }
    // Back to "monitored, clear" once a vendor's critical work is resolved
    function clear(name) {
      var idx = port.byName[name]; if (idx === undefined) return;
      var t = tiles[idx]; if (t.state === 'clear') return;
      t.state = 'clear'; t.sev = null; t.el.className = 'tile'; recount();
    }
    return { flag: flag, clear: clear };
  }

  /* ---------- Signal flow ---------- */
  var SOURCES = ['Breach dumps & paste sites', 'Public code repositories', 'CVE & vendor advisories', 'Certificate transparency logs', 'Internet-wide scans', 'News, filings & notices'];

  function flow(root, opts) {
    opts = opts || {};
    var NS = 'http://www.w3.org/2000/svg';
    var cube = opts.cubeSrc || '../../brand/logos/balanced-cube.svg';
    var stats = opts.stats || { read: 48212, matched: 213, tasks: 7 };
    root.classList.add('flow');
    root.innerHTML =
      '<svg class="flow__svg" viewBox="0 0 640 420" role="img" aria-label="Signals from six public-internet sources converge on Tessera, which categorizes them and outputs investigation tasks">' +
        '<g class="flow-paths"></g>' +
        '<path class="out-path" d="M446 210 H640"/>' +
        '<circle class="flow-halo" cx="400" cy="210" r="52"/><circle class="flow-halo flow-halo--2" cx="400" cy="210" r="52"/>' +
        '<circle class="flow-core" cx="400" cy="210" r="46"/>' +
        '<image href="' + cube + '" x="377" y="182" width="46" height="55"/>' +
        '<text class="flow-note" x="400" y="286" text-anchor="middle">Match · Score · Categorize</text>' +
        '<text class="flow-cap" x="540" y="176" text-anchor="middle">Categorized as</text>' +
        '<text class="flow-cat" x="540" y="196" text-anchor="middle">Awaiting signal</text>' +
        '<g class="flow-particles"></g>' +
      '</svg>' +
      '<div class="flow__stats">' +
        '<div><b data-stat="read"></b><span>Signals read today</span></div>' +
        '<div><b data-stat="matched"></b><span>Matched to your vendors</span></div>' +
        '<div><b data-stat="tasks"></b><span>Investigation tasks opened</span></div>' +
      '</div>';

    var svg = root.querySelector('svg'), pathsG = svg.querySelector('.flow-paths'), partsG = svg.querySelector('.flow-particles');
    var outPath = svg.querySelector('.out-path'), core = svg.querySelector('.flow-core'), catEl = svg.querySelector('.flow-cat');
    var els = { read: root.querySelector('[data-stat="read"]'), matched: root.querySelector('[data-stat="matched"]'), tasks: root.querySelector('[data-stat="tasks"]') };
    function paint() { els.read.textContent = stats.read.toLocaleString('en-US'); els.matched.textContent = stats.matched; els.tasks.textContent = stats.tasks; }
    paint();

    function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    var ys = [40, 108, 176, 244, 312, 380], paths = [], lens = [], labels = [];
    SOURCES.forEach(function (name, i) {
      var y = ys[i];
      var t = el('text', { x: 184, y: y + 4, 'text-anchor': 'end', 'class': 'src-label' }); t.textContent = name; pathsG.appendChild(t); labels.push(t);
      var p = el('path', { 'class': 'src-path', d: 'M200 ' + y + ' C 282 ' + y + ', 300 210, 354 210' }); pathsG.appendChild(p); paths.push(p);
      pathsG.appendChild(el('circle', { 'class': 'src-node', cx: 200, cy: y, r: 5 }));
    });
    paths.forEach(function (p) { lens.push(p.getTotalLength()); });
    var outLen = outPath.getTotalLength();

    var r = rng(5), parts = [];
    function particle(kind, pathIdx, t, v) {
      var c = el('circle', { r: kind === 'sig' ? 5 : 2.4, fill: kind === 'out' ? '#B0CAEF' : '#8FB6EE', 'class': kind === 'sig' ? 'flow-sig' : '' });
      partsG.appendChild(c);
      return { el: c, kind: kind, p: pathIdx, t: t, v: v };
    }
    paths.forEach(function (_, i) { for (var k = 0; k < 4; k++) parts.push(particle('in', i, k / 4 + r() * 0.1, 0.30 + r() * 0.12)); });
    for (var k = 0; k < 2; k++) parts.push(particle('out', -1, k / 2, 0.42));

    function place(p) {
      var path = p.p < 0 ? outPath : paths[p.p], len = p.p < 0 ? outLen : lens[p.p];
      var pt = path.getPointAtLength(Math.min(1, p.t) * len);
      p.el.setAttribute('cx', pt.x); p.el.setAttribute('cy', pt.y);
      p.el.setAttribute('opacity', p.kind === 'sig' ? 1 : (p.t < 0.1 ? p.t / 0.1 : p.t > 0.86 ? (1 - p.t) / 0.14 : 1) * (p.kind === 'out' ? 0.7 : 0.9));
    }
    parts.forEach(place);

    var sig = null, sigDone = null, last = performance.now();
    function paused() { return opts.panel && opts.panel.classList.contains('is-paused'); }
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!paused()) {
        parts.forEach(function (p) { p.t += p.v * dt; if (p.t >= 1) { p.t -= 1; p.v = p.kind === 'out' ? 0.42 : 0.30 + r() * 0.12; } place(p); });
        if (sig) {
          sig.t += sig.v * dt;
          if (sig.t >= 1) {
            if (sig.phase === 'in') {
              core.classList.add('hit'); setTimeout(function () { core.classList.remove('hit'); }, 700);
              catEl.textContent = sig.s.category;
              sig.phase = 'out'; sig.p = -1; sig.t = 0; sig.v = 0.7;
            } else {
              sig.el.remove();
              stats.tasks++; paint();
              var cb = sigDone; sig = null; sigDone = null; cb();
            }
          }
          if (sig) place(sig);
        }
      }
      requestAnimationFrame(frame);
    }
    if (!REDUCE) {
      requestAnimationFrame(frame);
      setInterval(function () {
        if (paused()) return;
        stats.read += 3 + Math.floor(Math.random() * 9);
        if (Math.random() < 0.08) stats.matched++;
        paint();
      }, 450);
    }

    // Sends one signal from its source, through Tessera, out as a task.
    function send(s, done) {
      if (REDUCE) { catEl.textContent = s.category; stats.tasks++; paint(); done(); return; }
      labels.forEach(function (l) { l.classList.remove('hot'); });
      labels[s.src].classList.add('hot');
      setTimeout(function () { labels[s.src].classList.remove('hot'); }, 5500);
      var p = particle('sig', s.src, 0, 0.36);
      p.phase = 'in'; p.s = s;
      p.el.setAttribute('fill', s.sev === 'high' ? '#F0A75B' : '#FF7A7A');
      sig = p; sigDone = done;
    }
    return { send: send, stats: stats };
  }

  global.TesseraScan = { SIGNALS: SIGNALS, queue: queue, runner: runner, mosaic: mosaic, flow: flow };
})(window);
