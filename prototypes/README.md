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

**`vendors.html` (2026-09-18):** the full vendor register view — the first built-out section beyond the Dashboard. Built explicitly for the 600+ vendor scale this project keeps returning to:
- **Tier filter chips** (All / Critical / High / Medium / Low) with live counts, plus name search and Region/Owner/Status filters — all composable and applied client-side over a representative 24-vendor sample (real build would page this server-side; a static prototype can't fake 612 real rows meaningfully).
- **Bulk row selection** — a select-all checkbox plus per-row checkboxes drive a bulk action bar (Assign owner / Export / Tag / Clear) that appears once anything is selected. Actions are visual-only, but the selection state itself is fully functional.
- The Dashboard's "Attention needed → View all" link deep-links to `vendors.html?filter=attention`, which shows critical-**or**-high vendors together — a case the single-select tier chips can't express on their own, handled as a one-time entry-point mode rather than a new persistent filter control.
- Status (lifecycle: Active / Under Review / In Remediation / Pending Intake / Offboarding) is deliberately a separate visual language from risk tier (Critical/High/Medium/Low), since conflating "how risky" with "where it is in its lifecycle" was a real gap in the personas' pre-Tessera spreadsheets.

**Open work:**
- Formalize the semantic status colors (critical/high/medium/low) and the vendor lifecycle-status colors introduced here into `design-system/colors.md`.
- Build out the remaining section views (Assessments, Data Mapping, Remediation queue, Monitoring feed, Policies, Reports, Setup) and wire their nav items (still `href="#"` placeholders).
- A real vendor detail page — every row's "View →" link is currently a placeholder.
- Analyst-specific dashboard variants for Priya and Marcus (this shell currently only shows Dana's view).
- If Figma ever exposes exact spring constants for "Quick" (e.g. via a future API or manual inspection in the desktop app's Interaction panel), swap the approximated `linear()` easing for the precise one.

## `personas/`

Standalone HTML persona artifacts — one page per persona, transcribed in full from the [`../personas/`](../personas) Markdown docs (snapshot, goals, a day in the life, responsibilities, pain points, motivations, tools, compliance frameworks, quote, and "how Tessera helps"), for sharing/viewing as a page rather than reading Markdown. Share `persona.css` for consistent styling; each page is otherwise self-contained. Linked from the root [`../../index.html`](../../index.html) under "Personas," and cross-link to each other via a switcher in the top bar.

- [`dana-vasquez.html`](personas/dana-vasquez.html)
- [`priya-nair.html`](personas/priya-nair.html)
- [`marcus-chen.html`](personas/marcus-chen.html)

**Open work:** the broader Privacy Management persona suite (privacy ops manager, privacy engineer, CISO-overlap, vendor, consumer) still needs both a Markdown doc and a matching artifact page once drafted.
