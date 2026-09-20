# Dana's Dashboard: Concept and Design Rationale

Recommended content, order, and reasoning for the Vendor Risk Manager dashboard in Tessera. Written so it can be rebuilt in the working prototype (`prototypes/app-shell/index.html`).

## Files in this folder

| File | Purpose |
|---|---|
| `dana-dashboard-clean.html` | The dashboard as it would look, with no commentary. Use this as the visual target. |
| `dana-dashboard-annotated.html` | Same layout with numbered priority badges, the question each block answers, and a "why here" note under each block. |
| `README.md` | This document: the logic, definitions, component specs, and how to map it onto the existing prototype. |

Both HTML files are self-contained (inline CSS and one small inline script, no build step) and use sample data for Northbridge Financial Group. They follow the app's colour tokens (`--nav #131929`, `--canvas #EFF3F7`, status colours) but do **not** yet use the faded-card spec from `design-system/card.md`. Cards here are plain white with a full border, so restyle them with `.panel` / `.stat-card` from `shell.css` when porting.

## 1. What Dana needs from this screen

Dana manages 600+ vendors. Tessera scans the public internet, and when it finds a high-risk issue it categorizes it and opens an investigation task. Someone on her team must verify the issue, confirm which vendor it belongs to, and contact the vendor to fix it. Vendors are slow to respond, so tasks stay open for days. The longer a task stays open, the more it adds to Northbridge's risk score. She also needs to know how her team is performing.

That produces four questions, and the dashboard is organized around them:

| # | Question | Answered by section |
|---|---|---|
| Q1 | What needs my attention right now (urgent, new, stale)? | 1 (health check), 2 (attention list) |
| Q2 | What is my team doing and how is it progressing? | 5 (team) |
| Q3 | Are we, as a team, keeping up? | 1, 3 (arrivals vs. closed), 4 (age) |
| Q4 | Are new tasks arriving faster than old ones close? | 3 (arrivals vs. closed) |

Two further needs come from the persona doc and the brief: the risk score must be explainable (Section 6), and the product's continuous scanning must feel real without competing with action (Section 7).

## 2. Section order and why

The order follows Dana's real day. Her persona's morning is "reviews overnight risk alerts and triages which need an analyst to dig in." So the page goes from *how bad is today*, to *what do I act on*, to *are we keeping up*, to *who is doing what*, and only then to the supporting evidence.

### Section 1: Health check (four tiles)

Four numbers Dana can read in five seconds.

| Tile | Shows | Why |
|---|---|---|
| Portfolio risk score | 0-100 score, change vs. 30 days ago, small trend line | The headline number the brief calls for ("risk score plus trend up or down"). Red when rising, green when falling. |
| Open investigation tasks | Count, net change over 7 days, count past SLA, median age | Size of the backlog and how old it is. |
| Arriving vs. closed, 7 days | "41 in, 24 out", net backlog change, close rate | The direct answer to Q4. |
| Team score | 0-100, change vs. last month | The team measure the brief calls for. Deeper detail is in Section 5. |

**Design decision:** the risk score and the arrivals-vs-closed tile are deliberately next to each other. The core story of the product is that risk rises *because* tasks arrive faster than they close. Placing them together lets Dana see cause and effect without doing the arithmetic.

**Existing prototype:** the current four stat cards are Active Vendors, Critical Alerts, Overdue Remediations, Assessments Due (30d). Recommendation: keep the card component but change the set. Move Active Vendors (612) into the page header as "612 vendors monitored". Move Assessments Due to the Assessments page, since it is a different workflow from investigation tasks. Critical Alerts and Overdue Remediations are folded into the tiles above and the attention filters below.

### Section 2: Needs your attention now (the working list)

The main surface of the page, and the most important block after the health check.

- **Sorted by risk impact, not by date.** Each row shows how many points that task is adding to the portfolio score right now. This lets Dana rank by consequence.
- **Filter chips:** All, Unassigned/new, Critical, Stale (past SLA), Waiting on vendor. Each chip shows a count. These map directly to her question "what's urgent, what's new, what's been sitting too long."
- **Columns:** issue and category, vendor and tier, status tag, age against SLA, owner, risk impact, one action button.
- **Age is always shown against its SLA** (for example "9 d / 7 d") and turns red once past SLA. "Stale" is therefore defined by the system, not by anyone's memory.
- **Unassigned tasks are listed first**, because they are the only tasks nobody is working on. The owner cell shows a dashed avatar and the action button reads "Assign."
- **Action buttons change by state:** Assign (unassigned), Open (in progress), Nudge (past SLA, vendor contact due), Escalate (badly overdue).

**Existing prototype:** this replaces the "Attention needed" panel, which lists vendors. The unit here is the *task*, because the task is what Dana's team acts on. The existing "Investigation tasks" queue that the scan mosaic feeds is the same object, so the two should be merged into this one list. The existing "Continuous monitoring" feed overlaps with this list and can be retired (the prototype README already notes this overlap).

