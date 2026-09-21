# Components

The components that exist in the working prototype, with where each is defined and the rules it follows. Every one is rendered live on the [style guide](index.html). Shared styles live in `prototypes/app-shell/`: `shell.css` (shell, cards, pills), `components.css` (chips, tags, row buttons, KPI text, table footers, age bar), `scan.css` (mosaic and signal flow), `ai-chat.css` (Tessera AI chat), and `dashboard-ui.css` (popover, toast, drawer, analyst panels).

## Cards

| Component | Class | Notes |
|---|---|---|
| Faded card | `.stat-card`, `.panel` | The container for everything. See [`card.md`](card.md). |
| KPI tile | `.stat-card` | Label (eyebrow), big number, trend line, one supporting line, and the AI sparkle. The trend is coloured `bad`, `good` or `warn`, always with an arrow or a word. |
| Panel | `.panel` + `.panel__head` + `.panel__body` | Title left, one line of subtitle right. Panels with an AI sparkle add `has-ai` so content clears the corner button. |

## Controls

| Component | Class | Notes |
|---|---|---|
| Primary button | `.btn-primary` | The one main action on a page. |
| Approval buttons | `.ai-btn--primary`, `.ai-btn--ghost` | Used in popovers, proposals and drawers. Ghost is the alternative ("Not now", "Cancel"). |
| Row button | `.btn-row` | An action inside a table row: Assign, Open, Nudge, Escalate. `data-act` says which. Disabled once done ("Nudged"). |
| Link button | `.link-btn` | Low-emphasis switches such as "View as table". |
| Filter chip | `.chip`, `.chip.active` | A pill with a bold label and a count. The active chip is filled with ink. Counts are portfolio totals; the list is a sample. |
| AI sparkle | `.ai-spark` | 28px hit area, 16px icon, bottom-right of a card. Opens Tessera AI for that card. Has an `aria-label` naming the card. |

All controls share the same focus style: a 2px `--blue-accent` ring with a 2px offset.

## Status and identity

| Component | Class | Notes |
|---|---|---|
| Status tag | `.tag` + `.t-new` `.t-crit` `.t-stale` `.t-wait` `.t-work` `.t-routine` | Describes state. Always has an icon or word. |
| Severity pill | `.pill` + `.critical` `.high` `.medium` `.low` | Describes severity or vendor tier. |
| Count pill, badges | `.count-pill`, `.fw-badge`, `.doc-badge`, `.pg` | Small counts, regulatory framework, document type, and the page an exception is on. |
| Avatar chip | `.avatar-chip`, `.avatar-chip.un` | Initials in a circle; a dashed circle with "?" means unassigned. |

## Data display

| Component | Class | Notes |
|---|---|---|
| Task table | `table.vendor-table` (+ `.attn`) | Issue, vendor and tier, status, age against SLA, owner, risk impact, action. Unassigned first, then by risk impact. Age turns red once past its SLA. |
| Table footer | `.table-foot` | "Showing N of M". |
| Task age bar | `.aging` + `.aglbl` | Five buckets, green to dark red, with a number in each. |
| Vendor mosaic | `.mosaic`, `.tile` | One tile per vendor. States: clear, open finding, critical, and a glowing "just flagged". A scan line tints tiles as it passes. |
| Signal flow | `.flow` | Six public-internet sources converge on the mark and leave as a task. |
| Workload bar | `.mbar` | Verifying, with vendor, in review, past SLA. Counts are always written out beside it. |

## Overlays

| Component | Class | Notes |
|---|---|---|
| Popover | `.dash-pop` | A choice or a confirmation for one action, anchored to its button. Esc or an outside click closes it. |
| Toast | `.dash-toast` | Confirms what just happened. Bottom centre, 4 seconds. |
| Detail drawer | `.dash-drawer` | A native `<dialog>` from the right. What Tessera found, why it matters, a timeline, and the actions that apply. |
| Tessera AI chat | `.ai-dialog` | A native `<dialog>`. See the AI patterns below. |

## AI patterns

The chat and the actions it can take follow these rules, which come from the human-oversight and explainability expectations in [`../compliance/README.md`](../compliance/README.md):

1. **Scoped.** The chat opens with the figures of the card it was opened from.
2. **Propose, then approve.** An action shows exactly what will change and waits for a click. "Not now" changes nothing.
3. **Explainable.** Scores, calls and actions say why, with the numbers.
4. **Overrides need a reason,** and the reason is kept.
5. **Honest about limits.** The footer says it can be wrong, and a question it cannot answer says so and lists what it can.

## Accessibility notes

- Dialogs are native `<dialog>` elements: focus is trapped, Esc closes, and focus returns to what opened them.
- Status is never colour alone.
- Chat messages sit in a live region.
- Every animation is off under `prefers-reduced-motion`.
- Known contrast gaps are listed in [`colors.md`](colors.md#known-contrast-gaps).
- Not yet done: a keyboard route into the vendor mosaic (tiles show a name on hover only).
