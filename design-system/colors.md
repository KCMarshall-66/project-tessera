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

| Token | Hex | Source in logo |
|---|---|---|
| `--tessera-gray` | `#C9C9C9` | Wordmark color. Works as a secondary/muted text or icon color — likely too light for body text; needs a darker neutral (e.g. `#4A4A4A`–`#2A2A2A`) added for accessible body copy once typography is chosen. |

## Notes / open work

- This is a **brand palette**, not yet a full **UI color system** — still needed: a neutral gray scale (10 steps), semantic colors (success/warning/danger/info), and dark-mode surface colors.
- Given Tessera positions itself on trust/compliance (see [`../compliance/`](../compliance)), verify all text/background pairings meet WCAG 2.1 AA contrast (4.5:1 for body text) before use in `prototypes/`.
- `--tessera-blue-primary` (#2F62AA) on white measures ~6.1:1 contrast — passes WCAG AA for normal text (needs 4.5:1) and AA for large text/UI components, though not quite AAA normal text (7:1). Re-check against the final UI background, not just white.