### Section 3: Are we keeping up? (arrivals vs. closed, 14 days)

A two-line chart: new tasks per day (red) and closed tasks per day (blue). The area between the lines is lightly shaded while arrivals exceed closures, so backlog growth appears as a visible shape.

- **Why a line chart with a shaded gap:** the question is a comparison over time, and the gap *is* the answer.
- **Why 14 days:** long enough to see a trend, short enough to stay current. Longer history belongs on the Reports page.
- **Colour rule:** red is reserved for "arriving" and blue for "closed" throughout the page. Do not reuse either for anything else in this view.
- **Add on build:** a hover tooltip per day (date, new, closed, net), a legend that is always visible, and a "view as table" toggle for accessibility.

### Section 4: How long are tasks open? (age and who is blocking)

A single segmented bar of the open tasks by age (0-3, 4-7, 8-14, 15-30, 30+ days), running green to dark red, plus four small facts:

- Waiting on vendor (count and average age)
- Waiting on our team (count and average age)
- Average time to verify
- Average time to fix

**The key decision is splitting "waiting on vendor" from "waiting on our team."** They call for different actions. If tasks are slow because of the team, Dana rebalances workload or coaches. If they are slow because of the vendor, she escalates to a senior contact at that vendor. A single "average age" number hides which one is happening. Because vendors can take a while to respond, this split also prevents her team from being blamed for delays it cannot control.

### Section 5: Your team

One row per person: name and role focus, a segmented workload bar, one line of counts, what they are working on right now, and their score with a change arrow.

- **Workload bar segments:** verifying, with vendor, in review, past SLA. This shows *where* work is stuck rather than just how much someone holds.
- **Capacity hint:** if someone is at capacity with several past-SLA tasks, show a short suggestion ("consider rebalancing"). In the sample, Marcus is at 22 open tasks and 6 past SLA, while Priya has 14 open and 1 past SLA.
- **Team score with its parts:** four small tiles under the rows (closed on time, time to verify, vendor follow-ups sent, reopened/rework rate). The score is never shown without its components.
- **Dana's own row is shown but unscored.** She carries escalations and Canadian vendors, but scoring the manager against the team is a decision to make with her (see open questions).

**Persona reasoning:**
- *Marcus* wants to be seen as reliable and is sensitive to error and SLA misses being reputational. A bare ranking would work against him. Showing composite parts and workload gives him something to act on, and his persona already asks for "a clear, attributable record of his work product."
- *Priya* is the only technical escalation point and her routine backlog grows whenever critical work arrives. Her row should make that visible as workload, not underperformance.
- *Dana* needs to see both without reading each analyst's queue.

**Recommended framing:** present scores as coaching and workload signals, not a leaderboard. Do not sort the rows by score. Keep them in a fixed order.

**Existing prototype:** this replaces the "Team workload" panel.

### Section 6: Where risk is concentrated

A ranked list of the top five vendors by points added to the portfolio score, with a proportional bar and a one-line summary ("top 5 explain 51% of the increase").

This ties the abstract score to specific vendors, which makes it actionable and defensible in front of an audit committee. Dana's persona says she needs to prove her position to a regulator without weeks of preparation, and this list is the first thing she would point to when asked "why did the score go up?"

### Section 7: Continuous scan mosaic (last, and slim)

The 612-tile vendor mosaic from the existing prototype, with tile colours: light blue-grey (monitored, clear), orange (open finding), red (critical signal).

**Why it is last:** it is the product's differentiator and it builds trust that the system is watching, but Dana cannot take action from it. Placed low, it works as ambient reassurance instead of taking prime space from the action list. In the working prototype it can keep its animation and simulated-signal behaviour.

## 3. Definitions to agree before build

The numbers in the concept are sample values and are **not derived from these formulas**. The formulas below are proposals to make the score explainable; they need agreement with Dana's team.

### Task risk impact (per open task)

```
impact = severity_weight × vendor_tier_weight × age_multiplier

severity_weight:     critical 4.0 · high 2.5 · medium 1.0 · low 0.5
vendor_tier_weight:  critical 1.0 · high 0.7 · medium 0.4 · low 0.2
age_multiplier:      1.0 while within SLA
                     then 1 + 0.5 × ((age − SLA) / SLA), capped at 2.0
```

This gives the brief's rule ("if a task is open too long, it increases risk") a concrete shape: a task starts at its base weight and grows until it is doubled.

### Portfolio risk score (0-100)

Sum of open-task impact plus a smaller baseline for vendor-level posture (tier mix, expiring certifications), normalized to 0-100. Trend is the difference from the score 30 days ago. Calibration (what counts as 68) is a product decision.

### SLA by severity (suggested starting point)

| Severity | Verify | Close |
|---|---|---|
| Critical | 24 hours | 2 days to contact, 7 days to remediate |
| High | 2 days | 7 days |
| Medium | 5 days | 14 days |
| Low | 10 days | 30 days |

