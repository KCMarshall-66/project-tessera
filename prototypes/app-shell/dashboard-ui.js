/* Shared interface pieces for the Dashboard and the analyst dashboards: task rows, the
   row buttons (Assign, Open, Nudge, Escalate), popovers, toasts, the task and evidence
   drawers, the AI sparkle buttons, and the persona switcher.
   Needs dashboard-state.js. Exposes window.TesseraUI. */
(function (global) {
  'use strict';

  var D = global.TesseraDash, act = D.act, TEAM = D.TEAM, TIER = D.TIER;
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FIRST = { PN: 'Priya', MC: 'Marcus', DV: 'Dana' };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  /* ---------- Task rows (shared by every task list) ---------- */
  function tagFor(t) {
    return t.escalated                  ? '<span class="tag t-crit">↑ Escalated</span>' :
           !t.owner                     ? '<span class="tag t-new">● New</span>' :
           t.from && t.state !== 'stale' ? '<span class="tag t-new">↗ From ' + FIRST[t.from] + '</span>' :
           t.state === 'stale'          ? '<span class="tag t-stale">⏱ Past SLA</span>' :
           t.state === 'waiting'        ? '<span class="tag t-wait">◔ Waiting on vendor</span>' :
           t.sev === 'critical'         ? '<span class="tag t-crit">▲ Critical</span>' :
                                          '<span class="tag t-work">◐ In progress</span>';
  }
  function ownerFor(t) {
    return t.owner ? '<span class="owner-cell"><span class="avatar-chip">' + t.owner + '</span>' + FIRST[t.owner] + '</span>'
                   : '<span class="owner-cell"><span class="avatar-chip un">?</span>Unassigned</span>';
  }
  function taskHead(o) {
    o = o || {};
    return '<tr><th class="col-issue">Issue</th><th class="col-vendor">Vendor · tier</th><th>Status</th><th>Age / SLA</th>' + (o.owner === false ? '' : '<th>Owner</th>') + '<th>Risk impact</th><th></th></tr>';
  }
  function taskRow(t, o) {
    o = o || {};
    var act_ = String(t.action || 'Open').toLowerCase();
    return '<tr' + (t.isNew ? ' class="is-new"' : t.flash ? ' class="is-changed"' : '') + '>' +
      '<td><div class="vendor-name">' + esc(t.issue) + '</div><div class="vendor-sub">Category: ' + esc(t.cat) + '</div></td>' +
      '<td><div class="vendor-name">' + esc(t.vendor) + '</div><div class="vendor-sub">' + TIER[t.tier] + ' tier</div></td>' +
      '<td>' + tagFor(t) + (t.nudged ? '<div class="vendor-sub">Follow-up sent</div>' : '') + (t.escalated ? '<div class="vendor-sub">Sent to vendor’s senior contact</div>' : '') + '</td>' +
      '<td class="age' + (t.ageBad ? ' bad' : '') + '"><span' + (t.t0 ? ' data-t0="' + t.t0 + '"' : '') + '>' + esc(D.taskAge(t)) + '</span> <span class="vendor-sub">/ ' + esc(t.sla) + '</span></td>' +
      (o.owner === false ? '' : '<td>' + ownerFor(t) + '</td>') +
      '<td class="impact ' + (t.impact >= 0.8 ? 'bad' : 'warn') + '">+' + t.impact.toFixed(1) + '</td>' +
      '<td><button type="button" class="btn-row" data-act="' + (t.nudged ? 'open' : act_) + '" data-id="' + t.id + '"' + (t.nudged && act_ === 'nudge' ? ' disabled' : '') + '>' + (t.nudged && act_ === 'nudge' ? 'Nudged' : esc(t.action || 'Open')) + '</button></td>' +
    '</tr>';
  }
  setInterval(function () {
    document.querySelectorAll('[data-t0]').forEach(function (el) { el.textContent = D.ageText(Date.now() - Number(el.dataset.t0)); });
  }, 30000);

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  function toast(html) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'dash-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.innerHTML = html; toastEl.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200);
  }

  /* ---------- Popover (menus and small confirmations anchored to a button) ---------- */
  var pop = null;
  function closePop(restore) {
    if (!pop) return;
    pop.el.remove();
    document.removeEventListener('mousedown', pop.outside, true);
    document.removeEventListener('keydown', pop.key, true);
    var a = pop.anchor; pop = null;
    if (restore && a && document.contains(a)) a.focus();
  }
  function openPop(anchor, html, cls) {
    closePop(false);
    var el = document.createElement('div');
    el.className = 'dash-pop ' + (cls || ''); el.setAttribute('role', 'dialog'); el.innerHTML = html;
    document.body.appendChild(el);
    var r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    var left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    var top = r.bottom + 6; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    el.style.left = left + 'px'; el.style.top = top + 'px';
    pop = {
      el: el, anchor: anchor,
      outside: function (e) { if (!el.contains(e.target) && e.target !== anchor) closePop(false); },
      key: function (e) { if (e.key === 'Escape') { e.stopPropagation(); closePop(true); } }
    };
    document.addEventListener('mousedown', pop.outside, true);
    document.addEventListener('keydown', pop.key, true);
    var first = el.querySelector('button, select, textarea'); if (first) first.focus();
    return el;
  }

  function assignMenu(anchor, t) {
    var sug = D.pickOwner(t);
    var items = ['PN', 'MC', 'DV'].map(function (k) {
      var m = TEAM[k], open = D.teamOpen(k);
      return '<button type="button" class="pop-item" data-owner="' + k + '"><img src="../../personas/' + m.img + '.png" alt="">' +
        '<span><b>' + FIRST[k] + '</b><small>' + esc(m.role) + ' · ' + open + ' open' + (open >= D.AT_CAPACITY ? ' (at capacity)' : '') + '</small></span>' +
        (k === sug.owner ? '<em>Suggested · ' + esc(sug.why) + '</em>' : '') + '</button>';
    }).join('');
    var el = openPop(anchor, '<div class="pop-title">Assign to</div>' + items, 'dash-pop--menu');
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.pop-item'); if (!b) return;
      closePop(false); act.assign(t, b.dataset.owner);
      toast('<b>' + esc(t.vendor) + '</b> assigned to ' + FIRST[b.dataset.owner] + '.');
    });
  }
  function confirmPop(anchor, title, body, okLabel, onOk) {
    var el = openPop(anchor, '<div class="pop-title">' + esc(title) + '</div><p class="pop-body">' + body + '</p>' +
      '<div class="pop-actions"><button type="button" class="ai-btn ai-btn--primary" data-ok>' + esc(okLabel) + '</button><button type="button" class="ai-btn ai-btn--ghost" data-no>Cancel</button></div>', 'dash-pop--confirm');
    el.querySelector('[data-ok]').addEventListener('click', function () { closePop(false); onOk(); });
    el.querySelector('[data-no]').addEventListener('click', function () { closePop(true); });
  }

  /* ---------- Row buttons (event delegation, so every task list works) ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.btn-row[data-act]'); if (!b || b.disabled) return;
    var t = D.byId(b.dataset.id); if (!t) return;
    switch (b.dataset.act) {
      case 'assign': assignMenu(b, t); break;
      case 'nudge':
        act.nudge(t); toast('Follow-up sent to <b>' + esc(t.vendor) + '</b>. The row now shows “Follow-up sent”.'); break;
      case 'escalate':
        confirmPop(b, 'Escalate to the vendor?', 'This sends <b>' + esc(t.vendor) + '</b>’s senior contact a formal escalation, and Dana takes ownership.', 'Escalate',
          function () { act.escalate(t); toast('Escalated <b>' + esc(t.vendor) + '</b> to the vendor’s senior contact.'); }); break;
      default: openTask(t.id);
    }
  });

  /* ---------- AI sparkle buttons ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.ai-spark'); if (!b) return;
    document.dispatchEvent(new CustomEvent('tessera:ai-chat', { detail: { source: 'card', context: b.dataset.ai, card: b.closest('.stat-card, .panel') } }));
  });
  function spark(key, label) {
    return '<button type="button" class="ai-spark" aria-haspopup="dialog" data-ai="' + key + '" aria-label="Ask Tessera AI about ' + esc(label) + '" title="Ask Tessera AI"><img src="../../brand/ai-sparkle.svg" alt="" width="16" height="16"></button>';
  }

  /* ---------- Drawer (task and evidence detail) ---------- */
  var drawer, drawerBody, drawerKind = null, drawerId = null;
  function buildDrawer() {
    drawer = document.createElement('dialog'); drawer.className = 'dash-drawer'; drawer.setAttribute('aria-labelledby', 'drawerTitle');
    drawer.innerHTML = '<div class="drawer-shell"><button type="button" class="ai-close drawer-close" aria-label="Close details"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><div class="drawer-body"></div></div>';
    document.body.appendChild(drawer);
    drawerBody = drawer.querySelector('.drawer-body');
    drawer.querySelector('.drawer-close').addEventListener('click', function () { drawer.close(); });
    drawer.addEventListener('click', function (e) { if (e.target === drawer) drawer.close(); });
    drawer.addEventListener('close', function () { drawerKind = null; drawerId = null; closePop(false); });
    drawer.addEventListener('click', drawerClick);
  }

  var DETAIL = {
    'Assurance lapse': 'The vendor’s assurance evidence has lapsed or is about to. No renewed report is available in the vendor’s trust center.',
    'Exposed service': 'A service belonging to the vendor is reachable from the public internet. It was found by an internet-wide scan and the exposure has not been confirmed as intended.',
    'Vulnerability': 'A known vulnerability affects software in the vendor’s stack. A vendor advisory exists, but nobody has confirmed the patch.',
    'Data breach': 'Records that reference the vendor’s domain were posted publicly. Their authenticity has not been verified.',
    'Credential exposure': 'Credentials that match the vendor’s domain were found in a public code repository.',
    'Certificate hygiene': 'A certificate or transport-security setting on a vendor system is expired, expiring, or weaker than expected. It was found in certificate transparency logs.',
    'Regulatory': 'The vendor is named in a public regulator notice. The notice has not yet been assessed for impact on Northbridge.',
    'Escalated review': 'Marcus flagged this intake request as needing a deeper review than a standard first pass.',
    'Evidence review': 'The AI pre-read found exceptions in the vendor’s evidence that need an analyst’s judgment.',
    'Renewal': 'The vendor is coming back for renewal, and findings from the last review are still open.',
    'Configuration': 'A configuration weakness was found on a public vendor system.',
    'Availability': 'A public vendor system is responding slowly or intermittently.'
  };
  function catKey(t) { return String(t.cat).split(' · ')[0]; }

  function timeline(t) {
    var rows = ['<li><b>Detected</b><span>' + esc(D.taskAge(t)) + ' ago, by the continuous scan</span></li>', '<li><b>Categorized</b><span>' + esc(catKey(t)) + ', severity ' + esc(t.sev) + '</span></li>', '<li><b>Task created</b><span>Investigation task with a ' + esc(t.sla) + ' SLA</span></li>'];
    rows.push(t.owner ? '<li><b>Assigned</b><span>' + esc(FIRST[t.owner]) + (t.from ? ' (escalated by ' + FIRST[t.from] + ')' : '') + '</span></li>' : '<li class="is-open"><b>Not assigned yet</b><span>Nobody is working on this</span></li>');
    if (t.nudged) rows.push('<li><b>Follow-up sent</b><span>To the vendor’s security contact, just now</span></li>');
    if (t.escalated) rows.push('<li><b>Escalated</b><span>To the vendor’s senior contact, just now</span></li>');
    return '<ol class="drawer-timeline">' + rows.join('') + '</ol>';
  }

  function renderTask(t) {
    var can = { assign: !t.owner, nudge: t.state === 'stale' && !t.nudged && !t.escalated, escalate: (t.state === 'stale' || t.action === 'Escalate') && !t.escalated };
    var late = t.state === 'stale';
    drawerBody.innerHTML =
      '<div class="drawer-eyebrow">' + esc(catKey(t)) + '</div>' +
      '<h2 id="drawerTitle">' + esc(t.vendor) + '</h2>' +
      '<p class="drawer-issue">' + esc(t.issue) + '</p>' +
      '<div class="drawer-tags">' + tagFor(t) + '<span class="pill ' + t.sev + '">' + t.sev + '</span><span class="drawer-tier">' + TIER[t.tier] + ' tier vendor</span></div>' +
      '<dl class="drawer-facts">' +
        '<div><dt>Age / SLA</dt><dd class="' + (late ? 'bad' : '') + '">' + esc(D.taskAge(t)) + ' / ' + esc(t.sla) + '</dd></div>' +
        '<div><dt>Owner</dt><dd>' + (t.owner ? esc(TEAM[t.owner].name) : 'Unassigned') + '</dd></div>' +
        '<div><dt>Risk impact</dt><dd>+' + t.impact.toFixed(1) + ' points</dd></div>' +
        '<div><dt>Region</dt><dd>' + esc(t.region || 'n/a') + '</dd></div>' +
      '</dl>' +
      '<h3>What Tessera found</h3><p>' + esc(DETAIL[catKey(t)] || 'Tessera flagged this as a high-risk signal for the vendor.') + '</p>' +
      (t.fromNote ? '<p class="drawer-note">Marcus’s note: ' + esc(t.fromNote) + '.</p>' : '') +
      '<h3>Why it matters</h3><ul><li>It adds <b>+' + t.impact.toFixed(1) + ' points</b> to the portfolio risk score while it stays open.</li>' +
        '<li>' + TIER[t.tier] + '-tier vendors carry ' + ({ critical: 'the most', high: 'a high', medium: 'a moderate', low: 'a low' })[t.tier] + ' weight in the score.</li>' +
        (late ? '<li>It is <b>past its SLA</b>, so it now counts for more, up to double.</li>' : '') + '</ul>' +
      '<h3>Timeline</h3>' + timeline(t) +
      '<div class="drawer-actions">' +
        (can.assign ? '<button type="button" class="ai-btn ai-btn--primary" data-d="assign">Assign…</button>' : '') +
        (can.nudge ? '<button type="button" class="ai-btn ai-btn--primary" data-d="nudge">Nudge vendor</button>' : '') +
        (can.escalate ? '<button type="button" class="ai-btn ai-btn--ghost" data-d="escalate">Escalate</button>' : '') +
        '<button type="button" class="ai-btn ai-btn--ghost" data-d="resolve">Mark resolved</button>' +
        '<button type="button" class="ai-btn ai-btn--ghost drawer-ask" data-d="ask">' + '<img src="../../brand/ai-sparkle.svg" alt="" width="14" height="14">Ask Tessera AI</button>' +
      '</div>';
  }

  function renderEvidence(e) {
    var n = e.exceptions.length;
    drawerBody.innerHTML =
      '<div class="drawer-eyebrow">' + esc(e.doc) + ' · AI pre-read</div>' +
      '<h2 id="drawerTitle">' + esc(e.vendor) + '</h2>' +
      '<p class="drawer-issue">Read ' + e.pages + ' pages and flagged <b>' + n + (n === 1 ? ' exception' : ' exceptions') + '</b>, each with the page it is on.</p>' +
      '<div class="drawer-tags">' + (e.reviewed ? '<span class="tag t-work">✓ Reviewed</span>' : '<span class="tag t-new">● To review</span>') + '<span class="drawer-tier">AI confidence ' + e.conf + '%</span></div>' +
      '<h3>Exceptions</h3><ul class="drawer-exceptions">' + e.exceptions.map(function (x) { return '<li><span class="pg">p. ' + x.page + '</span>' + esc(x.text) + '</li>'; }).join('') + '</ul>' +
      '<p class="drawer-note">Tessera does not make the judgment call. It points you to the pages that change it.</p>' +
      '<div class="drawer-actions">' +
        (e.reviewed ? '' : '<button type="button" class="ai-btn ai-btn--primary" data-d="reviewed">Mark reviewed</button>') +
        '<button type="button" class="ai-btn ai-btn--ghost drawer-ask" data-d="ask"><img src="../../brand/ai-sparkle.svg" alt="" width="14" height="14">Ask Tessera AI</button>' +
      '</div>';
  }

  function drawerClick(ev) {
    var b = ev.target.closest('[data-d]'); if (!b) return;
    var kind = b.dataset.d;
    if (drawerKind === 'task') {
      var t = D.byId(drawerId); if (!t) return;
      if (kind === 'assign') assignMenu(b, t);
      else if (kind === 'nudge') { act.nudge(t); toast('Follow-up sent to <b>' + esc(t.vendor) + '</b>.'); }
      else if (kind === 'escalate') confirmPop(b, 'Escalate to the vendor?', 'This sends <b>' + esc(t.vendor) + '</b>’s senior contact a formal escalation, and Dana takes ownership.', 'Escalate', function () { act.escalate(t); toast('Escalated <b>' + esc(t.vendor) + '</b>.'); });
      else if (kind === 'resolve') { drawer.close(); act.resolve(t); toast('<b>' + esc(t.vendor) + '</b> resolved. It leaves the lists and the risk score drops by ' + t.impact.toFixed(1) + '.'); }
      else if (kind === 'ask' && global.TesseraAI) { global.TesseraAI.openTask && global.TesseraAI.openTask(t); }
    } else if (drawerKind === 'evidence') {
      var e = D.EVIDENCE.filter(function (x) { return x.id === drawerId; })[0]; if (!e) return;
      if (kind === 'reviewed') { act.evidenceReview(e); toast('Evidence for <b>' + esc(e.vendor) + '</b> marked reviewed.'); }
      else if (kind === 'ask' && global.TesseraAI) { global.TesseraAI.openEvidence && global.TesseraAI.openEvidence(e); }
    }
  }
  D.onChange(function () {
    if (!drawer || !drawer.open) return;
    if (drawerKind === 'task') { var t = D.byId(drawerId); if (t) renderTask(t); else drawer.close(); }
    else if (drawerKind === 'evidence') { var e = D.EVIDENCE.filter(function (x) { return x.id === drawerId; })[0]; if (e) renderEvidence(e); }
  });

  function openTask(id) {
    var t = D.byId(id); if (!t) return;
    if (!drawer) buildDrawer();
    drawerKind = 'task'; drawerId = id; renderTask(t);
    if (!drawer.open) drawer.showModal();
    drawer.querySelector('.drawer-close').focus();
  }
  function openEvidence(id) {
    var e = D.EVIDENCE.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    if (!drawer) buildDrawer();
    drawerKind = 'evidence'; drawerId = id; renderEvidence(e);
    if (!drawer.open) drawer.showModal();
    drawer.querySelector('.drawer-close').focus();
  }

  /* ---------- Persona switcher ---------- */
  var PERSONAS = {
    dana:   { key: 'DV', name: 'Dana Vasquez', role: 'Sr. Vendor Risk Manager', img: 'dana-vasquez' },
    priya:  { key: 'PN', name: 'Priya Nair',   role: 'Vendor Risk Analyst II',  img: 'priya-nair' },
    marcus: { key: 'MC', name: 'Marcus Chen',  role: 'Vendor Risk Analyst I',   img: 'marcus-chen' }
  };
  var personaListeners = [];
  D.persona = 'dana';
  D.onPersona = function (fn) { personaListeners.push(fn); };

  function setPersona(p, silent) {
    if (!PERSONAS[p]) p = 'dana';
    D.persona = p;
    ['dana', 'priya', 'marcus'].forEach(function (k) { var v = $('view-' + k); if (v) v.hidden = (k !== p); });
    var me = PERSONAS[p], user = document.querySelector('.nav-user');
    if (user) {
      user.querySelector('img').src = '../../personas/' + me.img + '.png'; user.querySelector('img').alt = me.name;
      user.querySelector('.nav-user__name').textContent = me.name; user.querySelector('.nav-user__role').textContent = me.role;
      user.setAttribute('aria-label', 'Viewing the dashboard as ' + me.name + '. Switch persona.');
    }
    var av = document.querySelector('.topbar-avatar'); if (av) { av.src = '../../personas/' + me.img + '.png'; av.alt = me.name; }
    document.title = 'Tessera — ' + (p === 'dana' ? 'App Shell' : me.name.split(' ')[0] + '’s Dashboard');
    if (!silent) { var u = new URL(location.href); if (p === 'dana') u.searchParams.delete('as'); else u.searchParams.set('as', p); history.replaceState(null, '', u); }
    personaListeners.forEach(function (fn) { fn(p); });
  }

  function initPersona() {
    var user = document.querySelector('.nav-user'); if (!user) return;
    user.setAttribute('role', 'button'); user.setAttribute('tabindex', '0'); user.setAttribute('aria-haspopup', 'menu');
    user.insertAdjacentHTML('beforeend', '<svg class="nav-user__chev" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 8.5L7 5l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    function menu() {
      var items = Object.keys(PERSONAS).map(function (k) {
        var m = PERSONAS[k];
        return '<button type="button" class="pop-item" role="menuitemradio" aria-checked="' + (D.persona === k) + '" data-persona="' + k + '"><img src="../../personas/' + m.img + '.png" alt=""><span><b>' + esc(m.name) + '</b><small>' + esc(m.role) + '</small></span>' + (D.persona === k ? '<em>Viewing</em>' : '') + '</button>';
      }).join('');
      var el = openPop(user, '<div class="pop-title">View the dashboard as</div>' + items, 'dash-pop--menu dash-pop--persona');
      // open upward from the sidebar footer
      var r = user.getBoundingClientRect(); el.style.left = Math.max(8, r.left) + 'px'; el.style.top = Math.max(8, r.top - el.offsetHeight - 8) + 'px';
      el.addEventListener('click', function (e) { var b = e.target.closest('[data-persona]'); if (!b) return; closePop(false); setPersona(b.dataset.persona); });
    }
    user.addEventListener('click', menu);
    user.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); menu(); } });
    var as = new URLSearchParams(location.search).get('as');
    setPersona(PERSONAS[as] ? as : 'dana', true);
  }

  global.TesseraUI = { esc: esc, taskRow: taskRow, taskHead: taskHead, tagFor: tagFor, ownerFor: ownerFor, toast: toast, openTask: openTask, openEvidence: openEvidence,
                       spark: spark, openPop: openPop, closePop: closePop, confirmPop: confirmPop, setPersona: setPersona, initPersona: initPersona, PERSONAS: PERSONAS, FIRST: FIRST };
})(window);
