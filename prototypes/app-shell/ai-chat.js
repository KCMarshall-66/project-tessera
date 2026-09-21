/* Tessera AI: the advanced chat modal opened from the AI sparkle on a Dashboard tile.
   Listens for the `tessera:ai-chat` event ({ detail: { context } }), opens a dialog
   scoped to that tile, and starts by asking Dana what she wants to learn or act on
   for it. Exposes window.TesseraAI.setData(fn) so the page can supply live figures.

   PROTOTYPE: there is no model behind this. Answers are scripted per tile from the
   page's sample data; free text is matched to the nearest suggested question.
   Proposed actions need approval and change nothing. */
(function (global) {
  'use strict';

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ICON = '../../brand/ai-sparkle.svg';
  var provider = function () { return {}; };

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mk(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ul(items) { return '<ul>' + items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function words(s) { return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2 && STOP.indexOf(w) < 0; }); }
  var STOP = ['the', 'and', 'for', 'are', 'was', 'what', 'how', 'why', 'can', 'you', 'our', 'about', 'with', 'this', 'that', 'from', 'get', 'does', 'did', 'have', 'has', 'its', 'tell', 'show', 'give', 'please'];

  /* Normalise the page's figures, with safe defaults if none were supplied */
  function data() {
    var d = provider() || {};
    d.tasks = d.tasks || [];
    d.topVendors = d.topVendors || [];
    d.ages = d.ages || [0, 0, 0, 0, 0];
    d.newDaily = d.newDaily || []; d.closedDaily = d.closedDaily || [];
    d.unassigned = d.tasks.filter(function (t) { return !t.owner; });
    d.pastSla = d.tasks.filter(function (t) { return t.state === 'stale'; }).sort(function (a, b) { return b.days - a.days; });
    d.byImpact = d.tasks.slice().sort(function (a, b) { return b.impact - a.impact; });
    return d;
  }
  function pts(n) { return '+' + n.toFixed(1); }
  function suggestOwner(t) { return t.tier === 'critical' ? 'Priya (EU / critical vendors)' : 'Marcus (US / standard vendors)'; }
  function taskLine(t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + esc(t.age) + ' / ' + esc(t.sla) + ')'; }

  /* ---------- Shared answers ---------- */
  var SHARED = {
    assign: function (d) {
      if (!d.unassigned.length) return { html: '<p>Nothing is unassigned right now, so there is nothing to hand out.</p>' };
      var n = d.unassigned.length;
      return {
        html: '<p>' + plural(n, 'task is', 'tasks are') + ' unassigned in the list, adding <b>' + pts(sum(d.unassigned.map(function (t) { return t.impact; }))) + ' points</b> to the score. Nobody is working on ' + (n === 1 ? 'it' : 'them') + ' yet.</p>' +
              '<p class="ai-note">Marcus is at capacity (22 open, 6 past SLA), so critical vendors go to Priya and the rest to Marcus only if you want that.</p>',
        proposal: {
          title: 'Proposed action · assign ' + plural(n, 'task'),
          items: d.unassigned.map(function (t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' → ' + suggestOwner(t); }),
          approve: 'Approve assignments',
          done: 'the tasks would be assigned and each owner notified.'
        }
      };
    },
    nudge: function (d) {
      var list = d.pastSla.slice(0, 3);
      if (!list.length) return { html: '<p>No tasks in the list are past SLA.</p>' };
      return {
        html: '<p><b>' + d.pastSLA + ' tasks are past SLA</b>. The oldest ones in your list are below. I can draft a follow-up to each vendor’s security contact, referencing the original finding and asking for a remediation date.</p>',
        proposal: {
          title: 'Proposed action · follow up with vendors',
          items: list.map(taskLine),
          approve: 'Approve follow-ups',
          done: 'follow-ups would be sent to each vendor and the send logged as a vendor contact.'
        }
      };
    }
  };

  /* ---------- Per-tile content ---------- */
  var CONTEXTS = {
    'risk-score': {
      title: 'Portfolio risk score',
      intro: function (d) {
        return '<p>What would you like to learn about, or take action on, for the <b>portfolio risk score</b>?</p>' +
               '<p class="ai-note">It is ' + d.score + ' out of 100, up ' + d.scoreDelta + ' points over 30 days.</p>';
      },
      prompts: [
        { id: 'why-up', kind: 'learn', label: 'Why did the score go up?', answer: function (d) {
          return { html: '<p>Tasks are arriving faster than they close, and open tasks add more risk the longer they sit.</p>' +
            ul(['<b>' + d.inn + ' tasks arrived</b> in the last 7 days and ' + d.out + ' were closed (net +' + d.net + ').',
                '<b>' + d.pastSLA + ' tasks are past SLA</b>. A task counts for more the further past its SLA it goes, up to double.',
                'Five vendors account for <b>' + d.topShare + '%</b> of open-task impact (see the concentration list).']) };
        } },
        { id: 'top-vendors', kind: 'learn', label: 'Which vendors add the most risk?', answer: function (d) {
          var t = d.byImpact[0];
          return { html: '<p>The five vendors adding the most points to the score:</p>' +
            ul(d.topVendors.map(function (v) { return '<b>' + esc(v[0]) + '</b> ' + pts(v[1]); })) +
            (t ? '<p class="ai-note">The single largest task is <b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + pts(t.impact) + ').</p>' : '') };
        } },
        { id: 'target', kind: 'learn', label: 'What would it take to get back to where we were?', answer: function (d) {
          var need = d.scoreDelta, run = 0, pick = [];
          if (need <= 0) return { html: '<p>The score is not above where it was 30 days ago, so there is nothing to recover.</p>' };
          d.byImpact.forEach(function (t) { if (run < need) { pick.push(t); run += t.impact; } });
          return { html: '<p>To get back to <b>' + (d.score - need) + '</b> you need to remove about <b>' + need + ' points</b>. Closing these ' + pick.length + ' tasks would remove <b>' + pts(run) + '</b>:</p>' +
            ul(pick.map(function (t) { return '<b>' + esc(t.vendor) + '</b>: ' + esc(t.issue) + ' (' + pts(t.impact) + ')'; })) };
        } },
        { id: 'how-calc', kind: 'learn', label: 'How is the score calculated?', answer: function () {
          return { html: '<p>Each open task adds points equal to its <b>severity</b> × the <b>vendor’s tier</b> × an <b>age multiplier</b>.</p>' +
            ul(['Severity: critical 4.0, high 2.5, medium 1.0, low 0.5.', 'Vendor tier: critical 1.0, high 0.7, medium 0.4, low 0.2.', 'Age: 1.0 while within SLA, rising to 2.0 as the task goes further past it.']) +
            '<p>Task points are added to a smaller baseline for vendor posture (tier mix, expiring certificates) and normalized to 0 to 100. Waiting on a vendor pauses the team’s SLA clock but not the risk clock.</p>' }; } },
        { id: 'assign', kind: 'act', label: 'Assign the unassigned tasks', answer: SHARED.assign },
        { id: 'nudge', kind: 'act', label: 'Nudge vendors on past-SLA tasks', answer: SHARED.nudge },
        { id: 'summary', kind: 'act', label: 'Draft a summary for the audit committee', answer: function (d) {
          var names = d.topVendors.slice(0, 3).map(function (v) { return v[0]; }).join(', ');
          return { html: '<p>Here is a draft you can edit. It states the score, the cause, and what is being done.</p>',
            draft: { title: 'Audit committee summary', text:
              'Portfolio risk score: ' + d.score + '/100, up ' + d.scoreDelta + ' points over 30 days.\n\n' +
              'Cause: ' + d.inn + ' new investigation tasks in the last 7 days against ' + d.out + ' closed. ' + d.pastSLA + ' open tasks are past SLA, and open tasks add more risk the longer they stay open.\n\n' +
              'Concentration: five vendors account for ' + d.topShare + '% of open-task impact, led by ' + names + '.\n\n' +
              'Actions under way: assigning new tasks to analysts, following up with vendors on past-SLA items, and rebalancing analyst workload.' } };
        } }
      ]
    },

    'open-tasks': {
      title: 'Open investigation tasks',
      intro: function (d) {
        return '<p>What would you like to learn about, or take action on, for the <b>open investigation tasks</b>?</p>' +
               '<p class="ai-note">There are ' + d.open + ' open, and ' + d.pastSLA + ' of them are past SLA.</p>';
      },
      prompts: [
        { id: 'past-sla', kind: 'learn', label: 'Which tasks are past SLA?', answer: function (d) {
          var shown = d.pastSla.length;
          return { html: '<p><b>' + d.pastSLA + ' tasks are past SLA</b>. The oldest ones in your list:</p>' + ul(d.pastSla.map(taskLine)) +
            (d.pastSLA > shown ? '<p class="ai-note">The other ' + (d.pastSLA - shown) + ' are not in the list above. Open the “Stale, past SLA” filter to see the rest.</p>' : '') };
        } },
        { id: 'age', kind: 'learn', label: 'How old are the open tasks?', answer: function (d) {
          var L = ['0 to 3 days', '4 to 7 days', '8 to 14 days', '15 to 30 days', 'over 30 days'];
          var old = d.ages[3] + d.ages[4];
          return { html: '<p>Open tasks by age:</p>' + ul(d.ages.map(function (n, i) { return '<b>' + n + '</b> ' + L[i]; })) +
            '<p><b>' + old + ' tasks</b> have been open more than 15 days. That tail is where the risk score grows fastest.</p>' };
        } },
        { id: 'who-blocks', kind: 'learn', label: 'Are we waiting on vendors or on ourselves?', answer: function (d) {
          return { html: '<p>The split matters because it changes what you do:</p>' +
            ul(['<b>' + d.waitingVendor + ' tasks</b> are waiting on a vendor (average 11 days). Escalate to a senior contact at the vendor.',
                '<b>' + d.waitingTeam + ' tasks</b> are waiting on your team (average 4 days). Rebalance workload or coach.']) +
            '<p class="ai-note">Vendor delay pauses the team’s SLA clock, so the team is not scored down for it.</p>' };
        } },
        { id: 'assign', kind: 'act', label: 'Assign the unassigned tasks', answer: SHARED.assign },
        { id: 'escalate', kind: 'act', label: 'Escalate the oldest tasks', answer: function (d) {
          var list = d.pastSla.slice(0, 2);
          if (!list.length) return { html: '<p>No tasks in the list are past SLA, so there is nothing to escalate.</p>' };
          return { html: '<p>The oldest past-SLA tasks are well beyond their SLA. A nudge has not moved them, so I suggest escalating to a senior contact at each vendor and copying the vendor owner.</p>',
            proposal: { title: 'Proposed action · escalate', items: list.map(taskLine), approve: 'Approve escalation', done: 'an escalation would go to each vendor’s senior contact, and the task status would change to Escalated.' } };
        } },
        { id: 'rebalance', kind: 'act', label: 'Rebalance the analysts’ queues', answer: function () {
          return { html: '<p>Marcus has <b>22 open tasks, 6 past SLA</b>. Priya has <b>14 open, 1 past SLA</b>. Marcus is at capacity.</p>',
            proposal: { title: 'Proposed action · rebalance', items: ['Move 4 tasks that are in review or being verified from Marcus to Priya', 'Keep the 6 past-SLA tasks with Marcus, who already has the vendor context', 'Review again in 3 days'], approve: 'Approve rebalance', done: 'the 4 tasks would move to Priya and both analysts would be notified.' } };
        } }
      ]
    },

    'arriving-vs-closed': {
      title: 'Arriving vs. closed',
      intro: function (d) {
        return '<p>What would you like to learn about, or take action on, for <b>arriving versus closed tasks</b>?</p>' +
               '<p class="ai-note">Over the last 7 days, ' + d.inn + ' arrived and ' + d.out + ' were closed. The backlog grew by ' + d.net + '.</p>';
      },
      prompts: [
        { id: 'why-growing', kind: 'learn', label: 'Why is the backlog growing?', answer: function (d) {
          var first = d.newDaily[0], last = d.newDaily[d.newDaily.length - 1];
          return { html: '<p>Arrivals are climbing while closures are flat.</p>' +
            ul(['New tasks rose from <b>' + first + ' a day</b> two weeks ago to <b>' + last + ' a day</b> today.',
                'Closures held at about <b>' + (d.out / 7).toFixed(1) + ' a day</b> over the last 7 days.',
                'Each day the gap adds to the backlog, and older tasks add more risk.']) };
        } },
        { id: 'what-arriving', kind: 'learn', label: 'What kinds of issues are arriving?', answer: function (d) {
          var c = {}; d.tasks.forEach(function (t) { c[t.cat] = (c[t.cat] || 0) + 1; });
          var rows = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).map(function (k) { return '<b>' + esc(k) + '</b>: ' + c[k]; });
          return { html: '<p>By category, across the tasks in your attention list:</p>' + ul(rows) + '<p class="ai-note">Counted from the ' + d.tasks.length + ' tasks in your attention list, not every open task.</p>' };
        } },
        { id: 'rate', kind: 'learn', label: 'How fast do we need to close tasks?', answer: function (d) {
          var need = d.inn / 7, now = d.out / 7;
          return { html: '<p>To hold the backlog steady, closures have to match arrivals.</p>' +
            ul(['Arrivals: about <b>' + need.toFixed(1) + ' a day</b>.', 'Closures now: about <b>' + now.toFixed(1) + ' a day</b>.', 'Gap: about <b>' + (need - now).toFixed(1) + ' more closures a day</b>, or fewer arrivals, to stop the growth.']) };
        } },
        { id: 'assign', kind: 'act', label: 'Assign the unassigned tasks', answer: SHARED.assign },
        { id: 'auto-assign', kind: 'act', label: 'Auto-assign new tasks by region', answer: function () {
          return { html: '<p>New tasks could be assigned automatically as they arrive, so none sit unassigned.</p><p class="ai-note">Marcus is at capacity (22 open, 6 past SLA). US assignments would add to that, so consider rebalancing first.</p>',
            proposal: { title: 'Proposed rule · auto-assign', items: ['EU vendors and critical-tier vendors → Priya', 'US and Canadian standard vendors → Marcus', 'Anything else stays unassigned for you to triage'], approve: 'Turn on auto-assign', done: 'the rule would be saved and applied to every new task.' } };
        } },
        { id: 'capacity', kind: 'act', label: 'Draft a request for temporary capacity', answer: function (d) {
          return { html: '<p>Here is a draft you can edit and send.</p>', draft: { title: 'Request for temporary capacity', text:
            'Subject: Temporary capacity for vendor risk investigations\n\n' +
            'In the last 7 days ' + d.inn + ' investigation tasks arrived and ' + d.out + ' were closed, so the backlog grew by ' + d.net + '. ' + d.pastSLA + ' open tasks are past SLA.\n\n' +
            'The team is working at capacity, and the gap is capacity, not effort. I am asking for temporary help for the next 30 days to bring closures in line with arrivals, so that risk to Northbridge stops growing.' } };
        } }
      ]
    },

    'team-score': {
      title: 'Team score',
      intro: function () {
        return '<p>What would you like to learn about, or take action on, for the <b>team score</b>?</p>' +
               '<p class="ai-note">It is 82 out of 100, up 2 points on last month. The score is a workload and coaching signal, not a ranking.</p>';
      },
      prompts: [
        { id: 'parts', kind: 'learn', label: 'What makes up the team score?', answer: function () {
          return { html: '<p>Four parts, measured over the last 30 days and weighted by severity:</p>' +
            ul(['<b>Closed on time</b> (40%): 78% of tasks closed within SLA.', '<b>Time to verify</b> (20%): 1.6 days median from assignment to a confirmed vendor match.', '<b>Vendor follow-ups sent</b> (20%): 93% of vendor-waiting tasks followed up on schedule.', '<b>Reopened / rework</b> (20%): 4% of tasks reopened.']) +
            '<p class="ai-note">The score is never shown without these parts.</p>' };
        } },
        { id: 'marcus', kind: 'learn', label: 'Why did Marcus’s score drop?', answer: function () {
          return { html: '<p>Marcus’s score fell 2 points to <b>74</b>. The cause is capacity, not effort:</p>' +
            ul(['<b>22 open tasks</b>, against 14 for Priya.', '<b>6 are past SLA</b>, mostly waiting on the vendor or the team’s review.', 'Tasks waiting on a vendor pause the team’s SLA clock, so the drop is from the tasks that were not waiting on anyone.']) +
            '<p>Rebalancing the queue is likely to help more than coaching.</p>' };
        } },
        { id: 'trend', kind: 'learn', label: 'How has the team changed since last month?', answer: function () {
          return { html: '<p>The team score is up <b>2 points</b> to 82.</p>' + ul(['<b>Priya Nair</b>: 91, up 3.', '<b>Marcus Chen</b>: 74, down 2, at capacity.', '<b>Dana Vasquez</b>: not scored (escalations and Canadian vendors).']) };
        } },
        { id: 'rebalance', kind: 'act', label: 'Rebalance workload', answer: function () {
          return { html: '<p>Marcus has <b>22 open tasks, 6 past SLA</b>. Priya has <b>14 open, 1 past SLA</b>.</p>',
            proposal: { title: 'Proposed action · rebalance', items: ['Move 4 tasks that are in review or being verified from Marcus to Priya', 'Keep the past-SLA tasks with Marcus, who already has the vendor context', 'Review again in 3 days'], approve: 'Approve rebalance', done: 'the 4 tasks would move to Priya and both analysts would be notified.' } };
        } },
        { id: 'note', kind: 'act', label: 'Draft a supportive note for Marcus', answer: function () {
          return { html: '<p>Here is a draft that frames this as capacity, which is what the numbers show.</p>', draft: { title: 'Note to Marcus', text:
            'Hi Marcus,\n\nI wanted to check in. Your queue is the biggest on the team right now (22 open, 6 past SLA), and I do not think that is about effort. Most of those tasks are waiting on vendors or review.\n\nI am looking at moving a few tasks to Priya and adding temporary help. Can we talk for 15 minutes this week about what would take the most weight off?\n\nDana' } };
        } },
        { id: 'team-update', kind: 'act', label: 'Draft a team update for leadership', answer: function () {
          return { html: '<p>Here is a draft you can edit.</p>', draft: { title: 'Team update', text:
            'Team score: 82/100, up 2 points on last month.\n\n' +
            'Closed on time: 78%. Time to verify: 1.6 days. Vendor follow-ups sent on schedule: 93%. Reopened: 4%.\n\n' +
            'Risk to note: capacity, not effort, is the gap. One analyst is carrying 22 open tasks with 6 past SLA. I am rebalancing the queues and asking for temporary capacity.' } };
        } }
      ]
    }
  };

  /* ---------- Dialog ---------- */
  var dialog, threadHost, ctxEl, subEl, form, input, sendBtn;
  var threads = {};              // one conversation per tile, kept while the page is open
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

  function snapshot(ctx, cardEl) {
    var btn = document.querySelector('.ai-spark[data-ai="' + ctx + '"]');
    var card = cardEl || (btn && btn.closest('.stat-card'));
    if (!card) { ctxEl.hidden = true; return; }
    ctxEl.hidden = false;
    var q = function (s) { return card.querySelector(s); };
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

  function proposal(t, p) {
    var box = mk('div', 'ai-proposal', '<div class="ai-proposal__title">' + esc(p.title) + '</div>' + ul(p.items));
    var actions = mk('div', 'ai-proposal__actions');
    var ok = mk('button', 'ai-btn ai-btn--primary'); ok.type = 'button'; ok.textContent = p.approve;
    var no = mk('button', 'ai-btn ai-btn--ghost'); no.type = 'button'; no.textContent = 'Not now';
    actions.appendChild(ok); actions.appendChild(no); box.appendChild(actions);
    function settle(msg) {
      ok.disabled = no.disabled = true;
      addMsg(t, 'ai', msg);
    }
    ok.addEventListener('click', function () { settle('<p>Approved. In the full product, ' + esc(p.done) + '</p><p class="ai-note">This prototype does not change any data.</p>'); });
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

  global.TesseraAI = { setData: function (fn) { provider = fn; }, open: open };
})(window);
