# Spacing Tokens

An 8px base grid with a 4px half-step for the dense, data-heavy surfaces this product needs (vendor tables, risk registers, evidence review panes). Use the 4px step sparingly — inside compact components (table cell padding, icon gaps) — and default to the 8px steps everywhere else.

```css
--space-0: 0px;
--space-1: 4px;   /* 0.25rem — half-step: icon gaps, dense table cell padding */
--space-2: 8px;   /* 0.5rem  — base unit */
--space-3: 12px;  /* 0.75rem — tight groupings, form field internal padding */
--space-4: 16px;  /* 1rem    — default gap between related elements */
--space-5: 24px;  /* 1.5rem  — gap between distinct components */
--space-6: 32px;  /* 2rem    — section padding, card padding */
--space-7: 48px;  /* 3rem    — gap between major page sections */
--space-8: 64px;  /* 4rem    — large layout gutters */
--space-9: 96px;  /* 6rem    — top-level page/marketing section spacing */
```

## Semantic aliases

Map raw scale steps to purpose so components reference intent, not a magic number:

| Token | Maps to | Use for |
|---|---|---|
| `--space-inset-sm` | `--space-2` (8px) | Padding inside compact controls (chips, tags, small buttons) |
| `--space-inset-md` | `--space-3` (12px) | Padding inside default controls (inputs, buttons) |
| `--space-inset-lg` | `--space-4` (16px) | Padding inside cards, panels |
| `--space-stack-sm` | `--space-2` (8px) | Vertical gap between tightly related items (label → input) |
| `--space-stack-md` | `--space-4` (16px) | Vertical gap between related items (form fields in a group) |
| `--space-stack-lg` | `--space-6` (32px) | Vertical gap between distinct sections |
| `--space-inline-sm` | `--space-2` (8px) | Horizontal gap between icon + label, tags in a row |
| `--space-inline-md` | `--space-4` (16px) | Horizontal gap between buttons in a toolbar |

## Layout

| Token | Value | Use for |
|---|---|---|
| `--layout-gutter` | `--space-6` (32px) | Page-level left/right gutter, desktop |
| `--layout-gutter-mobile` | `--space-4` (16px) | Page-level left/right gutter, small viewports |
| `--layout-max-width` | 1280px | Max content width for dashboard/table views |
| `--radius-sm` | 4px | Inputs, tags, small buttons |
| `--radius-md` | 8px | Cards, panels, modals |
| `--radius-lg` | 12px | Large containers, marketing surfaces |

## Notes / open work

- These are desktop-first values; Tessera's primary users (Dana and her analysts) work in dense, data-table-heavy dashboards on desktop, so mobile is a secondary concern for now — revisit once `prototypes/` covers any mobile/tablet surfaces.
- Component-level spacing (table row height, form field heights) should derive from this scale rather than introducing new one-off values.
