# Prototypes

UI prototypes and flows for the Tessera product — Figma links, exported screens, or code/HTML prototypes.

## `app-shell/`

The first coded prototype: the core application shell — a floating, collapsible left-hand navigation plus a sample persona-driven dashboard (Dana Vasquez's view). Static HTML/CSS/JS, no build step. Open `app-shell/index.html` via a local static server (relative paths reference `../../brand/logos/` and `../../personas/`, so it must be served from the repo root — see `.claude/launch.json`, config `tessera-prototype`).

**Navigation structure:**
- **Dashboard** — persona-driven landing view.
- **Risk & Vendors**: Vendors, Assessments (incl. RoPA), Data Mapping, Remediation & Tasks, Monitoring & Alerts.
- **Governance**: Policies, Reports.
- **System**: Setup & Configuration.

Two sections were added beyond the original brief, both directly justified by the personas:
- **Remediation & Tasks** — a dedicated, SLA-driven work queue. Directly addresses [Marcus Chen's](../personas/marcus-chen.md) pain point of having "no at-a-glance view of what's overdue across his queue," and gives Priya/Dana a place to track remediation-to-resolution.
- **Monitoring & Alerts** — surfaces continuous, AI-driven risk signals (breach signals, rating changes, expiring certifications) between review cycles. This is the product's core differentiator per [`../company-profile/README.md`](../company-profile/README.md) ("continuous vendor monitoring" pillar) and directly answers [Dana's](../personas/dana-vasquez.md) and [Priya's](../personas/priya-nair.md) point-in-time blind-spot pain points.

**Design notes:**
- Dashboard sample data assumes ~600+ active vendors (612), reflected in stat cards, table pagination cues ("View all →"), and global search copy — built for scale from the start rather than a handful of demo rows.
- Sidebar is a dark, floating "console" surface (not flush to the viewport edge), flush-square on its right edge when expanded and fully rounded when collapsed — deliberately distinct from a flat, flush-left enterprise sidebar.
- Uses `design-system/colors.md`, `typography.md`, and `spacing.md` tokens throughout; introduced first-draft semantic status colors (critical/high/medium/low) not yet formalized in `colors.md` — see Open work below.

**Nav rebuild from Figma (2026-09-18):** the sidebar chrome (background, logo lockup, collapse control, and the collapse/expand motion) was rebuilt pixel-for-pixel from the Figma design at node `7:666` ("lef-navigation-bar") — menu items and the persona footer are unchanged, per the brief. Traced from Figma:
- Exact widths (265px expanded / 98px collapsed) and asymmetric corner radii (9.138px left-only when expanded, all four corners when collapsed), fill `#131929`.
- Real vector logo assets exported from Figma — `tessera-mark.svg`, `tessera-mark-condensed.svg` (a distinct re-drawn asset, not a crop), `tessera-wordmark.svg`, `tessera-tagline.svg` — now committed to `../brand/logos/` instead of the earlier raster-crop stopgap. This is also where the product's tagline, *"Intelligent Third-party Governance,"* was first surfaced (now in `../company-profile/README.md`).
- The collapse control is the design's own inline icon button (18.19×19px, repositioning from x=238 to x=74) with two crossfading icon states — not a separate floating circular button as in the first draft.
- **Motion**: read directly from the Figma prototype's `reactions` data (via the Plugin API — `get_motion_context` doesn't surface classic Smart Animate/spring interactions, only the newer keyframe Animate panel) — `SMART_ANIMATE`, easing preset `"QUICK"`, duration **0.744255542755127s**. Figma doesn't expose the raw spring physics (mass/stiffness/damping) for named presets via any API, so the easing curve is a sampled `linear()` approximation of a light, single-overshoot spring (~8% peak overshoot) — the duration is exact and authoritative; the curve shape is a reasoned approximation, not a guess. All animated properties (width, corner radii, element position/size, icon/logo crossfades) share this one transition, matching a single Smart Animate reaction. `prefers-reduced-motion` is respected.

**Shared chrome (2026-09-18):** the sidebar/topbar/common-component CSS was extracted from `index.html` into `shell.css` so additional section pages (starting with `vendors.html`) don't re-duplicate the whole nav implementation, including its exact-from-Figma motion. Each page still includes its own copy of the sidebar/topbar *markup* (no templating layer in a static prototype), but all styling — including the Figma-matched nav geometry and motion — lives in one file. The dashboard-only bits (monitoring feed, team workload panel) stayed inline in `index.html` since nothing else uses them yet.

**Card styling (2026-09-19):** every card surface in the app (`.stat-card` and `.panel`, in `shell.css`) now follows the Figma "faded-card" spec at node `19:1232`: a transparent-to-white gradient, borders on the sides and bottom only, and bottom-only rounded corners. Documented in [`../design-system/card.md`](../design-system/card.md). Two shared tokens changed with it, to the values in the Figma mock: the page canvas (`#F6F8FB` to `#EFF3F7`, since the fade blends into it) and the border colour (`#E5E9EF` to `#E2E5EC`). The dark data-flow hero on `data-mapping.html` is unchanged. If a browser shows the old look after pulling this, hard-refresh (the static server lets `shell.css` cache).

**Continuous scanning on the Dashboard and Monitoring & Alerts (2026-09-19):** two of the concepts from [`explorations/continuous-scanning.html`](explorations/continuous-scanning.html) are now in the app, sharing [`app-shell/scan.css`](app-shell/scan.css) and [`app-shell/scan.js`](app-shell/scan.js).
- **Dashboard: Tessera mosaic (option 02)**, below the stat cards and above the Attention needed / feed panels, with no container: the mosaic and the task queue sit straight on the canvas and use the full content width (`scan-panel--open` in `scan.css`). "Monitored, clear" tiles are `#D6E0EB` (`--tile-clear`); open findings and critical signals use the status colours. The task cards use the faded-card spec. (Monitoring & Alerts keeps the dark panel.) All 612 vendors are tiles (the 24 from `vendors.html` keep their real names and tiers; the rest are generated, with tier totals matching the Active Vendors card). Seven tiles start red and 15 amber, matching the "7 critical alerts" and 15 open-finding numbers. A scan line crosses the mosaic; hovering a tile shows the vendor and tier. When a scripted signal arrives, the scan line finds that vendor's tile, it turns red or orange, and a task card joins the "Investigation tasks" queue. A critical signal also bumps the mosaic count, the Critical Alerts stat card, and the Monitoring & Alerts nav badge together.
- **`monitoring.html`: Signal flow (option 03)** as the hero, above a signals register (severity chips, category/status/search filters, same pattern as `vendors.html`). Six public-internet sources converge on the Tessera mark, the signal is categorized, and it leaves as a task. The task also lands as a new row at the top of the register, and the chip counts and nav badge update. The Monitoring & Alerts nav item is now wired on every page.
- **Prototype behaviour:** a scripted signal replays about every 14s (up to 4 per page load) and on the "Simulate a signal" button, standing in for the real scanning service. Signals, vendors, and counts are sample data. Respects `prefers-reduced-motion` (no auto-replay; the button adds the task instantly).
- **Not yet done:** "Open task" and register "View →" are placeholders; the Dashboard's older "Continuous monitoring" feed panel now overlaps the mosaic's queue and could be retired or repurposed; the Radar and Pulse ribbon concepts were not taken forward.

**`vendors.html` (2026-09-18):** the full vendor register view — the first built-out section beyond the Dashboard. Built explicitly for the 600+ vendor scale this project keeps returning to:
- **Tier filter chips** (All / Critical / High / Medium / Low) with live counts, plus name search and Region/Owner/Status filters — all composable and applied client-side over a representative 24-vendor sample (real build would page this server-side; a static prototype can't fake 612 real rows meaningfully).
- **Bulk row selection** — a select-all checkbox plus per-row checkboxes drive a bulk action bar (Assign owner / Export / Tag / Clear) that appears once anything is selected. Actions are visual-only, but the selection state itself is fully functional.
- The Dashboard's "Attention needed → View all" link deep-links to `vendors.html?filter=attention`, which shows critical-**or**-high vendors together — a case the single-select tier chips can't express on their own, handled as a one-time entry-point mode rather than a new persistent filter control.
- Status (lifecycle: Active / Under Review / In Remediation / Pending Intake / Offboarding) is deliberately a separate visual language from risk tier (Critical/High/Medium/Low), since conflating "how risky" with "where it is in its lifecycle" was a real gap in the personas' pre-Tessera spreadsheets.

**`assessments.html` (2026-09-18):** the assessment queue — explicitly covers RoPA per the original brief, alongside the other assessment types the personas' compliance grounding calls for:
- **Type filter chips** (All / Vendor Security / RoPA / DPIA / EU AI Act Screening / Criticality Tiering / Pen Test Review) — RoPA is a first-class, directly filterable category here, not buried in a subtitle. Backed by [`../compliance/README.md`](../compliance/README.md): RoPA and DPIA map to GDPR, EU AI Act Screening to the EU AI Act, Criticality Tiering to DORA/NIS2.
- Same toolbar pattern as `vendors.html` (search + Region/Owner/Status selects) and the same bulk-selection mechanics (here: Assign owner / Escalate / Export), reusing the pattern rather than inventing a new one.
- **Due-date urgency is color-coded** (overdue in red, due-soon in amber, complete in green with a completion date) — a direct answer to Marcus's "invisible SLA math" pain point and Dana's "point-in-time blind spots."
- Status here is *assessment* lifecycle (Not Started / In Progress / In Review / Escalated / Complete) — a different lifecycle from `vendors.html`'s *vendor* status, intentionally not reused as the same enum since they answer different questions ("where is this assessment" vs. "where is this vendor relationship").
- Sample data reuses the same 24 vendors from `vendors.html` (same owners/regions) so the two pages read as one coherent portfolio rather than disconnected mock data.

**`data-mapping.html` (2026-09-18):** the brand mark used as the page's literal, functioning centerpiece, per the user's direction to make it "the central theme" — not a decorative header icon. Traced from the Figma reference at node `19:1165` (a large render of the "single-tesseract" mark: a central cube with six radiating node-and-line connections):
- The hero diagram reproduces that exact hub-and-spoke *shape* — one central hub, six evenly-spaced spokes — as **live, interactive markup**: an inline SVG for the six dashed connector lines (animated to suggest flow) plus six real `<button>` nodes, not a static export of the Figma asset. The center hub reuses the actual `tessera-mark.svg` cube inside a glowing dark badge, labeled with the org whose data is being mapped (Northbridge), so the whole diagram literally reads as "Tessera at the center of Northbridge's data."
- Each of the six spokes is one data category (Customer PII & KYC, Financial & Payment, Employee & HR, Security & Authentication, Marketing & Behavioral, Special Category) with a live vendor count. **Clicking a node is a real filter**, not a static illustration: it highlights that spoke, dims the rest, and filters the register below — and the reverse also works, via the Category `<select>` in the toolbar, so the diagram and the data stay in sync either direction.
- The register below follows the same pattern as `vendors.html`/`assessments.html` (search + selects, bulk-selection bar), with columns specific to data mapping: data category, direction (Inbound/Outbound/Bidirectional), cross-border transfer (with the jurisdiction pair, e.g. "EU → US"), and GDPR Art. 6 legal basis.
- Sample data extends the same 24-vendor set from `vendors.html`/`assessments.html` with a data category, direction, cross-border flag, and legal basis per vendor, keeping all three section pages reading as one portfolio.

**Open work:**
- Formalize the semantic status colors (critical/high/medium/low), vendor lifecycle-status colors, and assessment lifecycle-status colors introduced here into `design-system/colors.md`.
- Build out the remaining section views (Remediation queue, Policies, Reports, Setup) and wire their nav items (still `href="#"` placeholders).
- Real vendor, assessment, and data-flow detail pages — every row's "View →" link is currently a placeholder.
- Analyst-specific dashboard variants for Priya and Marcus (this shell currently only shows Dana's view).
- If Figma ever exposes exact spring constants for "Quick" (e.g. via a future API or manual inspection in the desktop app's Interaction panel), swap the approximated `linear()` easing for the precise one.

## `explorations/`

Design explorations that compare several directions for one problem, rather than building one screen.

- [`continuous-scanning.html`](explorations/continuous-scanning.html) (2026-09-19): four animated ways to show that Tessera continuously scans the public internet for signals about Dana's vendors, and that a high-risk finding is categorized and becomes an investigation task. **Radar sweep** (vendors on risk-tier rings, a sweep finds the flagged one), **Tessera mosaic** (all 612 vendors as tiles, a scan line crosses them), **Signal flow** (six public-internet sources converge on the Tessera mark, thousands of signals in, a few tasks out), and **Pulse ribbon** (a heartbeat strip in the Dashboard header that spikes and drops a task banner). All four replay the same four scripted signals; each has a "Trigger a signal" button. Uses the app's tokens from `shell.css`; the ribbon uses the faded-card treatment because it is designed to sit in the Dashboard. Sample signals, vendors, and counts are fictional. Respects `prefers-reduced-motion` (static frame, tasks appear without animation). Kept as a snapshot: options 02 and 03 were taken into the app (see above), with different sample vendors so they match the app's data.

## `personas/`

Standalone HTML persona artifacts — one page per persona, transcribed in full from the [`../personas/`](../personas) Markdown docs (snapshot, goals, a day in the life, responsibilities, pain points, motivations, tools, compliance frameworks, quote, and "how Tessera helps"), for sharing/viewing as a page rather than reading Markdown. Share `persona.css` for consistent styling; each page is otherwise self-contained. Linked from the root [`../../index.html`](../../index.html) under "Personas," and cross-link to each other via a switcher in the top bar.

- [`dana-vasquez.html`](personas/dana-vasquez.html)
- [`priya-nair.html`](personas/priya-nair.html)
- [`marcus-chen.html`](personas/marcus-chen.html)

**Open work:** the broader Privacy Management persona suite (privacy ops manager, privacy engineer, CISO-overlap, vendor, consumer) still needs both a Markdown doc and a matching artifact page once drafted.
