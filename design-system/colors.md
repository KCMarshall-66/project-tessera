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

Read from the app (`prototypes/app-shell/shell.css`). The status colours are **fills**: dots, bars, tile fills, pill backgrounds. Text has its own, darker tokens so it passes WCAG AA on white, on the canvas, and on its own tinted background.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--status-critical` | `#C43F3F` | Critical fills: signal tile, count tile, bars, badges | White text on it: 5.1:1 |
| `--status-critical-text` | `#B03737` | Red text, and text on the light red tint | 6.1:1 on white, 5.5:1 on canvas, 4.8:1 on its tint |
| `--status-high` | `#E0883C` | High severity fills | Ink text on it: 4.9:1 |
| `--status-warn-text` | `#8F4F12` | Orange text ("Past SLA", risk impact under 0.8, cross-border) | 6.4:1 on white, 5.7:1 on canvas, 5.1:1 on its tint |
| `--status-medium` | `#D9B23C` | Medium severity, open-finding tile | Ink text on it: 6.5:1. Pill text `#7A6316`. |
| `--status-low` | `#3FA873` | Low severity, "OK" fills | Pill text `#28734D` |
| good text | `#2C7D54` | Green text (falling score, "OK" trends) | 5.0:1 on white, 4.5:1 on canvas |

Status is never colour alone. Every tag pairs colour with an icon or a word ("Past SLA", "Critical", "New", "Waiting on vendor").

### Contrast audit (2026-09-21)

Every text element on the app pages (the Dashboard for all three roles, Vendors, Assessments, Data Mapping, Monitoring & Alerts, and the drawer, popover, toast and chat) was measured against white, the canvas and its own tint. Nothing is under 4.5:1 for normal text or 3:1 for large text. Before this pass, these were under:

| Was | Now |
|---|---|
| Critical red text `#D64545`: 4.4:1 on white, 3.9:1 on canvas | `#B03737` text; the fill is `#C43F3F` |
| White on the critical fill (count tile, badges): 4.4:1 | 5.1:1 |
| Warning text `#B5651C`: 4.3:1 on white | `#8F4F12` |
| Orange text on the light orange tint (High pill, cross-border): about 2.4:1 | `#8F4F12` |
| White numbers on the orange and green age-bar segments: 2.7:1 and 3.0:1 | Ink on orange; the green segment is `#2C7D54` |
| Medium pill text `#93791f`: 3.8:1 on its tint | `#7A6316` |
| "New" tag and page chips, blue on blue tint: 4.2:1 | Blue dark, 5.4:1 |
| "Waiting on vendor" tag text: 4.3:1 | `#4E5E70`, 5.3:1 |
| Nav group labels `#5A6C8A`: 3.3:1 | `#7B8CA8`, 5.1:1 |
| Vendor name tag on a "high" flag, white on orange: 2.7:1 | Ink text |

The same audit was run on the index, brand and style guide pages, the persona pages, the competitive analysis (two badge colours were 4.4:1, now darker) and the scanning explorations (the large option numbers were 2.8:1, now 3.8:1). Not covered: graphics (the yellow tile is 2.0:1 on white, but always sits beside a label), and keyboard access to the vendor mosaic, which shows names on hover only.

## Product sets

| Set | Values | Use |
|---|---|---|
| Nav | `#131929` (fill), `#1D2740` (raised), `#96A7C2` (text, 7.2:1), `#F3F6FC` (active text) | Sidebar and dark panels |
| Vendor mosaic tiles | clear `#D6E0EB` (`--tile-clear`), open finding = `--status-medium`, critical = `--status-critical` | The 612-vendor scan mosaic |
| Task age bar | `#2C7D54` (white numbers), `#D9B23C` and `#E0883C` (ink numbers), `#C43F3F`, `#8F2A2A` (white numbers) for 0–3, 4–7, 8–14, 15–30, 30+ days | The oldest bucket is a deeper red so it stays distinct for colour-blind users |

## Notes / open work

- This is a **brand palette** plus the product colours above, not yet a full **UI colour system** — still needed: a full neutral gray scale (10 steps) built out from `--tessera-ink`/`--tessera-muted`, dark-mode surface colours.
- Given Tessera positions itself on trust/compliance (see [`../compliance/`](../compliance)), verify all text/background pairings meet WCAG 2.1 AA contrast (4.5:1 for body text) before use in `prototypes/`.
- `--tessera-blue-primary` (#2F62AA) on white measures ~6.1:1 contrast — passes WCAG AA for normal text (needs 4.5:1) and AA for large text/UI components, though not quite AAA normal text (7:1). Re-check against the final UI background, not just white.