Sample rows use these (for example, a high-severity task at "9 d / 7 d"). "Waiting on vendor" tasks pause the *team* SLA clock but not the *risk* clock. Otherwise the team is penalized for vendor delay, while the risk to Northbridge is not reduced by it.

### Team and member score (0-100)

Proposed weights:

| Component | Weight | Measured as |
|---|---|---|
| Closed on time | 40% | Share of tasks closed within their SLA |
| Time to verify | 20% | Median hours from assignment to verified vendor match, vs. target |
| Vendor follow-ups sent | 20% | Share of vendor-waiting tasks with a follow-up within the cadence (for example every 3 days) |
| Reopened / rework | 20% | Inverse of the reopen rate |

Scores should be calculated on a rolling 30 days, and severity-weighted so that closing one critical task counts more than closing several low ones.

### Other terms

- **Net backlog change:** tasks arrived minus tasks closed over the period.
- **Close rate:** closed divided by arrived over the period.
- **Median age:** median days open across currently open tasks.

## 4. Data the screen needs

Each element below maps to one field or aggregate, which is useful for handing to whoever builds the data layer.

**Per task:** id, title, category (for example data exposure, misconfiguration, vulnerability, breach signal, certificate hygiene), severity, vendor id, vendor tier, status (new, verifying, waiting on vendor, in review, resolved), owner, created at, verified at, SLA due at, last vendor contact at, computed risk impact.

**Aggregates:** portfolio score now and 30 days ago, open count, past-SLA count, median age, arrivals and closures per day for 14 days, age-bucket counts, per-person status counts, per-person and team score components, top vendors by impact, and the 612 vendor tile states.

## 5. Component and style notes for the port

- **Status colours** (from the app tokens): critical `#D64545`, high `#E0883C`, medium `#D9B23C`, low `#3FA873`. Never rely on colour alone: the concept pairs colour with an icon or a text label on every status tag ("Past SLA", "Critical", "New", "Waiting on vendor").
- **Age bar colours** run green, yellow, orange, red, dark red. The oldest bucket uses `#8F2A2A` so it stays distinguishable from the 15-30 day bucket for colour-blind users.
- **Charts are hand-built inline SVG** in the concept (one line chart, one sparkline). They have `role="img"` and an `aria-label` that states the trend in words. In the port, add hover tooltips and a table alternative.
- **Dark mode:** the concept includes a basic dark theme via `prefers-color-scheme`. The prototype currently has a single light theme, so this can be dropped if not needed.
- **Responsive:** the 12-column grid collapses to a single column below 900 px. Tables scroll horizontally inside their card.
- **Avatars:** initials in a circle; a dashed circle with "?" marks unassigned.

## 6. Suggested build order in the prototype

1. Replace the four stat cards with the four health-check tiles (Section 1).
2. Build the merged task list (Section 2) and remove the separate "Attention needed" panel and "Continuous monitoring" feed. Keep the scan animation's behaviour of adding a new row when a signal arrives, so a new signal appears at the top of the list as an unassigned task and the health-check counts update.
3. Add the arrivals-vs-closed chart and the age block (Sections 3 and 4).
4. Replace "Team workload" with the team block (Section 5).
5. Add the concentration list (Section 6).
6. Move the mosaic to the bottom (Section 7).
7. Apply the faded-card spec to all card surfaces.

## 7. Open questions

1. **Scoring Dana herself.** Should the manager's own tasks count toward the team score? The concept leaves her unscored.
2. **SLA clock ownership.** Should waiting-on-vendor pause the team clock (as proposed here)? This is the single biggest driver of fairness in the team score.
3. **Score transparency.** Is Dana comfortable showing individual scores to the analysts themselves? Marcus's and Priya's variants of the dashboard (still open work in the prototype README) will need to answer this.
4. **Unassigned rule.** Should Tessera auto-assign by region (Priya for EU, Marcus for US) or leave triage to Dana? The concept assumes Dana assigns.
5. **Calibration.** What score is "normal," and at what level should the tile turn amber or red? Needs a threshold policy.
6. **Regulatory tagging.** Tasks touching DORA-critical vendors may need an extra flag (Priya's and Dana's personas both depend on DORA register accuracy). Not shown in the concept; could be a column or a filter chip.
7. **Analyst variants.** Priya's view would center on her own queue and evidence detail; Marcus's on SLA countdowns and intake. Both can reuse Sections 2 and 4 filtered to the individual.

## 8. Caveats

- All figures are illustrative and not reconciled to the formulas above.
- The dashboard mapping to the existing prototype is based on its README and the section headings and stat cards in `index.html`. I did not review its full markup or scripts, so class names and hooks may need adjusting during the port.
- The HTML files were not rendered in a browser during authoring, so check the layout, particularly the arrivals chart scale labels, when you first open them.
