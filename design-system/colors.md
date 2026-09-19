# Color Tokens

Seeded from [`../brand/logos/tessera-color-logo.png`](../brand/logos/tessera-color-logo.png) by sampling its dominant pixel colors. These are a starting palette — treat as draft until validated for accessible contrast in real UI contexts (see notes below).

## Brand blues

| Token | Hex | Source in logo |
|---|---|---|
| `--tessera-blue-dark` | `#255292` | Cube's left/shadowed face — darkest brand blue. Good for headers, primary text on light backgrounds, dark-mode surfaces. |
| `--tessera-blue-primary` | `#2F62AA` | Cube's mid face — the core brand blue. Primary buttons, links, active states. |
| `--tessera-blue-accent` | `#689AE2` | Node dots + connecting lines — a brighter, more saturated blue. Good for highlights, focus states, data-viz accents. |
| `--tessera-blue-light` | `#B0CAEF` | Cube's top/lit face — soft tint. Good for subtle backgrounds, hover states, chart fills. |
| `--tessera-blue-tint` | `#C6D9F4` | Lightest sampled tint. Good for selected-row backgrounds, badges. |

## Neutrals

| Token | Hex | Source |
|---|---|---|
| `--tessera-ink` | `#26313D` | Body text color — a dark blue-gray (not pure black) that stays in the brand's blue family. Used for headings/body text in `personas/` Figma artifacts. |
| `--tessera-muted` | `#5B6B7C` | Secondary text (subtitles, metadata, captions). |
| `--tessera-gray` | `#C9C9C9` | Wordmark color. Too light for body text — use `--tessera-ink`/`--tessera-muted` instead; reserve this one for disabled states, dividers, or icon-only contexts. |

`--tessera-ink` and `--tessera-muted` were introduced while building the first persona card graphics (see [`../personas/`](../personas), Figma file) and fill the gap flagged below.

## Surfaces and borders

Read from the Figma dashboard frame (node `7:665`), not sampled from the logo.

| Token | Hex | Use |
|---|---|---|
| `--tessera-canvas` | `#EFF3F7` | Page background. Cards fade into this at their top edge, so it has to match the design for the [card](card.md) to look right. |
| `--tessera-surface` | `#FFFFFF` | Card and input fill. |
| `--tessera-border` | `#E2E5EC` | Borders on cards and inputs (the mock's search boxes use the same value), plus table dividers. |

The app previously used `#F6F8FB` for the canvas and `#E5E9EF` for borders; both were replaced with the values above when the card spec landed.

## Notes / open work

- This is a **brand palette**, not yet a full **UI color system** — still needed: a full neutral gray scale (10 steps) built out from `--tessera-ink`/`--tessera-muted`, semantic colors (success/warning/danger/info), and dark-mode surface colors.
- Given Tessera positions itself on trust/compliance (see [`../compliance/`](../compliance)), verify all text/background pairings meet WCAG 2.1 AA contrast (4.5:1 for body text) before use in `prototypes/`.
- `--tessera-blue-primary` (#2F62AA) on white measures ~6.1:1 contrast — passes WCAG AA for normal text (needs 4.5:1) and AA for large text/UI components, though not quite AAA normal text (7:1). Re-check against the final UI background, not just white.
