# Card

The faded card: the container used for stat cards and content panels across the app. It fades in from the page background at its top edge and resolves to a solid white, bordered base.

**Source:** Figma node `19:1232` ("faded-card"), file `tessera`. All four dashboard stat cards in the mock use the identical spec.

## Spec

| Property | Value |
|---|---|
| Fill | Linear gradient, top to bottom: `rgba(255,255,255,0)` at 0% to `#FFFFFF` at 100% |
| Border | `1px solid #E2E5EC` on the left, right, and bottom only. **No top border.** |
| Radius | `15px` on the bottom corners only. **Top corners are square.** |
| Shadow | None |
| Reference size | 255 × 143 |

The transparent top is the point: the card has no visible top edge, so it reads as rising out of the page rather than sitting on it. That means the result depends on the page colour behind it, which is why `--tessera-canvas` matches the mock's `#EFF3F7` (see [`colors.md`](colors.md)).

## Implementation

```css
:root {
  --card-radius: 15px;
  --card-fade: 143px;   /* the spec card's height */
}

.stat-card,
.panel {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0, #FFFFFF min(100%, var(--card-fade)));
  border: 1px solid var(--surface-border);   /* #E2E5EC */
  border-top: 0;
  border-radius: 0 0 var(--card-radius) var(--card-radius);
}
```

Lives in [`prototypes/app-shell/shell.css`](../prototypes/app-shell/shell.css), applied through the shared `.stat-card` and `.panel` classes, so every card on the Dashboard, Vendors, Assessments, and Data Mapping pages picks it up.

## Decisions beyond the spec

- **Tall cards fade over the reference depth, not their full height.** The spec was drawn at 143px. A literal full-height gradient on a 1,500px vendor table would leave the first several hundred pixels of rows nearly transparent. `min(100%, var(--card-fade))` fades a card over 143px and holds solid white below that. Cards at or below 143px (the stat cards) fade across their whole height, which is exactly the spec.
- **Dark surfaces are out of scope.** The white-fade spec doesn't apply to the dark data-flow hero on Data Mapping, which keeps its own treatment. This was tried and deliberately rolled back (2026-09-19): the hero is not meant to match the cards.
- **Investigation task cards on the Dashboard** use the same spec (`.scan-panel--open .scan-task` in `scan.css`), since they sit directly on the canvas. On Monitoring & Alerts they stay dark inside the flow panel.
- **Not yet applied outside the app.** The prototype index cards, persona pages, and research page keep their earlier card style.

## Open work

- The mock only designs the stat cards. If panels should differ (for example, a different fade depth for short lists), that needs its own spec.
