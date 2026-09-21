/* Shared state and actions for the Dashboard and the analyst dashboards (Priya, Marcus).
   No DOM in here: views register a listener with TesseraDash.onChange(fn) and re-render
   when an action changes something. All data is fictional sample data, and nothing
   leaves the page: "send" and "escalate" only change what the dashboard shows.

   Exposes window.TesseraDash. */
(function (global) {
  'use strict';

  var listeners = [], resolveListeners = [];
  var TIER = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  var AT_CAPACITY = 22;                       // open tasks at which an analyst counts as at capacity
  var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };

  /* ---------- Portfolio numbers (Dana's health-check tiles, charts, concentration) ---------- */
  var S = {
    score: 68, scoreDelta: 4, scoreAdded: 0,
    open: 47, pastSLA: 15, waitingVendor: 12,
    ages: [14, 12, 9, 8, 4],                                   // 0-3, 4-7, 8-14, 15-30, 30+ days
    newDaily:    [3, 5, 2, 4, 6, 3, 1, 2, 4, 5, 7, 6, 8, 9],   // Sep 7 .. Sep 20
    closedDaily: [4, 3, 4, 3, 5, 4, 2, 3, 3, 4, 3, 4, 3, 4],
    counts: { all: 21, critical: 7, stale: 15, waiting: 12 },   // unassigned is counted from the list
    autoAssign: false,
    pts: { 'Ironclad Identity': 2.4, 'Harborlight Cloud': 2.0, 'Northwind AI Labs': 1.7, 'Keystone Payroll': 1.5, 'Fortify Endpoint Security': 1.2 },
    restPts: 8.5,                                              // impact from all other vendors
    lastScanAt: Date.now() - 4 * 60000
  };

  /* ---------- Team: open work per analyst. Bars use verifying / vendor / review / pastSla. ---------- */
  var TEAM = {
    PN: { name: 'Priya Nair',   role: 'EU / critical vendors', img: 'priya-nair',   verifying: 3, vendor: 6, review: 4, pastSla: 1, score: 91,   delta: '▲ 3', dcls: 'good', now: 'Harborlight admin console exposure' },
    MC: { name: 'Marcus Chen',  role: 'US / standard vendors', img: 'marcus-chen',  verifying: 8, vendor: 4, review: 4, pastSla: 6, score: 74,   delta: '▼ 2', dcls: 'bad',  now: 'Fortify CVE follow-up' },
    DV: { name: 'Dana Vasquez', role: 'escalations + Canada',  img: 'dana-vasquez', verifying: 4, vendor: 2, review: 0, pastSla: 0, score: null, now: null }
  };
  var teamOpen = function (k) { return TEAM[k].verifying + TEAM[k].vendor + TEAM[k].review + TEAM[k].pastSla; };

  /* ---------- Investigation tasks. attention:false = not in Dana's attention list, but in the analyst's own queue. ---------- */
  var seq = 0;
  var TASKS = [
    { issue: 'SOC 2 report expired',                                   cat: 'Assurance lapse',     vendor: 'Ironclad Identity',          tier: 'critical', region: 'EU + US',     sev: 'critical', state: 'new',     age: '12 min', sla: '24 h', owner: null, impact: 2.1, action: 'Assign' },
    { issue: 'Build server login page exposed to the internet',        cat: 'Exposed service',     vendor: 'Foundry DevOps Platform',    tier: 'medium',   region: 'US',          sev: 'high',     state: 'new',     age: '3 h',    sla: '2 d',  owner: null, impact: 1.3, action: 'Assign' },
    { issue: 'Two staff credentials found in a public code repository', cat: 'Credential exposure', vendor: 'Sentinel Background Checks', tier: 'medium',   region: 'US + Canada', sev: 'high',     state: 'new',     age: '6 h',    sla: '2 d',  owner: null, impact: 1.0, action: 'Assign' },
    { issue: 'Storage endpoint listing publicly, contents unverified', cat: 'Exposed service',     vendor: 'Lattice Data Warehouse',     tier: 'medium',   region: 'US',          sev: 'medium',   state: 'new',     age: '1 d',    sla: '5 d',  owner: null, impact: 0.9, action: 'Assign' },
    { issue: 'Older TLS protocol still enabled after certificate renewal', cat: 'Certificate hygiene', vendor: 'Coppermill Payments',    tier: 'medium',   region: 'Canada',      sev: 'medium',   state: 'new',     age: '1 d',    sla: '5 d',  owner: null, impact: 0.5, action: 'Assign' },
    { issue: 'ISO 27001 certificate due for renewal in 30 days',       cat: 'Assurance lapse',     vendor: 'Nimbus Cloud Storage',       tier: 'medium',   region: 'EU',          sev: 'low',      state: 'new',     age: '2 d',    sla: '10 d', owner: null, impact: 0.4, action: 'Assign' },
    { issue: 'Admin console reachable from the public internet',       cat: 'Exposed service',     vendor: 'Harborlight Cloud',          tier: 'critical', region: 'US',          sev: 'critical', state: 'working', age: '1 d',    sla: '2 d',  owner: 'PN', impact: 1.8, action: 'Open' },
    { issue: 'New CVE affecting vendor stack',                         cat: 'Vulnerability',       vendor: 'Northwind AI Labs',          tier: 'critical', region: 'EU',          sev: 'critical', state: 'working', age: '1 h',    sla: '24 h', owner: 'PN', impact: 1.6, action: 'Open' },
    { issue: 'Employee records offered on a paste site',               cat: 'Data breach',         vendor: 'Keystone Payroll',           tier: 'high',     region: 'Canada',      sev: 'critical', state: 'stale',   age: '3 d',    sla: '2 d',  ageBad: true, owner: 'MC', impact: 1.5, action: 'Nudge' },
    { issue: 'Unpatched critical CVE on an internet-facing host',      cat: 'Vulnerability',       vendor: 'Fortify Endpoint Security',  tier: 'high',     region: 'US + EU',     sev: 'critical', state: 'stale',   age: '9 d',    sla: '7 d',  ageBad: true, owner: 'MC', impact: 1.2, action: 'Nudge' },
    { issue: 'Expired TLS certificate on the login portal',            cat: 'Certificate hygiene', vendor: 'Aurora HR Suite',            tier: 'medium',   region: 'US + Canada', sev: 'medium',   state: 'stale',   age: '21 d',   sla: '14 d', ageBad: true, owner: 'MC', impact: 0.9, action: 'Escalate' },
    { issue: 'Named in a regulator enforcement notice',                cat: 'Regulatory',          vendor: 'Glasswing Contract AI',      tier: 'critical', region: 'EU',          sev: 'critical', state: 'waiting', age: '5 d',    sla: '7 d',  owner: 'PN', impact: 0.7, action: 'Open' },

    /* In an analyst's own queue only: routine work that is within SLA */
    { attention: false, from: 'MC', fromNote: 'Supports payment messaging, but I am not sure the DORA criteria apply', issue: 'Meridian Comms: possible DORA critical provider, needs a second look', cat: 'Escalated review', vendor: 'Meridian Comms', tier: 'high', region: 'EU', sev: 'high', state: 'working', age: '1 d', sla: '2 d', owner: 'PN', impact: 0.5, action: 'Open' },
    { attention: false, from: 'DV', fromNote: 'Legal asked for a view before renewal', issue: 'Glasswing Contract AI: EU AI Act high-risk screening', cat: 'Escalated review', vendor: 'Glasswing Contract AI', tier: 'critical', region: 'EU', sev: 'high', state: 'working', age: '2 d', sla: '5 d', owner: 'PN', impact: 0.6, action: 'Open' },
    { attention: false, issue: 'Pen test summary: two high findings have no remediation date', cat: 'Evidence review', vendor: 'Onyx Fraud Detection',  tier: 'high',   region: 'US',  sev: 'high',   state: 'working', age: '2 d',  sla: '7 d',  owner: 'PN', impact: 0.6, action: 'Open' },
    { attention: false, issue: 'Renewal review: two earlier findings are still open',          cat: 'Renewal',         vendor: 'Quartzline Analytics',   tier: 'low',    region: 'EU',  sev: 'low',    state: 'working', age: '1 d',  sla: '10 d', owner: 'PN', impact: 0.3, action: 'Open' },
    { attention: false, issue: 'Security headers missing on the marketing site',               cat: 'Configuration',   vendor: 'Beacon Legal Docs',      tier: 'low',    region: 'US',  sev: 'low',    state: 'working', age: '2 d',  sla: '14 d', owner: 'MC', impact: 0.2, action: 'Open' },
    { attention: false, issue: 'Certificate expires in 21 days',                               cat: 'Certificate hygiene', vendor: 'Driftwood Marketing Suite', tier: 'low', region: 'US', sev: 'low',  state: 'working', age: '3 d',  sla: '14 d', owner: 'MC', impact: 0.2, action: 'Open' },
    { attention: false, issue: 'Response time on a support endpoint is degraded',              cat: 'Availability',    vendor: 'Pulsecheck Support Desk', tier: 'low',   region: 'US',  sev: 'low',    state: 'waiting', age: '4 d',  sla: '14 d', owner: 'MC', impact: 0.2, action: 'Open' }
  ].map(function (t) { t.id = 't' + (++seq); return t; });

  /* ---------- Marcus: intake queue (new vendor requests and renewals) ---------- */
  var HOUR = 3600e3, iseq = 0;
  var INTAKE = [
    { vendor: 'Brightwave Payments',  type: 'New vendor intake', from: 'Procurement', hours: 3,   note: 'Contract signing today',  triage: 'routine', why: 'Standard payments software, no data beyond billing', answered: 46, total: 46, missing: [] },
    { vendor: 'Ivybridge Legal',      type: 'Annual renewal',    from: 'Legal',       hours: 5,   note: 'Renewal date is Friday',  triage: 'routine', why: 'Same scope as last year, no changes reported',       answered: 41, total: 46, missing: ['SOC 2 report'] },
    { vendor: 'Calder Logistics',     type: 'New vendor intake', from: 'Procurement', hours: 22,  note: '',                        triage: 'routine', why: 'Low-risk logistics tooling',                         answered: 44, total: 46, missing: ['Insurance certificate', 'Data-flow diagram'] },
    { vendor: 'Kestrel Cloud',        type: 'New vendor intake', from: 'Procurement', hours: 30,  note: '',                        triage: 'priya',   why: 'Hosts customer PII in the EU, so likely DORA in scope', answered: 46, total: 46, missing: [] },
    { vendor: 'Larkspur Analytics',   type: 'New vendor intake', from: 'Procurement', hours: 50,  note: '',                        triage: 'priya',   why: 'Embedded AI features found, needs an EU AI Act screen', answered: 45, total: 46, missing: ['AI model documentation'] },
    { vendor: 'Fernhill Support Desk',type: 'Annual renewal',    from: 'Legal',       hours: 56,  note: '',                        triage: 'routine', why: 'No changes since last review',                       answered: 46, total: 46, missing: [] },
    { vendor: 'Oakhaven Health',      type: 'New vendor intake', from: 'Procurement', hours: 74,  note: '',                        triage: 'routine', why: 'Employee wellness tool, limited data',                answered: 39, total: 46, missing: ['Pen test summary'] },
    { vendor: 'Willow HR Suite',      type: 'New vendor intake', from: 'Procurement', hours: 100, note: '',                        triage: 'routine', why: 'Standard HR software',                               answered: 46, total: 46, missing: [] }
  ].map(function (x) { x.id = 'i' + (++iseq); x.dueAt = Date.now() + x.hours * HOUR; x.lastChased = null; return x; });
  var INTAKE_BASE = { total: 18, dueToday: 5 };                    // the queue is longer than the 8 shown
  var INTAKE_EXTRA_BY_DAY = [2, 2, 1, 2, 1, 1, 1];                  // the 10 not shown, by day due (today first)

  /* ---------- Priya: evidence the AI has pre-read, and regulatory calls waiting on her ---------- */
  var eseq = 0, cseq = 0;
  var EVIDENCE = [
    { doc: 'SOC 2 Type II', vendor: 'Onyx Fraud Detection', pages: 68, conf: 96, exceptions: [
        { page: 47, text: 'Quarterly access reviews were not performed in Q3.' },
        { page: 52, text: 'Two terminated users kept production access for 19 days.' },
        { page: 61, text: 'Backup restore test was not completed in the period.' }] },
    { doc: 'Penetration test summary', vendor: 'Onyx Fraud Detection', pages: 24, conf: 93, exceptions: [
        { page: 12, text: 'Two high-severity findings from the August test have no remediation date.' },
        { page: 15, text: 'Model-serving API accepted requests without a valid token in staging.' }] },
    { doc: 'SOC 2 Type II', vendor: 'Northwind AI Labs', pages: 59, conf: 94, exceptions: [
        { page: 31, text: 'Model hosting is carved out to a subservice organization with no separate report.' }] },
    { doc: 'ISO 27001 certificate', vendor: 'Nimbus Cloud Storage', pages: 6, conf: 98, exceptions: [
        { page: 3, text: 'Certificate scope excludes the EU-Frankfurt region.' }] },
    { doc: 'Architecture questionnaire', vendor: 'Glasswing Contract AI', pages: 18, conf: 90, exceptions: [
        { page: 14, text: 'Retention period for customer documents used in model training is not stated.' },
        { page: 16, text: 'Sub-processor list does not include the hosting region.' }] },
    { doc: 'Security questionnaire', vendor: 'Meridian Comms', pages: 22, conf: 88, exceptions: [
        { page: 9, text: 'Incident response plan was last tested 26 months ago.' }] }
  ].map(function (e) { e.id = 'e' + (++eseq); e.reviewed = false; return e; });

  var CALLS = [
    { vendor: 'Meridian Comms',        framework: 'DORA',   proposed: 'Critical ICT third-party provider', basis: '4 of 5 criteria met: supports payment messaging, no easy substitute, EU data', tier: 'Critical ICT provider' },
    { vendor: 'Glasswing Contract AI', framework: 'EU AI Act', proposed: 'Limited risk, not high-risk',     basis: 'Legal document analysis; one criterion unclear (use in employment decisions)', tier: 'Limited risk' },
    { vendor: 'Northwind AI Labs',     framework: 'NIS2',   proposed: 'In scope as an essential supplier', basis: 'Provides fraud scoring to a regulated entity; supply-chain measures apply', tier: 'Essential supplier' }
  ].map(function (c) { c.id = 'c' + (++cseq); c.status = 'pending'; c.reason = null; return c; });

  var RETURNING = [
    { vendor: 'Northwind AI Labs',   event: 'Renewal in 6 weeks',      prior: 2, last: 'Mar 2026', note: 'Model-hosting carve-out flagged both times' },
    { vendor: 'Quartzline Analytics',event: 'New EU subsidiary',       prior: 2, last: 'Jan 2026', note: 'Two findings still open from last review' },
    { vendor: 'Nimbus Cloud Storage',event: 'Certificate re-issued',   prior: 1, last: 'Nov 2025', note: 'Scope excluded a region then too' }
  ];
  var SHADOWS = [
    { id: 's1', what: 'Onyx Fraud Detection: SOC 2 exception review', when: 'Today, 2:00 pm',    requested: false },
    { id: 's2', what: 'Glasswing Contract AI: EU AI Act screening',    when: 'Tomorrow, 10:00 am', requested: false },
    { id: 's3', what: 'Meridian Comms: DORA tiering call',             when: 'Thursday, 11:00 am', requested: false }
  ];

  /* ---------- Helpers ---------- */
  function ageText(ms) { var m = Math.floor(ms / 60000); return m < 1 ? 'Just now' : m < 60 ? m + ' min' : Math.floor(m / 60) + ' h'; }
  function dayCount(t) { return t.t0 ? (Date.now() - t.t0) / 864e5 : /\bd$/.test(t.age) ? parseFloat(t.age) : /\bh$/.test(t.age) ? parseFloat(t.age) / 24 : 0; }
  function taskAge(t) { return t.t0 ? ageText(Date.now() - t.t0) : t.age; }
  function counts() { return Object.assign({}, S.counts, { unassigned: TASKS.filter(function (t) { return t.attention !== false && !t.owner; }).length }); }
  function byId(id) { return TASKS.filter(function (t) { return t.id === id; })[0]; }
  function bucketOf(d) { return d <= 3 ? 0 : d <= 7 ? 1 : d <= 14 ? 2 : d <= 30 ? 3 : 4; }

  // Who a new task should go to: critical-tier and EU vendors to Priya, Canada to Dana,
  // US to Marcus, or to Priya while Marcus is at capacity.
  function pickOwner(t) {
    if (t.tier === 'critical') return { owner: 'PN', why: 'critical vendor' };
    if (/EU/.test(t.region)) return { owner: 'PN', why: 'EU vendor' };
    if (/Canada/.test(t.region)) return { owner: 'DV', why: 'Canada' };
    return teamOpen('MC') >= AT_CAPACITY ? { owner: 'PN', why: 'Marcus at capacity' } : { owner: 'MC', why: 'US vendor' };
  }

  /* Views re-render from here. Flags used for the one-off highlight are cleared after every listener has run. */
  function notify() {
    listeners.forEach(function (fn) { fn(); });
    TASKS.forEach(function (t) { t.isNew = false; t.flash = false; });
    Object.keys(TEAM).forEach(function (k) { TEAM[k].flash = false; });
    INTAKE.forEach(function (i) { i.flash = false; });
    EVIDENCE.forEach(function (e) { e.flash = false; });
    CALLS.forEach(function (c) { c.flash = false; });
  }

  /* ---------- Intake numbers for Marcus ---------- */
  function intakeStats() {
    var total = INTAKE_BASE.total - (iseq - INTAKE.length), byDay = INTAKE_EXTRA_BY_DAY.slice(), today = 0;
    INTAKE.forEach(function (i) { var d = Math.min(6, Math.max(0, Math.floor((i.dueAt - Date.now()) / (24 * HOUR)))); byDay[d]++; });
    today = byDay[0];
    return { total: total, dueToday: today, byDay: byDay };
  }

  /* ---------- Actions ---------- */
  var act = {
    assign: function (t, owner) {
      if (!t || t.owner) return;
      t.owner = owner; t.state = 'working'; t.action = 'Open'; t.flash = true;
      TEAM[owner].verifying++; TEAM[owner].flash = true;
      notify();
    },
    nudge: function (t) { if (!t || t.nudged) return; t.nudged = true; t.flash = true; notify(); },
    escalate: function (t) {
      if (!t || t.escalated) return;
      if (t.owner && t.owner !== 'DV') {
        TEAM[t.owner].pastSla = Math.max(0, TEAM[t.owner].pastSla - 1); TEAM[t.owner].flash = true;
        TEAM.DV.vendor++; TEAM.DV.flash = true; t.owner = 'DV';
      }
      t.escalated = true; t.action = 'Open'; t.flash = true;
      notify();
    },
    // Closing a task: it leaves the lists, the score and the age bar, and counts as closed today.
    resolve: function (t) {
      if (!t) return;
      var i = TASKS.indexOf(t); if (i < 0) return;
      TASKS.splice(i, 1);
      if (t.attention !== false) {
        S.open--; S.closedDaily[S.closedDaily.length - 1]++;
        S.scoreAdded -= t.impact;
        S.pts[t.vendor] = (S.pts[t.vendor] || 0) - t.impact; if (S.pts[t.vendor] <= 0.05) delete S.pts[t.vendor];
        S.counts.all--; if (t.sev === 'critical') S.counts.critical--;
        if (t.state === 'stale') { S.pastSLA--; S.counts.stale--; }
        if (t.state === 'waiting') { S.waitingVendor--; S.counts.waiting--; }
        S.ages[bucketOf(dayCount(t))] = Math.max(0, S.ages[bucketOf(dayCount(t))] - 1);
      }
      if (t.owner) {
        var m = TEAM[t.owner]; m.flash = true;
        if (t.state === 'stale' && m.pastSla) m.pastSla--;
        else if (t.state === 'waiting' && m.vendor) m.vendor--;
        else if (m.verifying) m.verifying--; else if (m.review) m.review--;
      }
      resolveListeners.forEach(function (fn) { fn(t); });
      notify();
    },
    rebalance: function () {
      var m = TEAM.MC, p = TEAM.PN, n = Math.min(4, Math.floor((teamOpen('MC') - teamOpen('PN')) / 2));
      for (var i = 0; i < n; i++) {
        var from = ((i % 2 === 0 && m.verifying > 0) || m.review === 0) ? 'verifying' : 'review';
        m[from]--; p[from]++;
      }
      m.flash = p.flash = true;
      notify();
      return n;
    },
    autoAssign: function (on) { S.autoAssign = !!on; notify(); },
    // A signal from the scan becomes a task (unassigned, or assigned if auto-assign is on)
    addSignal: function (s) {
      var t = { id: 't' + (++seq), issue: s.title, cat: s.category + ' · ' + s.source, vendor: s.vendor, tier: s.tier, region: (s.sub.split(' · ')[1] || ''), sev: s.sev,
                state: 'new', t0: Date.now(), fresh: true, sla: s.sev === 'critical' ? '24 h' : '2 d', owner: null, impact: s.impact, action: 'Assign', isNew: true };
      if (S.autoAssign) { var o = pickOwner(t).owner; t.owner = o; t.state = 'working'; t.action = 'Open'; TEAM[o].verifying++; TEAM[o].flash = true; }
      TASKS.push(t);
      S.open++; S.newDaily[S.newDaily.length - 1]++; S.ages[0]++;
      S.counts.all++; if (s.sev === 'critical') S.counts.critical++;
      S.scoreAdded += s.impact;
      S.pts[s.vendor] = (S.pts[s.vendor] || 0) + s.impact;
      S.lastScanAt = Date.now();
      notify();
      return t;
    },

    /* Marcus */
    intakeClear: function (i) {
      var k = INTAKE.indexOf(i); if (k < 0) return;
      INTAKE.splice(k, 1); if (TEAM.MC.verifying) TEAM.MC.verifying--; TEAM.MC.flash = true; notify();
    },
    intakeChase: function (i) { i.lastChased = Date.now(); i.flash = true; notify(); },
    intakeToPriya: function (i) {
      var k = INTAKE.indexOf(i); if (k < 0) return null;
      INTAKE.splice(k, 1);
      if (TEAM.MC.verifying) TEAM.MC.verifying--; TEAM.MC.flash = true;
      TEAM.PN.verifying++; TEAM.PN.flash = true;
      var t = { id: 't' + (++seq), attention: false, from: 'MC', fromNote: i.why, issue: i.vendor + ': ' + i.why, cat: 'Escalated review', vendor: i.vendor, tier: 'high', region: 'EU',
                sev: 'high', state: 'working', t0: Date.now(), sla: '2 d', owner: 'PN', impact: 0.5, action: 'Open', isNew: true };
      TASKS.push(t); notify();
      return t;
    },
    shadow: function (s) { s.requested = true; notify(); },

    /* Priya */
    evidenceReview: function (e) { e.reviewed = true; e.flash = true; notify(); },
    callConfirm: function (c) { c.status = 'confirmed'; c.flash = true; notify(); },
    callOverride: function (c, tier, reason) { c.status = 'overridden'; c.tier = tier; c.reason = reason; c.flash = true; notify(); }
  };

  global.TesseraDash = {
    S: S, TEAM: TEAM, TASKS: TASKS, INTAKE: INTAKE, EVIDENCE: EVIDENCE, CALLS: CALLS, RETURNING: RETURNING, SHADOWS: SHADOWS,
    TIER: TIER, AT_CAPACITY: AT_CAPACITY, HOUR: HOUR,
    sum: sum, teamOpen: teamOpen, counts: counts, byId: byId, pickOwner: pickOwner, ageText: ageText, dayCount: dayCount, taskAge: taskAge, intakeStats: intakeStats,
    act: act,
    onChange: function (fn) { listeners.push(fn); },
    onResolve: function (fn) { resolveListeners.push(fn); },
    notify: notify
  };
})(window);
