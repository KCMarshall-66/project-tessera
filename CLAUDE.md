# Project Tessera — context for Claude

Tessera is a **fictional** AI-assisted cybersecurity SaaS company used as the subject of a design/UX portfolio project. Nothing here refers to a real company, product, or person.

## Core concept

- **Product**: An AI-assisted cybersecurity SaaS platform that helps large enterprises and their privacy teams manage, assess, and continuously monitor third-party vendor risk (replacing static, point-in-time vendor questionnaires with ongoing AI-driven risk signals).
- **Positioning**: Sits at the intersection of cybersecurity, privacy, and third-party/vendor risk management (TPRM) — sold to large companies with dedicated privacy and security/GRC functions.
- **AI angle**: AI assists with things like auto-analyzing vendor security documentation, flagging risk changes/incidents in near real time, drafting/triaging remediation requests, and summarizing vendor risk posture for stakeholders.
- **Primary persona**: Dana Vasquez, Vendor Risk Manager. She has two analysts on her team.
- **Secondary personas**: The broader Privacy Management persona suite (e.g. DPO, Privacy Counsel, Data Governance Lead, Security/GRC partners) who touch vendor risk data or workflows.

## What lives here

- `personas/` — persona docs (goals, pain points, workflows, tools used).
- `empathy-maps/` — one empathy map per key persona, derived from the persona docs.
- `prototypes/` — UI flows/screens, whether linked from Figma or built as code/HTML prototypes.
- `design-system/` — tokens, components, and patterns specific to Tessera's brand and product.
- `brand/` — logo and identity assets.
- `company-profile/` — the fictional Tessera company itself (mission, market position, product suite, org chart).
- `research/` — supporting synthetic research that informs personas/empathy maps.

## Working conventions

- Keep artifacts consistent with each other: persona names, roles, and pain points introduced in `personas/` should be reflected in `empathy-maps/` and referenced in `prototypes/` and `design-system/` where relevant.
- When generating design assets (logos, mockups, prototypes), treat this as original creative work for a fictional brand — do not imitate any real company's branding.
- Favor artifacts as Markdown docs, SVG/HTML, or images checked into the relevant folder so history is trackable via git.
