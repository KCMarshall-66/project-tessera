# Typography Tokens

**Typeface:** [IBM Plex Sans](https://www.ibm.com/plex/) — a natural fit for Tessera: it's IBM's own enterprise/technical typeface family (originally built for IBM's security and cloud products), which reads as precise and trustworthy without being cold. Open source, available via Google Fonts or self-hosted.

**Weights in use:** ExtraLight (200), Regular (400), SemiBold (600) only. No Medium, Bold, or Black — keep the weight palette narrow and let size/spacing/color carry additional hierarchy.

```css
--font-family-base: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

--font-weight-extralight: 200;
--font-weight-regular: 400;
--font-weight-semibold: 600;
```

## Weight usage guidance

| Weight | Token | Use for | Avoid for |
|---|---|---|---|
| ExtraLight (200) | `--font-weight-extralight` | Large display/marketing text only — hero headlines, big stat callouts (≥28px) where a light touch reads as refined. | Body copy, form labels, table text, anything below ~24px — thin strokes lose legibility at small sizes, especially for low-vision users. Never use for functional UI text. |
| Regular (400) | `--font-weight-regular` | Default for all body copy, paragraphs, form values, table data. | — |
| SemiBold (600) | `--font-weight-semibold` | Headings, UI labels, button text, active/selected states, emphasis within body copy, uppercase eyebrow/tag text. | Long-form paragraph text — reserve for shorter, structural text. |

## Type scale

Base size 16px (1rem). Sizes below are desktop defaults; line-heights are absolute px for predictable rhythm and pair with the [spacing scale](spacing.md).

| Token | Size | Line height | Weight | Use for |
|---|---|---|---|---|
| `--text-display` | 48px / 3rem | 56px | ExtraLight | Marketing hero headlines only (not in-product) |
| `--text-h1` | 36px / 2.25rem | 44px | SemiBold | Page titles |
| `--text-h2` | 28px / 1.75rem | 36px | SemiBold | Section headings |
| `--text-h3` | 22px / 1.375rem | 30px | SemiBold | Subsection headings, card titles |
| `--text-h4` | 18px / 1.125rem | 26px | SemiBold | Minor headings, panel titles |
| `--text-body-lg` | 18px / 1.125rem | 28px | Regular | Intro/lede paragraphs |
| `--text-body` | 16px / 1rem | 24px | Regular | Default body copy, table cells, form values |
| `--text-body-sm` | 14px / 0.875rem | 20px | Regular | Secondary text, helper text, dense data tables |
| `--text-caption` | 12px / 0.75rem | 16px | Regular | Timestamps, metadata, fine print |
| `--text-label` | 14px / 0.875rem | 20px | SemiBold | Form labels, button text, nav items |
| `--text-eyebrow` | 12px / 0.75rem | 16px | SemiBold | Uppercase category/status tags — pair with `--tracking-eyebrow` below |

## Letter spacing

| Token | Value | Use for |
|---|---|---|
| `--tracking-tight` | -0.01em | Display/H1 at large sizes, to keep big type from feeling loose |
| `--tracking-normal` | 0 | Default — body, H2–H4 |
| `--tracking-eyebrow` | 0.04em | Uppercase eyebrow labels, status tags, table column headers |

## Notes / open work

- Risk-tiering and status indicators (e.g. Critical/High/Medium/Low vendor risk) will likely pair `--text-eyebrow` with the semantic colors to be added in [`colors.md`](colors.md) — define that pattern when building the component library.
- Mobile/responsive scale (likely `--text-h1` → ~28–32px on small viewports) still needs to be defined once `prototypes/` work starts.
- No italic styles defined — add only if a real use case emerges (e.g. quoting external audit language).
