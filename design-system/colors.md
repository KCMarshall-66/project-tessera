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

## Status colours

Read from the app (`prototypes/app-shell/shell.css`). These are **fill** colours: dots, bars, tile fills, pill backgrounds. They are not text colours.

| Token | Hex | Use | Contrast on white |
|---|---|---|---|
| `--status-critical` | `#D64545` | Critical severity, critical signal tile, critical count tile | 4.4:1 |
| `--status-high` | `#E0883C` | High severity, "high" signal tile | 2.7:1 |
| `--status-medium` | `#D9B23C` | Medium severity, open-finding tile | 2.0:1 |
| `--status-low` | `#3FA873` | Low severity, "OK" | 3.0:1 |

Two text colours were added for small status text on light surfaces, and are in use today:

| Token (proposed) | Hex | Use | Contrast on white / canvas |
|---|---|---|---|
| warning text | `#B5651C` | Orange text ("Past SLA", risk impact under 0.8) | 4.3:1 / 3.9:1 |
| good text | `#2C7D54` | Green text (falling score, "OK" trends) | 5.0:1 / 4.5:1 |

Status is never colour alone. Every tag pairs colour with an icon or a word ("Past SLA", "Critical", "New", "Waiting on vendor").

### Known contrast gaps

Found while documenting the palette (2026-09-21). Not yet fixed in the UI.

- **Critical red as small text** (`#D64545`) is 4.4:1 on white and 3.9:1 on the canvas, under the 4.5:1 needed for normal text. It is used for trend text, risk impact, and past-SLA ages. Recommended: `--status-critical-text: #B53A3A` (5.8:1 on white, 5.2:1 on canvas).
- **Warning text** (`#B5651C`) is 4.3:1 on white. Recommended: `#A85E1A` (4.9:1 on white, 4.4:1 on canvas; use `#9F5817` if it must clear 4.5:1 on the canvas).
- **White numbers on the orange and green age-bar segments** are 2.7:1 and 3.0:1. Recommended: ink numbers on those two segments, as the yellow one already does.
- **White on the critical red** (the count tile, "New" chips on dark) is 4.4:1. Passes only as large text; the darker red above fixes it.
- **Nav group labels** (`#5A6C8A` on `#131929`) are 3.3:1. Recommended: `#7B8CA8` or lighter.
- **Fills as graphics** need 3:1 against their neighbours. The medium yellow (2.0:1 on white) relies on its label, and always appears next to one.

## Product sets

| Set | Values | Use |
|---|---|---|
| Nav | `#131929` (fill), `#1D2740` (raised), `#96A7C2` (text, 7.2:1), `#F3F6FC` (active text) | Sidebar and dark panels |
| Vendor mosaic tiles | clear `#D6E0EB` (`--tile-clear`), open finding = `--status-medium`, critical = `--status-critical` | The 612-vendor scan mosaic |
| Task age bar | `#3FA873`, `#D9B23C`, `#E0883C`, `#D64545`, `#8F2A2A` (0–3, 4–7, 8–14, 15–30, 30+ days) | The oldest bucket is a deeper red so it stays distinct for colour-blind users |

## Notes / open work

- This is a **brand palette** plus the product colours above, not yet a full **UI colour system** — still needed: a full neutral gray scale (10 steps) built out from `--tessera-ink`/`--tessera-muted`, text-safe variants of the status colours (see the known gaps above), and dark-mode surface colours.
- Given Tessera positions itself on trust/compliance (see [`../compliance/`](../compliance)), verify all text/background pairings meet WCAG 2.1 AA contrast (4.5:1 for body text) before use in `prototypes/`.
- `--tessera-blue-primary` (#2F62AA) on white measures ~6.1:1 contrast — passes WCAG AA for normal text (needs 4.5:1) and AA for large text/UI components, though not quite AAA normal text (7:1). Re-check against the final UI background, not just white.
