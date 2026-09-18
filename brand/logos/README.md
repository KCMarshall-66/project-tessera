# Logos

Logo files and identity assets for the Tessera brand.

## Files

- **`tessera-color-logo.png`** — primary full-color logo (raster). An isometric faceted cube (dark navy → primary blue → light blue faces) with small connected "node" dots radiating off its vertices, evoking a data/network mesh — paired with a bold gray "TESSERA" wordmark. Colors sampled into [`../../design-system/colors.md`](../../design-system/colors.md).
- **`tessera-mark.svg`** — the cube mark alone, vector, full detail. Exported from the Figma nav component (node 7:370, "logo-navigation / Default"). Use wherever the full-color logo's raster crop was previously being used as a stopgap.
- **`tessera-mark-condensed.svg`** — a simplified/re-drawn variant of the cube mark, purpose-built for small icon-only contexts (e.g. a collapsed nav rail). Not a CSS crop of `tessera-mark.svg` — a distinct asset with fewer facets, exported from Figma node 7:372 ("condensed" variant). Use whenever the mark renders below ~90px.
- **`tessera-wordmark.svg`** — the "TESSERA" wordmark alone, vector (exported from Figma node 7:306).
- **`tessera-tagline.svg`** — the tagline lockup, vector: **"Intelligent Third-party Governance."** This is the first appearance of official tagline copy for the product (surfaced via the nav component in Figma, node 7:314) — see the note in [`../../company-profile/README.md`](../../company-profile/README.md).

All four SVGs above are dark-on-transparent by default reference (as authored for a dark nav rail) — check contrast before reusing on a light surface.

## Still needed

- Monochrome / single-color version of the full lockup (for watermarks, favicons)
- Light-background variant of `tessera-mark.svg`/`tessera-wordmark.svg` if the dark-nav originals don't read well on white (spot-check before reuse)
- Favicon-sized icon mark
- Minimum clear-space and minimum-size usage guidelines
