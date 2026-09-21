/* Tessera AI: the advanced chat modal opened from the AI sparkle on a Dashboard card.
   Listens for the `tessera:ai-chat` event ({ detail: { context, card } }), opens a dialog
   scoped to that card, and starts by asking Dana what she wants to learn or act on for it.

   The page connects it to real state with two calls:
     TesseraAI.setData(fn)     live figures and task rows the answers are built from
     TesseraAI.setActions(obj) handlers that carry out an approved action on the page
                               (assign, nudge, escalate, rebalance, autoassign, scan)

   PROTOTYPE: there is no model behind this. Answers are scripted per card; free text is
   matched to the nearest suggested question. Approving a proposed action really updates
   the dashboard's sample data, but nothing leaves the page. */
(function (global) {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON = '../../brand/ai-sparkle.svg';
  var provider = function () { return {}; };
  var actions = {};
  var NAME = { PN: 'Priya', MC: 'Marcus', DV: 'Dana' };

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function pts(n) { return '+' + n.toFixed(1); }
  var STOP = ['the', 'and', 'for', 'are', 'was', 'what', 'how', 'why', 'can', 'you', 'our', 'about', 'with', 'this', 'that', 'from', 'get', 'does', 'did', 'have', 'has', 'its', 'tell', 'show', 'give', 'please'];
  function words(s) { return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; }); }

  /* Normalise the page's figures, with safe defaults if none were supplied */
  function data() {
    var d = provider() || {};
    d.tasks = d.tasks || [];
    d.topVendors = d.topVendors || [];
    d.ages = d.ages || [0, 0, 0, 0, 0];
    d.newDaily = d.newDaily || []; d.closedDaily = d.closedDaily || []; d.days = d.days || [];
    d.counts = d.counts || { all: 0, unassigned: 0, critical: 0, stale: 0, waiting: 0 };
    d.team = d.team || { PN: { open: 0, pastSla: 0 }, MC: { open: 0, pastSla: 0 }, DV: { open: 0, pastSla: 0 } };
    d.unassigned = d.tasks.filter(function (t) { return !t.owner; });
    d.pastSla = d.tasks.filter(function (t) { return t.state === 'stale'; }).sort(function (a, b) { return b.days - a.days; });
    d.byImpact = d.tasks.slice().sort(function (a, b) { return b.impact - a.impact; });
    return d;
  }
  function taskLine(t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + esc(t.age) + ' / ' + esc(t.sla) + ')'; }
  function ids(list) { return list.map(function (t) { return t.id; }); }

  /* ---------- Prompt library (each card picks the ones that fit) ---------- */
  var P = {};

  /* Learn: risk score */
  P.whyUp = { id: 'why-up', kind: 'learn', label: 'Why did the score go up?', answer: function (d) {
    return { html: '<p>Tasks are arriving faster than they close, and open tasks add more risk the longer they sit.</p>' +
      ul(['<b>' + d.inn + ' tasks arrived</b> in the last 7 days and ' + d.out + ' were closed (net +' + d.net + ').',
          '<b>' + d.pastSLA + ' tasks are past SLA</b>. A task counts for more the further past its SLA it goes, up to double.',
          'Five vendors account for <b>' + d.topShare + '%</b> of open-task impact (see the concentration list).']) };
  } };
  P.topVendors = { id: 'top-vendors', kind: 'learn', label: 'Which vendors add the most risk?', answer: function (d) {
    var t = d.byImpact[0];
    return { html: '<p>The five vendors adding the most points to the score:</p>' +
      ul(d.topVendors.map(function (v) { return '<b>' + esc(v[0]) + '</b> ' + pts(v[1]); })) +
      (t ? '<p class="ai-note">The single largest task is <b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + pts(t.impact) + ').</p>' : '') };
  } };
  P.target = { id: 'target', kind: 'learn', label: 'What would it take to get back to where we were?', answer: function (d) {
    var need = d.scoreDelta, run = 0, pick = [];
    if (need <= 0) return { html: '<p>The score is not above where it was 30 days ago, so there is nothing to recover.</p>' };
    d.byImpact.forEach(function (t) { if (run < need) { pick.push(t); run += t.impact; } });
    return { html: '<p>To get back to <b>' + (d.score - need) + '</b> you need to remove about <b>' + need + ' points</b>. Closing these ' + pick.length + ' tasks would remove <b>' + pts(run) + '</b>:</p>' +
      ul(pick.map(function (t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + pts(t.impact) + ')'; })) };
  } };
  P.howCalc = { id: 'how-calc', kind: 'learn', label: 'How is the score calculated?', answer: function () {
    return { html: '<p>Each open task adds points equal to its <b>severity</b> × the <b>vendor’s tier</b> × an <b>age multiplier</b>.</p>' +
      ul(['Severity: critical 4.0, high 2.5, medium 1.0, low 0.5.', 'Vendor tier: critical 1.0, high 0.7, medium 0.4, low 0.2.', 'Age: 1.0 while within SLA, rising to 2.0 as the task goes further past it.']) +
      '<p>Task points are added to a smaller baseline for vendor posture (tier mix, expiring certificates) and normalized to 0 to 100. Waiting on a vendor pauses the team’s SLA clock but not the risk clock.</p>' };
  } };

  /* Learn: tasks and age */
  P.pastSla = { id: 'past-sla', kind: 'learn', label: 'Which tasks are past SLA?', answer: function (d) {
    return { html: '<p><b>' + d.pastSLA + ' tasks are past SLA</b>. The oldest ones in your list:</p>' + ul(d.pastSla.map(taskLine)) +
      (d.pastSLA > d.pastSla.length ? '<p class="ai-note">The other ' + (d.pastSLA - d.pastSla.length) + ' are not in the list above. Use the “Stale, past SLA” filter to see the rest.</p>' : '') };
  } };
  P.age = { id: 'age', kind: 'learn', label: 'How old are the open tasks?', answer: function (d) {
    var L = ['0 to 3 days', '4 to 7 days', '8 to 14 days', '15 to 30 days', 'over 30 days'], old = d.ages[3] + d.ages[4];
    return { html: '<p>Open tasks by age:</p>' + ul(d.ages.map(function (n, i) { return '<b>' + n + '</b> ' + L[i]; })) +
      '<p><b>' + old + ' tasks</b> have been open more than 15 days. That tail is where the risk score grows fastest.</p>' };
  } };
  P.whoBlocks = { id: 'who-blocks', kind: 'learn', label: 'Are we waiting on vendors or on ourselves?', answer: function (d) {
    return { html: '<p>The split matters because it changes what you do:</p>' +
      ul(['<b>' + d.waitingVendor + ' tasks</b> are waiting on a vendor (average 11 days). Escalate to a senior contact at the vendor.',
          '<b>' + d.waitingTeam + ' tasks</b> are waiting on your team (average 4 days). Rebalance workload or coach.']) +
      '<p class="ai-note">Vendor delay pauses the team’s SLA clock, so the team is not scored down for it.</p>' };
  } };
  P.olderTail = { id: 'older', kind: 'learn', label: 'What is in the 15+ day tail?', answer: function (d) {
    var old = d.ages[3] + d.ages[4], t = d.pastSla[0];
    return { html: '<p><b>' + old + ' tasks</b> have been open more than 15 days, ' + d.ages[4] + ' of them over 30.</p>' +
      (t ? '<p>The oldest in your list is <b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + esc(t.age) + ' / ' + esc(t.sla) + ').</p>' : '') +
      '<p class="ai-note">A task past its SLA counts for up to double, so this tail moves the score more than its size suggests.</p>' };
  } };
  P.sortRule = { id: 'sort', kind: 'learn', label: 'How is this list sorted?', answer: function () {
    return { html: '<p>Unassigned tasks come first, because nobody is working on them. After that the list is sorted by <b>risk impact</b>, the points each task adds to the portfolio score right now, not by date.</p>' +
      '<p>Age is always shown against its SLA and turns red once the task is past it, so “stale” is decided by the system rather than by anyone’s memory.</p>' };
  } };
  P.lookFirst = { id: 'look-first', kind: 'learn', label: 'What should I look at first?', answer: function (d) {
    var items = d.unassigned.slice(0, 2).map(function (t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + '. Unassigned, ' + pts(t.impact) + ', SLA ' + esc(t.sla) + '.'; });
    if (d.pastSla[0]) items.push('<b>' + esc(d.pastSla[0].vendor) + '</b>: ' + esc(d.pastSla[0].issue) + '. The oldest past SLA (' + esc(d.pastSla[0].age) + ' / ' + esc(d.pastSla[0].sla) + ').');
    return { html: items.length ? '<p>I would start with these:</p>' + ul(items) : '<p>Everything in the list is assigned and within SLA.</p>' };
  } };

  /* Learn: flow of work */
  P.whyGrowing = { id: 'why-growing', kind: 'learn', label: 'Why is the backlog growing?', answer: function (d) {
    var first = d.newDaily[0], last = d.newDaily[d.newDaily.length - 1];
    return { html: '<p>Arrivals are climbing while closures are flat.</p>' +
      ul(['New tasks rose from <b>' + first + ' a day</b> two weeks ago to <b>' + last + ' a day</b> today.',
          'Closures held at about <b>' + (d.out / 7).toFixed(1) + ' a day</b> over the last 7 days.',
          'Each day the gap adds to the backlog, and older tasks add more risk.']) };
  } };
  P.peakDays = { id: 'peak', kind: 'learn', label: 'Which days were worst?', answer: function (d) {
    var rows = d.newDaily.map(function (n, i) { return { i: i, net: n - d.closedDaily[i] }; }).sort(function (a, b) { return b.net - a.net; }).slice(0, 3);
    return { html: '<p>The three days with the biggest gap between new and closed:</p>' +
      ul(rows.map(function (r) { return '<b>' + esc(d.days[r.i] || 'Day ' + (r.i + 1)) + '</b>: ' + d.newDaily[r.i] + ' new, ' + d.closedDaily[r.i] + ' closed (net +' + r.net + ')'; })) +
      '<p class="ai-note">They are all recent, which is why the shaded gap widens toward the right of the chart.</p>' };
  } };
  P.whatArriving = { id: 'what-arriving', kind: 'learn', label: 'What kinds of issues are arriving?', answer: function (d) {
    var c = {}; d.tasks.forEach(function (t) { c[t.cat] = (c[t.cat] || 0) + 1; });
    var rows = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).map(function (k) { return '<b>' + esc(k) + '</b>: ' + c[k]; });
    return { html: '<p>By category, across the tasks in your attention list:</p>' + ul(rows) + '<p class="ai-note">Counted from the ' + d.tasks.length + ' tasks in your attention list, not every open task.</p>' };
  } };
  P.rate = { id: 'rate', kind: 'learn', label: 'How fast do we need to close tasks?', answer: function (d) {
    var need = d.inn / 7, now = d.out / 7;
    return { html: '<p>To hold the backlog steady, closures have to match arrivals.</p>' +
      ul(['Arrivals: about <b>' + need.toFixed(1) + ' a day</b>.', 'Closures now: about <b>' + now.toFixed(1) + ' a day</b>.', 'Gap: about <b>' + (need - now).toFixed(1) + ' more closures a day</b>, or fewer arrivals, to stop the growth.']) };
  } };

  /* Learn: team */
  P.parts = { id: 'parts', kind: 'learn', label: 'What makes up the team score?', answer: function () {
    return { html: '<p>Four parts, measured over the last 30 days and weighted by severity:</p>' +
      ul(['<b>Closed on time</b> (40%): 78% of tasks closed within SLA.', '<b>Time to verify</b> (20%): 1.6 days median from assignment to a confirmed vendor match.', '<b>Vendor follow-ups sent</b> (20%): 93% of vendor-waiting tasks followed up on schedule.', '<b>Reopened / rework</b> (20%): 4% of tasks reopened.']) +
      '<p class="ai-note">The score is never shown without these parts.</p>' };
  } };
  P.marcus = { id: 'marcus', kind: 'learn', label: 'Why did Marcus’s score drop?', answer: function (d) {
    var m = d.team.MC, p = d.team.PN;
    return { html: '<p>Marcus’s score fell 2 points to <b>74</b>. The cause is capacity, not effort:</p>' +
      ul(['<b>' + m.open + ' open tasks</b>, against ' + p.open + ' for Priya.', '<b>' + m.pastSla + ' are past SLA</b>, mostly waiting on the vendor or the team’s review.', 'Tasks waiting on a vendor pause the team’s SLA clock, so the drop comes from tasks that were not waiting on anyone.']) +
      '<p>Rebalancing the queue is likely to help more than coaching.</p>' };
  } };
  P.trend = { id: 'trend', kind: 'learn', label: 'How has the team changed since last month?', answer: function () {
    return { html: '<p>The team score is up <b>2 points</b> to 82.</p>' + ul(['<b>Priya Nair</b>: 91, up 3.', '<b>Marcus Chen</b>: 74, down 2, at capacity.', '<b>Dana Vasquez</b>: not scored (escalations and Canadian vendors).']) };
  } };
  P.room = { id: 'room', kind: 'learn', label: 'Who has room for more work?', answer: function (d) {
    var t = d.team;
    return { html: '<p>Open tasks right now:</p>' + ul(['<b>Priya</b>: ' + t.PN.open + ' open, ' + t.PN.pastSla + ' past SLA', '<b>Marcus</b>: ' + t.MC.open + ' open, ' + t.MC.pastSla + ' past SLA', '<b>Dana</b>: ' + t.DV.open + ' open (escalations and Canada)']) +
      '<p>' + (t.PN.open < t.MC.open ? 'Priya has the most room.' : 'Marcus has the most room.') + '</p>' };
  } };

  /* Learn: risk concentration and the scan */
  P.whyTop = { id: 'why-top', kind: 'learn', label: 'Why is the top vendor at the top?', answer: function (d) {
    var top = d.topVendors[0]; if (!top) return { html: '<p>There is no vendor data yet.</p>' };
    var mine = d.tasks.filter(function (t) { return t.vendor === top[0]; });
    return { html: '<p><b>' + esc(top[0]) + '</b> adds <b>' + pts(top[1]) + ' points</b>, the most of any vendor.</p>' +
      (mine.length ? ul(mine.map(function (t) { return esc(t.issue) + ' (' + pts(t.impact) + ', ' + esc(t.age) + ' / ' + esc(t.sla) + ')'; })) : '') +
      '<p class="ai-note">Its tier is ' + (mine[0] ? esc(mine[0].tier) : 'high') + ', which carries the most weight in the calculation.</p>' };
  } };
  P.topShare = { id: 'share', kind: 'learn', label: 'How concentrated is the risk?', answer: function (d) {
    return { html: '<p>The top five vendors hold <b>' + d.topShare + '%</b> of open-task impact. The other ' + (100 - d.topShare) + '% is spread across many vendors, each with a smaller share.</p>' +
      '<p>That is good news for prioritizing: fixing a handful of vendors moves the score more than working the long tail.</p>' };
  } };
  P.whatScanned = { id: 'scanned', kind: 'learn', label: 'What is being scanned?', answer: function () {
    return { html: '<p>All <b>612 vendors</b>, continuously, across six kinds of public source:</p>' +
      ul(['Breach dumps and paste sites', 'Public code repositories', 'CVE and vendor advisories', 'Certificate transparency logs', 'Internet-wide scans of exposed services', 'News, filings and regulator notices']) +
      '<p>Signals are matched to a vendor, scored, categorized, and only high-risk ones become tasks.</p>' };
  } };
  P.tiles = { id: 'tiles', kind: 'learn', label: 'What do the coloured tiles mean?', answer: function (d) {
    return { html: ul(['<b>Light blue-grey</b>: monitored, nothing open.', '<b>Yellow</b>: an open finding that is being worked or monitored (15).', '<b>Red</b>: a critical signal is open (' + (d.scanCount || 7) + ').']) +
      '<p>Hover any tile to see the vendor and its tier.</p>' };
  } };
  P.recent = { id: 'recent', kind: 'learn', label: 'What did the scan find most recently?', answer: function (d) {
    var fresh = d.tasks.filter(function (t) { return t.fresh; });
    if (!fresh.length) return { html: '<p>Nothing new since you opened this page. The scan runs continuously, and a high-risk finding appears as a new task at the top of your list.</p>' };
    return { html: '<p>' + plural(fresh.length, 'new task') + ' from the scan since you opened this page:</p>' + ul(fresh.map(function (t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + pts(t.impact) + ')'; })) };
  } };

  /* Take action (these propose a change and wait for approval) */
  function ownerTxt(t) { return NAME[t.suggestOwner] + ' (' + esc(t.suggestWhy) + ')'; }
  P.assign = { id: 'assign', kind: 'act', label: 'Assign the unassigned tasks', answer: function (d) {
    var list = d.unassigned;
    if (!list.length) return { html: '<p>Nothing is unassigned right now, so there is nothing to hand out.</p>' };
    var n = list.length, atCap = d.team.MC.open >= 22;
    return {
      html: '<p>' + plural(n, 'task is', 'tasks are') + ' unassigned, adding <b>' + pts(sum(list.map(function (t) { return t.impact; }))) + ' points</b> to the score. Nobody is working on ' + (n === 1 ? 'it' : 'them') + ' yet.</p>' +
            (atCap ? '<p class="ai-note">Marcus is at capacity (' + d.team.MC.open + ' open, ' + d.team.MC.pastSla + ' past SLA), so I have kept new work off his queue.</p>' : ''),
      proposal: { type: 'assign', ids: ids(list), title: 'Proposed action · assign ' + plural(n, 'task'),
        items: list.map(function (t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' → ' + ownerTxt(t); }),
        approve: 'Approve assignments', done: 'the tasks would be assigned and each owner notified.' }
    };
  } };
  P.nudge = { id: 'nudge', kind: 'act', label: 'Nudge vendors on past-SLA tasks', answer: function (d) {
    var list = d.tasks.filter(function (t) { return t.action === 'Nudge' && !t.nudged; });
    if (!list.length) return { html: '<p>No follow-ups are due. Every past-SLA task has either been nudged or needs an escalation instead.</p>' };
    return {
      html: '<p><b>' + plural(list.length, 'task') + '</b> ' + (list.length === 1 ? 'is' : 'are') + ' past SLA and due a follow-up. I can send each vendor’s security contact a message that references the original finding and asks for a remediation date.</p>',
      proposal: { type: 'nudge', ids: ids(list), title: 'Proposed action · follow up with vendors', items: list.map(taskLine), approve: 'Approve follow-ups', done: 'follow-ups would be sent to each vendor and logged as vendor contacts.' }
    };
  } };
  P.escalate = { id: 'escalate', kind: 'act', label: 'Escalate the oldest tasks', answer: function (d) {
    var list = d.tasks.filter(function (t) { return t.action === 'Escalate' && !t.escalated; });
    if (!list.length) return { html: '<p>Nothing needs escalating right now.</p>' };
    return {
      html: '<p>' + (list.length === 1 ? 'This task is' : 'These tasks are') + ' well beyond SLA and a nudge has not moved ' + (list.length === 1 ? 'it' : 'them') + '. I suggest escalating to a senior contact at the vendor, with you as the owner.</p>',
      proposal: { type: 'escalate', ids: ids(list), title: 'Proposed action · escalate', items: list.map(taskLine), approve: 'Approve escalation', done: 'an escalation would go to the vendor’s senior contact.' }
    };
  } };
  P.rebalance = { id: 'rebalance', kind: 'act', label: 'Rebalance the analysts’ queues', answer: function (d) {
    var m = d.team.MC, p = d.team.PN, n = Math.min(4, Math.floor((m.open - p.open) / 2));
    if (n < 1) return { html: '<p>The queues are already balanced: Priya has <b>' + p.open + '</b> open and Marcus has <b>' + m.open + '</b>.</p>' };
    return {
      html: '<p>Marcus has <b>' + m.open + ' open tasks, ' + m.pastSla + ' past SLA</b>. Priya has <b>' + p.open + ' open, ' + p.pastSla + ' past SLA</b>.</p>',
      proposal: { type: 'rebalance', title: 'Proposed action · rebalance',
        items: ['Move ' + plural(n, 'task') + ' that ' + (n === 1 ? 'is' : 'are') + ' in review or being verified from Marcus to Priya', 'Keep the past-SLA tasks with Marcus, who already has the vendor context', 'Review again in 3 days'],
        approve: 'Approve rebalance', done: 'the tasks would move to Priya and both analysts would be notified.' }
    };
  } };
  P.autoAssign = { id: 'auto-assign', kind: 'act', label: 'Auto-assign new tasks by region', answer: function (d) {
    if (d.autoAssign) return { html: '<p>Auto-assign is already on. New tasks from the scan are being assigned as they arrive. You can turn it off from the task list.</p>' };
    return {
      html: '<p>New tasks could be assigned automatically as they arrive, so none sit unassigned.</p>' +
            (d.team.MC.open >= 22 ? '<p class="ai-note">Marcus is at capacity (' + d.team.MC.open + ' open, ' + d.team.MC.pastSla + ' past SLA), so the rule keeps new US work off his queue until he is below 22.</p>' : ''),
      proposal: { type: 'autoassign', title: 'Proposed rule · auto-assign', items: ['Critical-tier and EU vendors → Priya', 'Canadian vendors → Dana', 'US vendors → Marcus, or Priya while Marcus is at capacity'], approve: 'Turn on auto-assign', done: 'the rule would be saved and applied to every new task.' }
    };
  } };
  P.scanNow = { id: 'scan-now', kind: 'act', label: 'Run a priority scan now', answer: function () {
    return { html: '<p>The scan already runs continuously. I can start an extra pass now instead of waiting for the next one.</p>',
      proposal: { type: 'scan', title: 'Proposed action · scan now', items: ['Scan all 612 vendors immediately', 'Any high-risk finding becomes an unassigned task at the top of your list'], approve: 'Start scan', done: 'an extra scan pass would start right away.' } };
  } };
  P.summary = { id: 'summary', kind: 'act', label: 'Draft a summary for the audit committee', answer: function (d) {
    var names = d.topVendors.slice(0, 3).map(function (v) { return v[0]; }).join(', ');
    return { html: '<p>Here is a draft you can edit. It states the score, the cause, and what is being done.</p>',
      draft: { title: 'Audit committee summary', text:
        'Portfolio risk score: ' + d.score + '/100, up ' + d.scoreDelta + ' points over 30 days.\n\n' +
        'Cause: ' + d.inn + ' new investigation tasks in the last 7 days against ' + d.out + ' closed. ' + d.pastSLA + ' open tasks are past SLA, and open tasks add more risk the longer they stay open.\n\n' +
        'Concentration: five vendors account for ' + d.topShare + '% of open-task impact, led by ' + names + '.\n\n' +
        'Actions under way: assigning new tasks to analysts, following up with vendors on past-SLA items, and rebalancing analyst workload.' } };
  } };
  P.capacity = { id: 'capacity', kind: 'act', label: 'Draft a request for temporary capacity', answer: function (d) {
    return { html: '<p>Here is a draft you can edit and send.</p>', draft: { title: 'Request for temporary capacity', text:
      'Subject: Temporary capacity for vendor risk investigations\n\n' +
      'In the last 7 days ' + d.inn + ' investigation tasks arrived and ' + d.out + ' were closed, so the backlog grew by ' + d.net + '. ' + d.pastSLA + ' open tasks are past SLA.\n\n' +
      'The team is working at capacity, and the gap is capacity, not effort. I am asking for temporary help for the next 30 days to bring closures in line with arrivals, so that risk to Northbridge stops growing.' } };
  } };
  P.note = { id: 'note', kind: 'act', label: 'Draft a supportive note for Marcus', answer: function (d) {
    return { html: '<p>Here is a draft that frames this as capacity, which is what the numbers show.</p>', draft: { title: 'Note to Marcus', text:
      'Hi Marcus,\n\nI wanted to check in. Your queue is the biggest on the team right now (' + d.team.MC.open + ' open, ' + d.team.MC.pastSla + ' past SLA), and I do not think that is about effort. Most of those tasks are waiting on vendors or review.\n\nI am looking at moving a few tasks to Priya and adding temporary help. Can we talk for 15 minutes this week about what would take the most weight off?\n\nDana' } };
  } };
  P.teamUpdate = { id: 'team-update', kind: 'act', label: 'Draft a team update for leadership', answer: function (d) {
    return { html: '<p>Here is a draft you can edit.</p>', draft: { title: 'Team update', text:
      'Team score: 82/100, up 2 points on last month.\n\n' +
      'Closed on time: 78%. Time to verify: 1.6 days. Vendor follow-ups sent on schedule: 93%. Reopened: 4%.\n\n' +
      'Risk to note: capacity, not effort, is the gap. One analyst is carrying ' + d.team.MC.open + ' open tasks with ' + d.team.MC.pastSla + ' past SLA. I am rebalancing the queues and asking for temporary capacity.' } };
  } };
  P.vendorNote = { id: 'vendor-note', kind: 'act', label: 'Draft a note to the top vendor', answer: function (d) {
    var top = d.topVendors[0]; if (!top) return { html: '<p>There is no vendor data yet.</p>' };
    var t = d.tasks.filter(function (x) { return x.vendor === top[0]; })[0];
    return { html: '<p>Here is a draft to the security contact at <b>' + esc(top[0]) + '</b>.</p>', draft: { title: 'Note to ' + top[0], text:
      'Subject: Open security finding at ' + top[0] + '\n\n' +
      'Our continuous monitoring flagged ' + (t ? '"' + t.issue + '"' : 'an open finding') + '. It is currently the largest single contributor to Northbridge’s third-party risk from your organization.\n\n' +
      'Please confirm the finding, name an owner on your side, and share a remediation date within 2 business days.\n\nNorthbridge Vendor Risk' } };
  } };

  /* ---------- Cards ---------- */
  var CONTEXTS = {
    'risk-score': { title: 'Portfolio risk score',
      intro: function (d) { return '<p>What would you like to learn about, or take action on, for the <b>portfolio risk score</b>?</p><p class="ai-note">It is ' + d.score + ' out of 100, up ' + d.scoreDelta + ' points over 30 days.</p>'; },
      prompts: [P.whyUp, P.topVendors, P.target, P.howCalc, P.assign, P.nudge, P.summary] },

    'open-tasks': { title: 'Open investigation tasks',
      intro: function (d) { return '<p>What would you like to learn about, or take action on, for the <b>open investigation tasks</b>?</p><p class="ai-note">There are ' + d.open + ' open, and ' + d.pastSLA + ' of them are past SLA.</p>'; },
      prompts: [P.pastSla, P.age, P.whoBlocks, P.assign, P.escalate, P.rebalance] },

    'arriving-vs-closed': { title: 'Arriving vs. closed',
      intro: function (d) { return '<p>What would you like to learn about, or take action on, for <b>arriving versus closed tasks</b>?</p><p class="ai-note">Over the last 7 days, ' + d.inn + ' arrived and ' + d.out + ' were closed. The backlog grew by ' + d.net + '.</p>'; },
      prompts: [P.whyGrowing, P.whatArriving, P.rate, P.assign, P.autoAssign, P.capacity] },

    'team-score': { title: 'Team score',
      intro: function () { return '<p>What would you like to learn about, or take action on, for the <b>team score</b>?</p><p class="ai-note">It is 82 out of 100, up 2 points on last month. The score is a workload and coaching signal, not a ranking.</p>'; },
      prompts: [P.parts, P.marcus, P.trend, P.rebalance, P.note, P.teamUpdate] },

    'attention-list': { title: 'Needs your attention now',
      snap: function (d) { return { label: 'Needs your attention now', value: d.tasks.length + ' shown <small>of ' + d.counts.all + '</small>', trend: d.counts.unassigned + ' unassigned · ' + d.counts.critical + ' critical · ' + d.counts.stale + ' past SLA', cls: d.counts.unassigned ? 'bad' : 'good' }; },
      intro: function (d) { return '<p>What would you like to learn about, or take action on, in the <b>list of tasks that need your attention</b>?</p><p class="ai-note">' + d.counts.unassigned + ' are unassigned and ' + d.counts.stale + ' are past SLA.</p>'; },
      prompts: [P.sortRule, P.lookFirst, P.pastSla, P.assign, P.nudge, P.escalate, P.autoAssign] },

    'keeping-up': { title: 'Are we keeping up?',
      snap: function (d) { return { label: 'Are we keeping up?', value: d.inn + ' in · ' + d.out + ' out <small>last 7 days</small>', trend: 'Backlog growing: +' + d.net, cls: d.net > 0 ? 'bad' : 'good' }; },
      intro: function (d) { return '<p>What would you like to learn about, or take action on, for the <b>arrivals-versus-closures chart</b>?</p><p class="ai-note">The gap between the lines is backlog growth: ' + d.inn + ' arrived and ' + d.out + ' closed in the last 7 days.</p>'; },
      prompts: [P.whyGrowing, P.peakDays, P.rate, P.autoAssign, P.capacity] },

    'task-age': { title: 'How long are tasks open?',
      snap: function (d) { return { label: 'How long are tasks open?', value: (d.ages[3] + d.ages[4]) + ' tasks <small>open 15+ days</small>', sub: d.waitingVendor + ' waiting on vendors · ' + d.waitingTeam + ' waiting on the team' }; },
      intro: function (d) { return '<p>What would you like to learn about, or take action on, for <b>how long tasks stay open</b>?</p><p class="ai-note">' + (d.ages[3] + d.ages[4]) + ' tasks have been open more than 15 days.</p>'; },
      prompts: [P.age, P.whoBlocks, P.olderTail, P.escalate, P.nudge] },

    'team': { title: 'Your team',
      snap: function (d) { var t = d.team; return { label: 'Your team', value: 'Score 82 <small>last 30 days</small>', sub: 'Priya ' + t.PN.open + ' open · Marcus ' + t.MC.open + ' open · Dana ' + t.DV.open + ' open' }; },
      intro: function () { return '<p>What would you like to learn about, or take action on, for <b>your team</b>?</p><p class="ai-note">Scores are a workload and coaching signal, not a ranking.</p>'; },
      prompts: [P.room, P.parts, P.marcus, P.rebalance, P.note, P.teamUpdate] },

    'risk-concentration': { title: 'Where risk is concentrated',
      snap: function (d) { return { label: 'Where risk is concentrated', value: 'Top 5 = ' + d.topShare + '% <small>of open-task impact</small>', sub: d.topVendors.slice(0, 3).map(function (v) { return v[0] + ' ' + pts(v[1]); }).join(' · ') }; },
      intro: function (d) { return '<p>What would you like to learn about, or take action on, for <b>where risk is concentrated</b>?</p><p class="ai-note">Five vendors hold ' + d.topShare + '% of open-task impact.</p>'; },
      prompts: [P.whyTop, P.topShare, P.topVendors, P.vendorNote, P.escalate, P.summary] },

    'continuous-scan': { title: 'Continuous scan',
      snap: function (d) { return { label: 'Continuous scan', value: (d.scanCount || 7) + ' critical <small>signals open</small>', sub: '612 vendors monitored · 15 open findings' }; },
      intro: function () { return '<p>What would you like to learn about, or take action on, for the <b>continuous scan</b>?</p><p class="ai-note">It watches all 612 vendors across the public internet.</p>'; },
      prompts: [P.whatScanned, P.tiles, P.recent, P.scanNow, P.assign] }
  };

  /* ---------- Dialog ---------- */
  var dialog, threadHost, ctxEl, subEl, form, input, sendBtn;
  var threads = {};              // one conversation per card, kept while the page is open
  var current = null, opener = null;

  function build() {
    dialog = mk('dialog', 'ai-dialog');
    dialog.setAttribute('aria-labelledby', 'aiTitle');
    dialog.innerHTML =
      '<div class="ai-shell">' +
        '<header class="ai-head">' +
          '<span class="ai-head__icon"><img src="' + ICON + '" alt=""></span>' +
          '<div><h2 id="aiTitle">Tessera AI</h2><p class="ai-head__sub">Asking about <b data-ai-name></b></p></div>' +
          '<button type="button" class="ai-close" aria-label="Close chat"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
        '</header>' +
        '<div class="ai-context" data-ai-context></div>' +
        '<div class="ai-threadhost" role="log" aria-live="polite" aria-label="Conversation"></div>' +
        '<form class="ai-composer">' +
          '<textarea rows="1" aria-label="Message Tessera AI"></textarea>' +
          '<button type="submit" class="ai-send" aria-label="Send message" disabled><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l12-5.5L9.5 14l-1.8-4.7L2 8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' +
        '</form>' +
        '<p class="ai-foot">Tessera AI can make mistakes. Answers here are sample content for this prototype.</p>' +
      '</div>';
    document.body.appendChild(dialog);
    threadHost = dialog.querySelector('.ai-threadhost');
    ctxEl = dialog.querySelector('[data-ai-context]');
    subEl = dialog.querySelector('[data-ai-name]');
    form = dialog.querySelector('form');
    input = form.querySelector('textarea');
    sendBtn = form.querySelector('.ai-send');

    dialog.querySelector('.ai-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });   // click on the backdrop
    dialog.addEventListener('close', function () { if (opener && document.contains(opener)) opener.focus(); });

    input.addEventListener('input', function () {
      input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      sendBtn.disabled = !input.value.trim();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim(); if (!text || !current) return;
      input.value = ''; input.style.height = 'auto'; sendBtn.disabled = true;
      ask(text, matchPrompt(text));
    });
  }

  /* Snapshot strip: from the tile's own figures for KPI tiles, from the page's data for other cards */
  function snapshot(ctx, cardEl) {
    var def = CONTEXTS[ctx];
    if (def.snap) {
      var s = def.snap(data());
      ctxEl.hidden = false;
      ctxEl.innerHTML = '<span class="ai-context__label">' + esc(s.label) + '</span><span class="ai-context__value">' + s.value + '</span>' +
        (s.trend ? '<span class="ai-context__trend ' + (s.cls || '') + '">' + esc(s.trend) + '</span>' : '') + (s.sub ? '<span class="ai-context__sub">' + esc(s.sub) + '</span>' : '');
      return;
    }
    var btn = document.querySelector('.ai-spark[data-ai="' + ctx + '"]');
    var card = cardEl || (btn && btn.closest('.stat-card'));
    if (!card) { ctxEl.hidden = true; return; }
    ctxEl.hidden = false;
    var q = function (sel) { return card.querySelector(sel); };
    var trend = q('.trend');
    ctxEl.innerHTML =
      '<span class="ai-context__label">' + esc(q('.stat-card__label').textContent) + '</span>' +
      '<span class="ai-context__value">' + esc(q('.stat-card__value').textContent.replace(/\s+/g, ' ').trim()) + '</span>' +
      (trend ? '<span class="ai-context__trend ' + (['bad', 'good', 'warn'].filter(function (c) { return trend.classList.contains(c); })[0] || '') + '">' + esc(trend.textContent) + '</span>' : '') +
      (q('.kpi-sub') ? '<span class="ai-context__sub">' + esc(q('.kpi-sub').textContent) + '</span>' : '');
  }

  /* ---------- Conversation ---------- */
  function scrollDown(t) { t.scrollTop = t.scrollHeight; }

  function addMsg(t, who, html, isText) {
    var row = mk('div', 'ai-msg ai-msg--' + who + (REDUCE ? '' : ' ai-new'));
    if (who === 'ai') row.appendChild(mk('span', 'ai-avatar', '<img src="' + ICON + '" alt="">'));
    var bubble = mk('div', 'ai-bubble');
    if (isText) bubble.textContent = html; else bubble.innerHTML = html;
    row.appendChild(bubble);
    t.el.appendChild(row);
    scrollDown(t.el);
    return bubble;
  }

  function chipGroups(t, list) {
    var wrap = mk('div', 'ai-chips');
    [['learn', 'Learn'], ['act', 'Take action']].forEach(function (g) {
      var items = list.filter(function (p) { return p.kind === g[0]; });
      if (!items.length) return;
      var grp = mk('div', 'ai-chipgroup', '<div class="ai-chipgroup__label">' + g[1] + '</div>');
      var row = mk('div', 'ai-chipgroup__row');
      items.forEach(function (p) {
        var b = mk('button', 'ai-chip' + (p.kind === 'act' ? ' ai-chip--act' : ''));
        b.type = 'button'; b.textContent = p.label;
        b.addEventListener('click', function () { ask(p.label, p); });
        row.appendChild(b);
      });
      grp.appendChild(row); wrap.appendChild(grp);
    });
    return wrap;
  }

  function startThread(ctx) {
    var def = CONTEXTS[ctx];
    var t = { ctx: ctx, def: def, el: mk('div', 'ai-thread'), asked: {} };
    threads[ctx] = t;
    var bubble = addMsg(t, 'ai', def.intro(data()));
    bubble.appendChild(chipGroups(t, def.prompts));
    return t;
  }

  function matchPrompt(text) {
    var w = words(text), best = null, bestScore = 0;
    current.def.prompts.forEach(function (p) {
      var pw = words(p.label), score = pw.filter(function (x) { return w.indexOf(x) >= 0; }).length;
      if (score > bestScore) { best = p; bestScore = score; }
    });
    return bestScore >= 1 ? best : null;
  }

  function ask(text, prompt) {
    var t = current; if (!t) return;
    addMsg(t, 'user', text, true);
    var typing = addMsg(t, 'ai', '<span class="ai-typing" aria-label="Tessera AI is typing"><i></i><i></i><i></i></span>');
    var typingRow = typing.parentNode;
    setTimeout(function () {
      typingRow.remove();
      if (!prompt) { reply(t, { html: '<p>I can’t answer that in this prototype yet. I can help with these for <b>' + esc(t.def.title.toLowerCase()) + '</b>:</p>' }, true); return; }
      t.asked[prompt.id] = true;
      reply(t, prompt.answer(data()), false);
    }, REDUCE ? 0 : 750);
  }

  function reply(t, r, showAll) {
    var bubble = addMsg(t, 'ai', r.html);
    if (r.proposal) bubble.appendChild(proposal(t, r.proposal));
    if (r.draft) bubble.appendChild(draft(r.draft));
    // Only the newest suggestions stay clickable, so old chips don't pile up
    t.el.querySelectorAll('.ai-chips').forEach(function (c) { if (!bubble.contains(c)) c.remove(); });
    var rest = t.def.prompts.filter(function (p) { return showAll || !t.asked[p.id]; });
    if (rest.length) {
      var chips = chipGroups(t, showAll ? rest : rest.slice(0, 4));
      if (!showAll) chips.insertBefore(mk('div', 'ai-note', 'Ask something else:'), chips.firstChild);
      bubble.appendChild(chips);
    }
    scrollDown(t.el);
  }

  /* A proposed action: waits for approval, then runs the page's handler for it */
  function proposal(t, p) {
    var box = mk('div', 'ai-proposal', '<div class="ai-proposal__title">' + esc(p.title) + '</div>' + ul(p.items));
    var row = mk('div', 'ai-proposal__actions');
    var ok = mk('button', 'ai-btn ai-btn--primary'); ok.type = 'button'; ok.textContent = p.approve;
    var no = mk('button', 'ai-btn ai-btn--ghost'); no.type = 'button'; no.textContent = 'Not now';
    row.appendChild(ok); row.appendChild(no); box.appendChild(row);

    function settle(html, reveal) {
      ok.disabled = no.disabled = true;
      var bubble = addMsg(t, 'ai', html);
      if (reveal) {
        var show = mk('button', 'ai-btn ai-btn--ghost'); show.type = 'button'; show.textContent = 'Close and show me';
        show.style.marginTop = '8px';
        show.addEventListener('click', function () {
          dialog.close();
          var el = document.querySelector(reveal);
          if (el) el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
        });
        bubble.appendChild(show);
      }
    }
    ok.addEventListener('click', function () {
      var run = actions[p.type], res = run ? run(p) : null;
      if (res) settle(res.message, res.reveal);
      else settle('<p>Approved. In the full product, ' + esc(p.done) + '</p><p class="ai-note">This prototype does not change any data.</p>');
    });
    no.addEventListener('click', function () { settle('<p>No problem. Nothing has been changed.</p>'); });
    return box;
  }

  function draft(d) {
    var box = mk('div', 'ai-draft');
    var head = mk('div', 'ai-draft__head', '<span>' + esc(d.title) + '</span>');
    var copy = mk('button', 'ai-btn ai-btn--ghost'); copy.type = 'button'; copy.textContent = 'Copy';
    head.appendChild(copy);
    var pre = mk('pre', 'ai-draft__text'); pre.textContent = d.text;
    box.appendChild(head); box.appendChild(pre);
    copy.addEventListener('click', function () {
      var done = function () { copy.textContent = 'Copied'; setTimeout(function () { copy.textContent = 'Copy'; }, 1600); };
      try { navigator.clipboard.writeText(d.text).then(done, done); } catch (e) { done(); }
    });
    return box;
  }

  /* ---------- Open ---------- */
  function open(detail) {
    var ctx = detail && detail.context;
    if (!CONTEXTS[ctx]) return;
    if (!dialog) build();
    opener = document.activeElement;
    current = threads[ctx] || startThread(ctx);
    subEl.textContent = CONTEXTS[ctx].title.toLowerCase();
    snapshot(ctx, detail.card);
    input.placeholder = 'Ask about ' + CONTEXTS[ctx].title.toLowerCase() + '…';
    threadHost.replaceChildren(current.el);
    if (!dialog.open) dialog.showModal();
    scrollDown(current.el);
    input.focus();
  }

  document.addEventListener('tessera:ai-chat', function (e) { open(e.detail); });

  global.TesseraAI = {
    setData: function (fn) { provider = fn; },
    setActions: function (obj) { actions = obj || {}; },
    open: open
  };
})(window);
