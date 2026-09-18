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
- Sidebar is a dark, floating "console" surface (not flush to the viewport edge) with a faint node/constellation texture echoing the logo's network motif — deliberately distinct from a flat, flush-left enterprise sidebar.
- Uses `design-system/colors.md`, `typography.md`, and `spacing.md` tokens throughout; introduced first-draft semantic status colors (critical/high/medium/low) not yet formalized in `colors.md` — see Open work below.
- The nav logo currently reuses the light-background color logo cropped into a light chip, since no dark/reversed logo variant exists yet (tracked in `brand/logos/README.md`).

**Open work:**
- Formalize the semantic status colors (critical/high/medium/low) introduced here into `design-system/colors.md`.
- Build out the individual section views (Vendors list, Assessments, Data Mapping, Remediation queue, Monitoring feed, Policies, Reports, Setup).
- Analyst-specific dashboard variants for Priya and Marcus (this shell currently only shows Dana's view).
