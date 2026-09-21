/* The analyst dashboards: Priya Nair (technical depth: her queue, evidence the AI has
   pre-read, regulatory calls) and Marcus Chen (volume and intake: SLA countdowns,
   the intake queue, what needs Priya). Rendered into #view-priya and #view-marcus by
   the persona switcher, from the same state as Dana's dashboard, so an action in one
   view shows up in the others. Needs dashboard-state.js, dashboard-ui.js, ai-chat.js. */
(function (global) {
  'use strict';

  var D = global.TesseraDash, U = global.TesseraUI, act = D.act, TEAM = D.TEAM, esc = U.esc, AI = global.TesseraAI;
  var DATE = 'Sunday, September 20';
  var DAYNAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var $ = function (id) { return document.getElementById(id); };
  var plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  var ul = function (items) { return '<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; };
  var sum = D.sum;

  function dueIn(ms) {
    var m = Math.round(ms / 60000);
    if (m < 0) return 'overdue';
    if (m < 60) return m + ' min';
    var h = Math.round(m / 60); if (h < 48) return h + ' h';
    return Math.round(h / 24) + ' d';
  }
  function kpi(ctx, label, value, trend, tcls, sub) {
    return '<div class="stat-card d-3"><div class="stat-card__label">' + label + '</div><div class="stat-card__value">' + value + '</div>' +
      '<div class="trend ' + tcls + '">' + trend + '</div><div class="kpi-sub">' + sub + '</div>' + U.spark(ctx, label) + '</div>';
  }
  function head(name, line, note) {
    return '<div class="page-heading"><div><h1>Good morning, ' + name + '</h1><p>' + DATE + ' · Northbridge Financial Group · ' + line + '</p></div>' +
      '<div><p class="header-note">' + note + '</p></div></div>';
  }
  function chips(list, current, attr) {
    return list.map(function (c) { return '<button type="button" class="chip' + (current === c[0] ? ' active' : '') + '" ' + attr + '="' + c[0] + '"><b>' + c[1] + '</b> ' + c[2] + '</button>'; }).join('');
  }

  var view = { priya: 'all', marcus: 'all', intake: 'all' };

  /* ============================ PRIYA ============================ */
  function priyaTasks() {
    return D.TASKS.filter(function (t) { return t.owner === 'PN'; }).sort(function (a, b) { return (!a.from - !b.from) || b.impact - a.impact; });
  }
  function renderPriya() {
    var root = $('view-priya'); if (!root) return;
    var mine = priyaTasks(), fromOthers = mine.filter(function (t) { return t.from; });
    var evPending = D.EVIDENCE.filter(function (e) { return !e.reviewed; }), exc = sum(evPending.map(function (e) { return e.exceptions.length; }));
    var callsPending = D.CALLS.filter(function (c) { return c.status === 'pending'; });
    var shadows = D.SHADOWS.filter(function (s) { return s.requested; }).length;
    var f = view.priya;
    var list = mine.filter(function (t) { return f === 'all' || (f === 'escalated' && t.from) || (f === 'critical' && t.sev === 'critical') || (f === 'stale' && t.state === 'stale') || (f === 'waiting' && t.state === 'waiting'); });
    var c = { all: mine.length, escalated: fromOthers.length, critical: mine.filter(function (t) { return t.sev === 'critical'; }).length, stale: mine.filter(function (t) { return t.state === 'stale'; }).length, waiting: mine.filter(function (t) { return t.state === 'waiting'; }).length };
    var open = D.teamOpen('PN');

    root.innerHTML = head('Priya', 'EU and critical vendors', shadows ? 'Marcus asked to shadow ' + plural(shadows, 'review') + '.' : 'Last scan ' + $('lastScan').textContent + ' · 612 vendors monitored') +
      '<div class="dash">' +
        kpi('p-open', 'My open tasks', open, TEAM.PN.pastSla + ' past SLA', TEAM.PN.pastSla ? 'bad' : 'good', 'Working now: ' + esc(TEAM.PN.now)) +
        kpi('p-escalated', 'Escalated to me', fromOthers.length, fromOthers.length ? 'Needs your judgment' : 'Nothing waiting', fromOthers.length ? 'warn' : 'good', fromOthers.length ? 'From ' + esc(Object.keys(fromOthers.reduce(function (a, t) { a[U.FIRST[t.from]] = 1; return a; }, {})).join(' and ')) : 'Marcus and Dana will appear here') +
        kpi('p-evidence', 'Evidence to review', evPending.length, exc + (exc === 1 ? ' exception' : ' exceptions') + ' flagged by the AI', evPending.length ? 'warn' : 'good', 'Each one comes with the page it is on') +
        kpi('p-calls', 'Regulatory calls', callsPending.length, callsPending.length ? 'Waiting on you' : 'All decided', callsPending.length ? 'warn' : 'good', 'DORA · NIS2 · EU AI Act') +

        /* My queue */
        '<section class="panel has-ai d-12" aria-labelledby="pqTitle"><div class="panel__head"><h2 id="pqTitle">My queue</h2><span class="sub">Tasks sent to you come first, then by risk impact</span></div>' +
          '<div class="chip-row" role="group" aria-label="Filter my tasks">' + chips([['all', 'All', c.all], ['escalated', 'Escalated to me', c.escalated], ['critical', 'Critical', c.critical], ['stale', 'Past SLA', c.stale], ['waiting', 'Waiting on vendor', c.waiting]], f, 'data-pf') + '</div>' +
          '<div class="table-scroll"><table class="vendor-table attn"><thead>' + U.taskHead({ owner: false }) + '</thead><tbody>' + list.map(function (t) { return U.taskRow(t, { owner: false }); }).join('') + '</tbody></table></div>' +
          (list.length ? '' : '<div class="empty-state" style="display:block">Nothing matches this filter.</div>') +
          '<div class="table-foot">Showing ' + list.length + ' of ' + open + ' open tasks</div>' + U.spark('p-queue', 'my queue') + '</section>' +

        /* Evidence */
        '<section class="panel has-ai d-7" aria-labelledby="evTitle"><div class="panel__head"><h2 id="evTitle">Evidence to review</h2><span class="sub">The AI has read these. You make the call.</span></div>' +
          '<ul class="row-list">' + D.EVIDENCE.map(function (e) {
            var top = e.exceptions[0];
            return '<li' + (e.flash ? ' class="is-changed"' : '') + '><div class="grow"><div class="kicker"><span class="doc-badge">' + esc(e.doc) + '</span>' + (e.reviewed ? '' : '<span class="count-pill bad">' + plural(e.exceptions.length, 'exception') + '</span>') + '</div>' +
              '<div class="vendor-name">' + esc(e.vendor) + '</div><div class="quote ' + (e.reviewed ? 'muted' : '') + '"><span class="pg">p. ' + top.page + '</span> ' + esc(top.text) + '</div></div>' +
              (e.reviewed ? '<span class="done-note">✓ Reviewed</span>' : '') + '<button type="button" class="btn-row" data-ev="' + e.id + '">' + (e.reviewed ? 'View' : 'Open evidence') + '</button></li>';
          }).join('') + '</ul><div class="panel__body" style="padding-top:0"></div>' + U.spark('p-evidence', 'evidence to review') + '</section>' +

        /* Regulatory calls */
        '<section class="panel has-ai d-5" aria-labelledby="rcTitle"><div class="panel__head"><h2 id="rcTitle">Regulatory calls</h2><span class="sub">Confirm, or override with a reason</span></div>' +
          '<ul class="row-list">' + D.CALLS.map(function (cl) {
            return '<li' + (cl.flash ? ' class="is-changed"' : '') + ' style="align-items:flex-start"><div class="grow"><div class="kicker"><span class="fw-badge">' + esc(cl.framework) + '</span></div>' +
              '<div class="vendor-name">' + esc(cl.vendor) + '</div><div class="quote">' + esc(cl.status === 'overridden' ? cl.tier : cl.proposed) + '</div><div class="vendor-sub">' + (cl.status === 'overridden' ? 'Your reason: ' + esc(cl.reason) : esc(cl.basis)) + '</div></div>' +
              (cl.status === 'pending' ? '<div style="display:flex;flex-direction:column;gap:6px"><button type="button" class="btn-row" data-call="' + cl.id + '" data-callact="confirm">Confirm</button><button type="button" class="btn-row" data-call="' + cl.id + '" data-callact="override">Override</button></div>'
               : cl.status === 'confirmed' ? '<span class="done-note">✓ Confirmed</span>' : '<span class="over-note">↺ Overridden</span>') + '</li>';
          }).join('') + '</ul><div class="panel__body" style="padding-top:0"></div>' + U.spark('p-calls', 'regulatory calls') + '</section>' +

        /* Returning vendors */
        '<section class="panel has-ai d-12" aria-labelledby="rvTitle"><div class="panel__head"><h2 id="rvTitle">Vendors you have seen before</h2><span class="sub">Past findings follow the vendor, so you do not start from zero</span></div>' +
          '<ul class="row-list">' + D.RETURNING.map(function (r) {
            return '<li><div class="grow"><div class="vendor-name">' + esc(r.vendor) + ' <span class="count-pill">' + esc(r.event) + '</span></div><div class="vendor-sub">' + esc(r.note) + '</div></div>' +
              '<div class="vendor-sub" style="text-align:right">' + plural(r.prior, 'earlier finding') + '<br>last reviewed ' + esc(r.last) + '</div></li>';
          }).join('') + '</ul><div class="panel__body" style="padding-top:0"></div>' + U.spark('p-returning', 'vendors you have seen before') + '</section>' +
      '</div>';
  }

  /* ============================ MARCUS ============================ */
  function intakeAction(i) {
    if (i.triage === 'priya') return { act: 'priya', label: 'Send to Priya' };
    if (i.missing.length) return { act: 'chase', label: i.lastChased ? 'Chased' : 'Chase vendor', disabled: !!i.lastChased };
    return { act: 'clear', label: 'Clear' };
  }
  function renderMarcus() {
    var root = $('view-marcus'); if (!root) return;
    var st = D.intakeStats(), mine = D.TASKS.filter(function (t) { return t.owner === 'MC'; }).sort(function (a, b) { return b.impact - a.impact; });
    var next = D.INTAKE.slice().sort(function (a, b) { return a.dueAt - b.dueAt; })[0];
    var pastSla = TEAM.MC.pastSla, oldest = mine.filter(function (t) { return t.state === 'stale'; }).sort(function (a, b) { return D.dayCount(b) - D.dayCount(a); })[0];
    var f = view.intake, now = Date.now();
    var items = D.INTAKE.slice().sort(function (a, b) { return a.dueAt - b.dueAt; });
    var vis = items.filter(function (i) { return f === 'all' || (f === 'today' && i.dueAt - now < 24 * D.HOUR) || (f === 'routine' && i.triage === 'routine') || (f === 'priya' && i.triage === 'priya') || (f === 'waiting' && i.missing.length); });
    var cnt = { all: items.length, today: items.filter(function (i) { return i.dueAt - now < 24 * D.HOUR; }).length, routine: items.filter(function (i) { return i.triage === 'routine'; }).length, priya: items.filter(function (i) { return i.triage === 'priya'; }).length, waiting: items.filter(function (i) { return i.missing.length; }).length };
    var open = D.teamOpen('MC');
    var days = st.byDay, max = Math.max(pastSla, Math.max.apply(null, days), 1), d0 = new Date(2026, 8, 20);

    root.innerHTML = head('Marcus', 'US vendors', next ? 'Next due: <b>' + esc(next.vendor) + '</b> in ' + dueIn(next.dueAt - now) : 'Nothing due soon') +
      '<div class="dash">' +
        kpi('m-intake', 'Intake queue', st.total, st.dueToday + ' due in the next 24 h', st.dueToday ? 'warn' : 'good', next ? esc(next.type) + ' · ' + esc(next.from) + ' is waiting' : 'Queue is clear') +
        kpi('m-sla', 'SLA at risk', pastSla + st.dueToday, pastSla + ' past SLA · ' + st.dueToday + ' due soon', pastSla ? 'bad' : 'warn', oldest ? 'Oldest: ' + esc(oldest.vendor) + ' (' + esc(oldest.age) + ' / ' + esc(oldest.sla) + ')' : 'Nothing past SLA') +
        kpi('m-parsed', 'Parsed for you', '312 <small>answers</small>', '0 re-keyed by hand', 'good', 'About 2.5 hours saved this week') +
        kpi('m-record', 'My score · 30 days', TEAM.MC.score + ' <small>/ 100</small>', TEAM.MC.delta + ' pts vs last month', TEAM.MC.dcls, '38 closed · 78% on time · 4% rework') +

        /* Intake queue */
        '<section class="panel has-ai d-12" aria-labelledby="iqTitle"><div class="panel__head"><h2 id="iqTitle">Intake queue</h2><span class="sub">Soonest deadline first. Countdowns are live.</span></div>' +
          '<div class="chip-row" role="group" aria-label="Filter intake">' + chips([['all', 'All', cnt.all], ['today', 'Due in 24 h', cnt.today], ['routine', 'Routine', cnt.routine], ['priya', 'Needs Priya', cnt.priya], ['waiting', 'Waiting on vendor', cnt.waiting]], f, 'data-mf') + '</div>' +
          '<div class="table-scroll"><table class="vendor-table intake"><thead><tr><th>Vendor</th><th>Due in</th><th>Questionnaire</th><th>Triage</th><th></th></tr></thead><tbody>' + vis.map(function (i) {
            var ms = i.dueAt - now, cls = ms < 6 * D.HOUR ? 'bad' : ms < 24 * D.HOUR ? 'warn' : '', a = intakeAction(i), pct = Math.round(i.answered / i.total * 100);
            return '<tr' + (i.flash ? ' class="is-changed"' : '') + '><td><div class="vendor-name">' + esc(i.vendor) + '</div><div class="vendor-sub">' + esc(i.type) + ' · ' + esc(i.from) + (i.note ? ' · ' + esc(i.note) : '') + '</div></td>' +
              '<td class="sla-cell ' + cls + '"><b>' + dueIn(ms) + '</b></td>' +
              '<td><div class="qbar ' + (i.missing.length ? '' : 'done') + '"><span style="width:' + pct + '%"></span></div><div class="vendor-sub">' + i.answered + ' of ' + i.total + ' answers parsed' + (i.missing.length ? ' · missing ' + esc(i.missing.join(', ')) : '') + (i.lastChased ? ' · chased ' + D.ageText(now - i.lastChased) : '') + '</div></td>' +
              '<td>' + (i.triage === 'priya' ? '<span class="tag t-new">↗ Needs Priya</span>' : '<span class="tag t-routine">Routine</span>') + '<div class="vendor-sub">' + esc(i.why) + '</div></td>' +
              '<td><button type="button" class="btn-row" data-in="' + i.id + '" data-inact="' + a.act + '"' + (a.disabled ? ' disabled' : '') + '>' + a.label + '</button></td></tr>';
          }).join('') + '</tbody></table></div>' + (vis.length ? '' : '<div class="empty-state" style="display:block">Nothing matches this filter.</div>') +
          '<div class="table-foot">Showing ' + vis.length + ' of ' + st.total + ' intake requests</div>' + U.spark('m-intake', 'the intake queue') + '</section>' +

        /* My investigation tasks */
        '<section class="panel has-ai d-12" aria-labelledby="mtTitle"><div class="panel__head"><h2 id="mtTitle">My investigation tasks</h2><span class="sub">Risk findings from the scan that are yours</span></div>' +
          '<div class="table-scroll"><table class="vendor-table attn"><thead>' + U.taskHead({ owner: false }) + '</thead><tbody>' + mine.map(function (t) { return U.taskRow(t, { owner: false }); }).join('') + '</tbody></table></div>' +
          (mine.length ? '' : '<div class="empty-state" style="display:block">No investigation tasks right now.</div>') +
          '<div class="table-foot">Showing ' + mine.length + ' of ' + open + ' open items</div>' + U.spark('m-tasks', 'my investigation tasks') + '</section>' +

        /* Due next 7 days */
        '<section class="panel has-ai d-7" aria-labelledby="ddTitle"><div class="panel__head"><h2 id="ddTitle">What is due in the next 7 days</h2><span class="sub">Intake deadlines, and what is already late</span></div><div class="panel__body">' +
          '<div class="due-bars" role="img" aria-label="Items due: ' + pastSla + ' already past SLA, then ' + days.join(', ') + ' over the next seven days.">' +
            '<div class="col"><span class="n">' + pastSla + '</span><div class="bar past" style="height:' + Math.max(4, pastSla / max * 80) + 'px"></div><span class="d">Past SLA</span></div>' +
            days.map(function (n, i) { var d = new Date(d0.getTime() + i * 864e5); return '<div class="col"><span class="n">' + n + '</span><div class="bar ' + (i === 0 ? 'today' : '') + '" style="height:' + Math.max(4, n / max * 80) + 'px"></div><span class="d">' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYNAMES[d.getDay()].slice(0, 3)) + '</span></div>'; }).join('') +
          '</div></div>' + U.spark('m-sla', 'what is due') + '</section>' +

        /* Shadow */
        '<section class="panel has-ai d-5" aria-labelledby="shTitle"><div class="panel__head"><h2 id="shTitle">Shadow a deep review</h2><span class="sub">Build toward technical work</span></div>' +
          '<ul class="row-list">' + D.SHADOWS.map(function (s) {
            return '<li><div class="grow"><div class="vendor-name">' + esc(s.what) + '</div><div class="vendor-sub">Priya · ' + esc(s.when) + '</div></div>' +
              (s.requested ? '<span class="done-note">✓ Requested</span>' : '<button type="button" class="btn-row" data-shadow="' + s.id + '">Ask to shadow</button>') + '</li>';
          }).join('') + '</ul><div class="panel__body" style="padding-top:0"></div>' + U.spark('m-shadow', 'shadowing a deep review') + '</section>' +
      '</div>';
  }

  /* ---------- Clicks inside the analyst views ---------- */
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-pf]'))) { view.priya = b.dataset.pf; renderPriya(); return; }
    if ((b = e.target.closest('[data-mf]'))) { view.intake = b.dataset.mf; renderMarcus(); return; }
    if ((b = e.target.closest('[data-ev]'))) { U.openEvidence(b.dataset.ev); return; }
    if ((b = e.target.closest('[data-shadow]'))) {
      var s = D.SHADOWS.filter(function (x) { return x.id === b.dataset.shadow; })[0]; act.shadow(s);
      U.toast('Asked Priya if you can shadow <b>' + esc(s.what.split(':')[0]) + '</b>.'); return;
    }
    if ((b = e.target.closest('[data-in]'))) {
      var i = D.INTAKE.filter(function (x) { return x.id === b.dataset.in; })[0]; if (!i) return;
      var a = b.dataset.inact;
      if (a === 'chase') { act.intakeChase(i); U.toast('Reminder sent to <b>' + esc(i.vendor) + '</b> for ' + esc(i.missing.join(' and ')) + '.'); }
      else if (a === 'priya') { act.intakeToPriya(i); U.toast('<b>' + esc(i.vendor) + '</b> sent to Priya, with your note. It is now in her queue.'); }
      else U.confirmPop(b, 'Clear this vendor?', 'Marks <b>' + esc(i.vendor) + '</b> approved and tells ' + esc(i.from) + ' they can go ahead.', 'Clear', function () { act.intakeClear(i); U.toast('<b>' + esc(i.vendor) + '</b> cleared. ' + esc(i.from) + ' has been told.'); });
      return;
    }
    if ((b = e.target.closest('[data-call]'))) {
      var c = D.CALLS.filter(function (x) { return x.id === b.dataset.call; })[0]; if (!c) return;
      if (b.dataset.callact === 'confirm') { act.callConfirm(c); U.toast('Confirmed: <b>' + esc(c.vendor) + '</b> as ' + esc(c.proposed) + '.'); return; }
      var opts = { DORA: ['Critical ICT provider', 'Important ICT provider', 'Not critical'], 'EU AI Act': ['High-risk', 'Limited risk', 'Minimal risk'], NIS2: ['Essential supplier', 'Important supplier', 'Out of scope'] }[c.framework];
      var el = U.openPop(b, '<div class="pop-title">Override the proposed call</div><label for="ovTier">Your call</label><select id="ovTier">' +
        opts.filter(function (o) { return o !== c.tier; }).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select><label for="ovWhy">Reason (kept for the audit record)</label><textarea id="ovWhy" placeholder="Why does the AI’s call not hold?"></textarea>' +
        '<div class="pop-actions"><button type="button" class="ai-btn ai-btn--primary" data-ok>Record override</button><button type="button" class="ai-btn ai-btn--ghost" data-no>Cancel</button></div>', 'dash-pop--form');
      el.querySelector('[data-no]').addEventListener('click', function () { U.closePop(true); });
      el.querySelector('[data-ok]').addEventListener('click', function () {
        var why = el.querySelector('#ovWhy').value.trim();
        if (!why) { el.querySelector('#ovWhy').focus(); el.querySelector('#ovWhy').setAttribute('placeholder', 'A reason is required.'); return; }
        var tier = el.querySelector('#ovTier').value; U.closePop(false); act.callOverride(c, tier, why); U.toast('Override recorded for <b>' + esc(c.vendor) + '</b>: ' + esc(tier) + '.');
      });
    }
  });

  /* ---------- Render whichever view is showing ---------- */
  function render() { if (D.persona === 'priya') renderPriya(); else if (D.persona === 'marcus') renderMarcus(); }
  D.onChange(render);
  D.onPersona(render);
  setInterval(function () { if (D.persona === 'marcus') renderMarcus(); }, 60000);     // countdowns

  /* ============================ Chat for the analyst cards ============================ */
  function L(id, label, fn) { return { id: id, kind: 'learn', label: label, answer: fn }; }
  function A(id, label, fn) { return { id: id, kind: 'act', label: label, answer: fn }; }
  function task(t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + esc(D.taskAge(t)) + ' / ' + esc(t.sla) + ')'; }
  function ctx(title, snap, intro, prompts) { return { title: title, snap: snap, intro: intro, prompts: prompts }; }
  var ASK = function (what) { return function () { return '<p>What would you like to learn about, or take action on, for <b>' + what + '</b>?</p>'; }; };

  var P_DRAFT_DANA = A('draft-dana', 'Draft a capacity note for Dana', function () {
    return { html: '<p>Here is a draft you can edit and send.</p>', draft: { title: 'Note to Dana', text: 'Hi Dana,\n\nMy queue is at ' + D.teamOpen('PN') + ' open tasks. Escalations from the team keep pushing my routine reviews back. I can take more work if we agree what moves down the list first. Can we talk this week?\n\nPriya' } };
  });

  var CONTEXTS = {
    /* ----- Priya ----- */
    'p-queue': ctx('My queue',
      function () { var m = priyaTasks(); return { label: 'My queue', value: m.length + ' shown <small>of ' + D.teamOpen('PN') + '</small>', trend: m.filter(function (t) { return t.from; }).length + ' sent to you', cls: 'warn' }; },
      ASK('your queue'),
      [L('start', 'What should I start with?', function () { var m = priyaTasks(); return { html: m.length ? '<p>I would start here:</p>' + ul(m.slice(0, 3).map(task)) + '<p class="ai-note">Tasks sent to you are first because someone is waiting on your call.</p>' : '<p>Your queue is clear.</p>' }; }),
       L('sent', 'What did Marcus and Dana send me?', function () { var m = priyaTasks().filter(function (t) { return t.from; }); return { html: m.length ? '<p>Sent to you:</p>' + ul(m.map(function (t) { return task(t) + '. ' + esc(U.FIRST[t.from]) + ': “' + esc(t.fromNote) + '”'; })) : '<p>Nothing has been sent to you.</p>' }; }),
       P_DRAFT_DANA]),
    'p-open': ctx('My open tasks',
      function () { return { label: 'My open tasks', value: D.teamOpen('PN') + ' <small>open</small>', trend: TEAM.PN.pastSla + ' past SLA', cls: TEAM.PN.pastSla ? 'bad' : 'good' }; },
      function () { return '<p>What would you like to learn about, or take action on, for <b>your workload</b>?</p><p class="ai-note">' + D.teamOpen('PN') + ' open, ' + TEAM.PN.pastSla + ' past SLA.</p>'; },
      [L('split', 'How is my work split?', function () { var t = TEAM.PN; return { html: '<p>Your open tasks:</p>' + ul(['<b>' + t.verifying + '</b> being verified', '<b>' + t.vendor + '</b> waiting on a vendor', '<b>' + t.review + '</b> in review', '<b>' + t.pastSla + '</b> past SLA']) }; }),
       L('room', 'Can I take more work?', function () { var p = D.teamOpen('PN'), m = D.teamOpen('MC'); return { html: '<p>You have <b>' + p + '</b> open, Marcus has <b>' + m + '</b>.</p><p>' + (p > m ? 'You are carrying more than Marcus, so I would not add more without moving routine reviews down.' : 'You have some room, but critical work arrives without warning, so keep a buffer.') + '</p>' }; }),
       P_DRAFT_DANA]),
    'p-escalated': ctx('Escalated to me',
      function () { var n = priyaTasks().filter(function (t) { return t.from; }).length; return { label: 'Escalated to me', value: n + ' <small>waiting</small>', trend: 'Needs your judgment', cls: 'warn' }; },
      ASK('what was escalated to you'),
      [L('who', 'Who escalated to me, and why?', function () { var m = priyaTasks().filter(function (t) { return t.from; }); return { html: m.length ? ul(m.map(function (t) { return task(t) + '. From ' + esc(U.FIRST[t.from]) + ': “' + esc(t.fromNote) + '”'; })) : '<p>Nothing has been escalated to you.</p>' }; }),
       A('reply', 'Draft a reply to Marcus', function () { return { html: '<p>Here is a draft.</p>', draft: { title: 'Reply to Marcus', text: 'Hi Marcus,\n\nThanks for flagging these. Good call sending them up. I will take the DORA question this afternoon. If you want to join the review at 2 pm, you are welcome to, and I will walk through how I read the criteria.\n\nPriya' } }; })]),
    'p-evidence': ctx('Evidence to review',
      function () { var e = D.EVIDENCE.filter(function (x) { return !x.reviewed; }); return { label: 'Evidence to review', value: e.length + ' <small>documents</small>', trend: sum(e.map(function (x) { return x.exceptions.length; })) + ' exceptions flagged', cls: 'warn' }; },
      ASK('the evidence to review'),
      [L('matter', 'Which exceptions matter most?', function () { var e = D.EVIDENCE.filter(function (x) { return !x.reviewed; }).sort(function (a, b) { return b.exceptions.length - a.exceptions.length; }).slice(0, 3); return { html: e.length ? '<p>Start with these, ranked by how many exceptions each has:</p>' + ul(e.map(function (x) { return '<b>' + esc(x.vendor) + '</b> (' + esc(x.doc) + '): p. ' + x.exceptions[0].page + ', ' + esc(x.exceptions[0].text); })) : '<p>Everything has been reviewed.</p>' }; }),
       L('how', 'How does the AI pre-read work?', function () { return { html: '<p>Tessera reads the whole document, compares what the vendor claims against the test results and appendices, and flags exceptions with the page they are on. It does not decide what an exception means. That is your call.</p>' }; }),
       A('all', 'Mark everything reviewed', function () { var e = D.EVIDENCE.filter(function (x) { return !x.reviewed; }); return e.length ? { html: '<p>This marks ' + plural(e.length, 'document') + ' reviewed. Only do this if you have read them.</p>', proposal: { type: 'evidence-all', title: 'Proposed action · mark reviewed', items: e.map(function (x) { return '<b>' + esc(x.vendor) + '</b>: ' + esc(x.doc); }), approve: 'Mark reviewed', done: 'the documents would be marked reviewed.' } } : { html: '<p>Everything is already reviewed.</p>' }; })]),
    'p-calls': ctx('Regulatory calls',
      function () { var c = D.CALLS.filter(function (x) { return x.status === 'pending'; }); return { label: 'Regulatory calls', value: c.length + ' <small>waiting on you</small>', trend: 'DORA · NIS2 · EU AI Act', cls: c.length ? 'warn' : 'good' }; },
      ASK('the regulatory calls'),
      [L('pending', 'What is waiting on me?', function () { var c = D.CALLS.filter(function (x) { return x.status === 'pending'; }); return { html: c.length ? ul(c.map(function (x) { return '<b>' + esc(x.vendor) + '</b> (' + esc(x.framework) + '): proposed ' + esc(x.proposed) + '. ' + esc(x.basis) + '.'; })) : '<p>Every call has been decided.</p>' }; }),
       L('how', 'How does Tessera propose a call?', function () { return { html: '<p>It applies the framework’s criteria to what it knows about the vendor and shows how many are met. You can confirm it, or override it with a reason, and the reason is kept for the audit record.</p>' }; }),
       A('why', 'Draft my reasoning for an override', function () { return { html: '<p>Here is a starting point.</p>', draft: { title: 'Override reasoning', text: 'I am overriding the proposed call because [the vendor’s use is narrower than the criteria assume / a compensating control applies / the data in scope differs]. Evidence: [page or document]. Reviewed by Priya Nair.' } }; })]),
    'p-returning': ctx('Vendors you have seen before',
      function () { return { label: 'Vendors you have seen before', value: D.RETURNING.length + ' <small>returning</small>', sub: D.RETURNING.map(function (r) { return r.vendor; }).join(' · ') }; },
      ASK('vendors you have seen before'),
      [L('changed', 'What has come back?', function () { return { html: ul(D.RETURNING.map(function (r) { return '<b>' + esc(r.vendor) + '</b>: ' + esc(r.event) + '. ' + plural(r.prior, 'earlier finding') + ' (last ' + esc(r.last) + '). ' + esc(r.note) + '.'; })) }; }),
       A('request', 'Draft a request for updated evidence', function () { return { html: '<p>Here is a draft.</p>', draft: { title: 'Request for updated evidence', text: 'We are preparing your renewal review. Please send your latest SOC 2 report and a status update on the findings from our last review, including remediation dates.' } }; })]),

    /* ----- Marcus ----- */
    'm-intake': ctx('Intake queue',
      function () { var s = D.intakeStats(); return { label: 'Intake queue', value: s.total + ' <small>requests</small>', trend: s.dueToday + ' due in 24 h', cls: s.dueToday ? 'warn' : 'good' }; },
      ASK('the intake queue'),
      [L('first', 'What is due first?', function () { var i = D.INTAKE.slice().sort(function (a, b) { return a.dueAt - b.dueAt; }).slice(0, 3); return { html: '<p>The next three deadlines:</p>' + ul(i.map(function (x) { return '<b>' + esc(x.vendor) + '</b> in ' + dueIn(x.dueAt - Date.now()) + ' (' + esc(x.type) + ', ' + esc(x.from) + ')'; })) }; }),
       L('routine', 'What can I fast-track?', function () { var i = D.INTAKE.filter(function (x) { return x.triage === 'routine' && !x.missing.length; }); return { html: i.length ? '<p>These are routine and complete:</p>' + ul(i.map(function (x) { return '<b>' + esc(x.vendor) + '</b>: ' + esc(x.why); })) : '<p>Nothing is both routine and complete right now.</p>' }; }),
       L('priya', 'What needs Priya?', function () { var i = D.INTAKE.filter(function (x) { return x.triage === 'priya'; }); return { html: i.length ? ul(i.map(function (x) { return '<b>' + esc(x.vendor) + '</b>: ' + esc(x.why); })) : '<p>Nothing needs Priya right now.</p>' }; }),
       A('clear-all', 'Clear the routine, complete requests', function () { var i = D.INTAKE.filter(function (x) { return x.triage === 'routine' && !x.missing.length; }); return i.length ? { html: '<p>' + plural(i.length, 'request') + ' can be cleared now.</p>', proposal: { type: 'intake-clear', ids: i.map(function (x) { return x.id; }), title: 'Proposed action · clear', items: i.map(function (x) { return '<b>' + esc(x.vendor) + '</b> (' + esc(x.from) + ')'; }), approve: 'Clear them', done: 'the requests would be cleared and the requesters told.' } } : { html: '<p>Nothing is ready to clear.</p>' }; }),
       A('chase-all', 'Chase vendors with missing items', function () { var i = D.INTAKE.filter(function (x) { return x.triage === 'routine' && x.missing.length && !x.lastChased; }); return i.length ? { html: '<p>' + plural(i.length, 'vendor') + ' still owe you something.</p>', proposal: { type: 'intake-chase', ids: i.map(function (x) { return x.id; }), title: 'Proposed action · send reminders', items: i.map(function (x) { return '<b>' + esc(x.vendor) + '</b>: ' + esc(x.missing.join(', ')); }), approve: 'Send reminders', done: 'a reminder would go to each vendor.' } } : { html: '<p>Nobody is missing anything, or they have all been chased.</p>' }; }),
       A('send-priya', 'Send the Priya items to her', function () { var i = D.INTAKE.filter(function (x) { return x.triage === 'priya'; }); return i.length ? { html: '<p>Tessera flagged ' + plural(i.length, 'request') + ' as needing Priya.</p>', proposal: { type: 'intake-priya', ids: i.map(function (x) { return x.id; }), title: 'Proposed action · send to Priya', items: i.map(function (x) { return '<b>' + esc(x.vendor) + '</b>: ' + esc(x.why); }), approve: 'Send to Priya', done: 'the requests would move to Priya’s queue.' } } : { html: '<p>Nothing needs Priya right now.</p>' }; })]),
    'm-sla': ctx('SLA at risk',
      function () { var s = D.intakeStats(); return { label: 'SLA at risk', value: (TEAM.MC.pastSla + s.dueToday) + ' <small>items</small>', trend: TEAM.MC.pastSla + ' past SLA · ' + s.dueToday + ' due soon', cls: TEAM.MC.pastSla ? 'bad' : 'warn' }; },
      ASK('your SLAs'),
      [L('late', 'What is already late?', function () { var m = D.TASKS.filter(function (t) { return t.owner === 'MC' && t.state === 'stale'; }); return { html: '<p><b>' + TEAM.MC.pastSla + ' items</b> are past SLA. The ones in your list:</p>' + (m.length ? ul(m.map(task)) : '<p>None in the list.</p>') }; }),
       L('week', 'What is due this week?', function () { var s = D.intakeStats(); return { html: '<p>Intake deadlines by day:</p>' + ul(s.byDay.map(function (n, i) { return '<b>' + (i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'In ' + i + ' days') + '</b>: ' + n; })) }; }),
       A('nudge', 'Nudge the vendors on my late tasks', function () { var m = D.TASKS.filter(function (t) { return t.owner === 'MC' && t.action === 'Nudge' && !t.nudged; }); return m.length ? { html: '<p>' + plural(m.length, 'task') + ' can be nudged.</p>', proposal: { type: 'nudge', ids: m.map(function (t) { return t.id; }), title: 'Proposed action · follow up with vendors', items: m.map(task), approve: 'Send follow-ups', done: 'follow-ups would be sent.' } } : { html: '<p>Nothing needs a nudge right now.</p>' }; })]),
    'm-parsed': ctx('Parsed for you',
      function () { return { label: 'Parsed for you', value: '312 <small>answers</small>', trend: '0 re-keyed by hand', cls: 'good' }; },
      ASK('automatic parsing'),
      [L('how', 'How does the parsing work?', function () { return { html: '<p>Tessera reads each questionnaire PDF, extracts the answers into the vendor record, and flags any it is not confident about, so you check a few instead of retyping all of them.</p>' }; }),
       L('saved', 'How much time has it saved?', function () { return { html: '<p>About <b>2.5 hours</b> this week, from 312 answers that did not have to be re-keyed. That time is what you can spend shadowing deeper reviews.</p>' }; })]),
    'm-record': ctx('My score',
      function () { return { label: 'My score · 30 days', value: TEAM.MC.score + ' <small>/ 100</small>', trend: TEAM.MC.delta + ' pts vs last month', cls: TEAM.MC.dcls }; },
      ASK('your score'),
      [L('calc', 'What is my score made of?', function () { return { html: '<p>Four parts over 30 days: closed on time (40%), time to verify (20%), vendor follow-ups sent (20%), reopened or rework (20%). You have <b>38 closed</b>, <b>78% on time</b>, <b>4% rework</b>.</p>' }; }),
       L('improve', 'What would help most?', function () { return { html: '<p>Two things move it most:</p>' + ul(['Clear the <b>' + TEAM.MC.pastSla + ' past-SLA</b> items. On-time closure is 40% of the score.', 'Waiting on a vendor pauses your SLA clock, so chase vendors early rather than late.']) + '<p class="ai-note">A score drop while you carry ' + D.teamOpen('MC') + ' open items is mostly capacity.</p>' }; }),
       A('cap', 'Draft a capacity note for Dana', function () { return { html: '<p>Here is a draft.</p>', draft: { title: 'Note to Dana', text: 'Hi Dana,\n\nI have ' + D.teamOpen('MC') + ' open items with ' + TEAM.MC.pastSla + ' past SLA. I want to be reliable on the urgent ones, so I would like to talk about what can move to Priya or wait. Can we take 15 minutes this week?\n\nMarcus' } }; })]),
    'm-tasks': ctx('My investigation tasks',
      function () { var m = D.TASKS.filter(function (t) { return t.owner === 'MC'; }); return { label: 'My investigation tasks', value: m.length + ' <small>shown</small>', trend: m.filter(function (t) { return t.state === 'stale'; }).length + ' past SLA', cls: 'bad' }; },
      ASK('your investigation tasks'),
      [L('late', 'Which are past SLA?', function () { var m = D.TASKS.filter(function (t) { return t.owner === 'MC' && t.state === 'stale'; }); return { html: m.length ? ul(m.map(task)) : '<p>None are past SLA.</p>' }; }),
       A('nudge', 'Nudge the vendors', function () { var m = D.TASKS.filter(function (t) { return t.owner === 'MC' && t.action === 'Nudge' && !t.nudged; }); return m.length ? { html: '<p>' + plural(m.length, 'task') + ' can be nudged.</p>', proposal: { type: 'nudge', ids: m.map(function (t) { return t.id; }), title: 'Proposed action · follow up with vendors', items: m.map(task), approve: 'Send follow-ups', done: 'follow-ups would be sent.' } } : { html: '<p>Nothing needs a nudge right now.</p>' }; })]),
    'm-shadow': ctx('Shadow a deep review',
      function () { return { label: 'Shadow a deep review', value: D.SHADOWS.length + ' <small>open to shadow</small>', sub: D.SHADOWS.filter(function (s) { return s.requested; }).length + ' requested' }; },
      ASK('shadowing'),
      [L('why', 'Why shadow a review?', function () { return { html: '<p>Watching how Priya reads a SOC 2 report or a pen test summary is the fastest route from checklist work to technical assessments, and it is part of how Tessera marks growth on your record.</p>' }; }),
       A('ask', 'Ask to shadow the next review', function () { var s = D.SHADOWS.filter(function (x) { return !x.requested; })[0]; return s ? { html: '<p>The next one is <b>' + esc(s.what) + '</b> (' + esc(s.when) + ').</p>', proposal: { type: 'shadow', ids: [s.id], title: 'Proposed action · ask to shadow', items: [esc(s.what) + ', ' + esc(s.when)], approve: 'Ask Priya', done: 'Priya would be asked.' } } : { html: '<p>You have asked about all of them.</p>' }; })])
  };
  Object.keys(CONTEXTS).forEach(function (k) { AI.define(k, CONTEXTS[k]); });

  /* Approved actions from the analyst chats */
  function each(p, list) { return list.filter(function (x) { return (p.ids || []).indexOf(x.id) >= 0; }); }
  AI.setActions({
    'evidence-all': function (p) { var l = each(p, D.EVIDENCE); l.forEach(function (e) { act.evidenceReview(e); }); return { reveal: '#evTitle', message: '<p>Marked <b>' + plural(l.length, 'document') + '</b> reviewed.</p>' }; },
    'intake-clear': function (p) { var l = each(p, D.INTAKE); l.forEach(function (i) { act.intakeClear(i); }); return { reveal: '#iqTitle', message: '<p>Cleared <b>' + plural(l.length, 'request') + '</b>: ' + l.map(function (i) { return esc(i.vendor); }).join(', ') + '. The requesters have been told.</p>' }; },
    'intake-chase': function (p) { var l = each(p, D.INTAKE); l.forEach(function (i) { act.intakeChase(i); }); return { reveal: '#iqTitle', message: '<p>Reminders sent to <b>' + plural(l.length, 'vendor') + '</b>. The rows show when they were chased.</p>' }; },
    'intake-priya': function (p) { var l = each(p, D.INTAKE); l.forEach(function (i) { act.intakeToPriya(i); }); return { reveal: '#iqTitle', message: '<p>Sent <b>' + plural(l.length, 'request') + '</b> to Priya. They are now in her queue, tagged as coming from you.</p>' }; },
    'shadow': function (p) { var l = each(p, D.SHADOWS); l.forEach(function (s) { act.shadow(s); }); return { reveal: '#shTitle', message: '<p>Asked Priya if you can shadow <b>' + esc(l[0] ? l[0].what.split(':')[0] : 'the review') + '</b>.</p>' }; }
  });

  /* Chat scoped to one task or one document (opened from the drawer) */
  AI.openTask = function (t) {
    var key = 'task:' + t.id, sug = D.pickOwner(t);
    AI.define(key, ctx(t.vendor, function () { return { label: t.vendor, value: '+' + t.impact.toFixed(1) + ' <small>points</small>', trend: (t.state === 'stale' ? 'Past SLA ' : '') + D.taskAge(t) + ' / ' + t.sla, cls: t.state === 'stale' ? 'bad' : '' }; },
      function () { return '<p>What would you like to learn about, or take action on, for <b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + '?</p>'; },
      [L('why', 'Why is this a priority?', function () { return { html: '<p>It adds <b>+' + t.impact.toFixed(1) + ' points</b> to the portfolio score, and ' + esc(D.TIER[t.tier].toLowerCase()) + '-tier vendors carry ' + ({ critical: 'the most', high: 'a high', medium: 'a moderate', low: 'a low' })[t.tier] + ' weight.' + (t.state === 'stale' ? ' It is <b>past its SLA</b>, so it now counts for up to double.' : '') + '</p>' }; }),
       L('next', 'What should I do next?', function () { return { html: '<p>' + (!t.owner ? 'Assign it first. I would give it to <b>' + esc(U.FIRST[sug.owner]) + '</b> (' + esc(sug.why) + ').' : t.state === 'stale' ? 'It is past SLA, so follow up with the vendor now' + (t.action === 'Escalate' ? ', and escalate to a senior contact, since a nudge is unlikely to move it.' : '.') : 'It is with ' + esc(U.FIRST[t.owner]) + ' and within SLA. Confirm the finding with the vendor and ask for a remediation date.') + '</p>' }; }),
       A('draft', 'Draft a note to the vendor', function () { return { html: '<p>Here is a draft to the security contact at <b>' + esc(t.vendor) + '</b>.</p>', draft: { title: 'Note to ' + t.vendor, text: 'Subject: Open security finding at ' + t.vendor + '\n\nOur continuous monitoring flagged: "' + t.issue + '".\n\nPlease confirm the finding, name an owner on your side, and share a remediation date within 2 business days.\n\nNorthbridge Vendor Risk' } }; })]
        .concat(!t.owner ? [A('assign', 'Assign this task', function () { return { html: '<p>Tessera suggests <b>' + esc(U.FIRST[sug.owner]) + '</b> (' + esc(sug.why) + ').</p>', proposal: { type: 'assign', ids: [t.id], title: 'Proposed action · assign', items: [esc(t.vendor) + ' → ' + esc(U.FIRST[sug.owner])], approve: 'Approve', done: 'the task would be assigned.' } }; })] : [])));
    AI.open({ context: key });
  };
  AI.openEvidence = function (e) {
    var key = 'evidence:' + e.id;
    AI.define(key, ctx(e.vendor + ' evidence', function () { return { label: e.doc, value: e.exceptions.length + ' <small>exceptions</small>', sub: e.vendor + ' · ' + e.pages + ' pages · AI confidence ' + e.conf + '%' }; },
      function () { return '<p>What would you like to learn about, or take action on, for the <b>' + esc(e.doc) + '</b> from ' + esc(e.vendor) + '?</p>'; },
      [L('matter', 'Which exception matters most?', function () { var x = e.exceptions[0]; return { html: '<p>Start with <b>p. ' + x.page + '</b>: ' + esc(x.text) + '</p><p class="ai-note">Ordered by how likely it is to change your call, then by page.</p>' }; }),
       L('how', 'How did the AI find these?', function () { return { html: '<p>Tessera read all ' + e.pages + ' pages, compared the vendor’s claims to the test results and appendices, and flagged the mismatches with their page numbers. Confidence is ' + e.conf + '%.</p>' }; }),
       A('qs', 'Draft questions for the vendor', function () { return { html: '<p>Here is a draft with one question per exception.</p>', draft: { title: 'Questions for ' + e.vendor, text: 'We have reviewed your ' + e.doc + ' and have a few questions:\n\n' + e.exceptions.map(function (x, i) { return (i + 1) + '. (p. ' + x.page + ') ' + x.text.replace(/\.$/, '') + '. Can you explain, and share the remediation plan?'; }).join('\n') } }; })]
        .concat(e.reviewed ? [] : [A('rev', 'Mark this reviewed', function () { return { html: '<p>Only do this once you have read the exceptions.</p>', proposal: { type: 'evidence-all', ids: [e.id], title: 'Proposed action · mark reviewed', items: [esc(e.vendor) + ': ' + esc(e.doc)], approve: 'Mark reviewed', done: 'the document would be marked reviewed.' } }; })])));
    AI.open({ context: key });
  };
})(window);
