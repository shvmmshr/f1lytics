# Legendary Garage — local implementation

Replaced the Garage route’s procedural car with a curated collection of detailed artist-made exhibits: Max Verstappen’s RB19, Lewis Hamilton’s W11 and Michael Schumacher’s F2004. The W11 exhibit is explicitly the silver launch specification. This is not official team CAD or a claim of exact manufacturing accuracy.

## What changed

- Garage appears in desktop and mobile header navigation, not the footer.
- Nine-car selector, large interactive stage, concise driver stories and historical statistics, expandable creator credits, and shareable `?car=` links.
- Local optimized WebP previews load first. No Sketchfab frame or request is made until Explore in 3D is selected.
- At most one viewer is mounted; switching cars or closing the exhibit removes it. Closing restores focus. Automatic rotation is disabled.
- Model IDs are selected only from the local catalog. Unknown car parameters fall back to RB19; all variants canonicalize to `/garage`.
- Garage metadata and sitemap coverage added; privacy page explains the optional third-party viewer.
- Original procedural scene files remain in the repository but are not imported by the new Garage route. No dependency was added for this change.

## Sources and limitations

| Exhibit | Creator and interactive source | Historical source |
| --- | --- | --- |
| RB19 | [Redgrund](https://sketchfab.com/3d-models/oracle-red-bull-f1-car-rb19-2023-e4afe46f3aab4b23a418da06fc163821), CC BY 4.0 | [Honda](https://global.honda/en/F1/machine/2023_RedBullRB19/) |
| W11 | [attix84work](https://sketchfab.com/3d-models/f1-mercedes-w11-2020-aeb8ed9bd3e24741a3b06029e8454d54), creator-hosted editorial exhibit | [Mercedes](https://www.mercedesamgf1.com/news/mercedes-ends-2020-f1-season-with-a-double-podium-finish) |
| F2004 | [Dave Love SketchFab](https://sketchfab.com/3d-models/2004-ferrari-f2004-827e64acecba4f008759ae30a5bfeecc), CC BY 4.0 | [Ferrari](https://www.ferrari.com/en-CA/corse-clienti/articles/f2004-returns-to-site-of-memorable-one-two) |

The model geometry/textures remain hosted on Sketchfab using its embedded viewer. No paid model was purchased, downloaded or rehosted. Public thumbnail previews were resized to WebP; source metadata is retained in `model-sources.json`. Embedding does not establish standalone model ownership or blanket commercial reuse rights.

The four September 12 additions occupy about 137 KiB combined before Next image optimization; only thumbnails and the selected exhibit preview load initially. Interactive download/render speed depends on the creator’s model, Sketchfab, connection and device. The iframe load event means its document loaded, not that all model textures finished. Third-party failures inside the viewer cannot reliably be detected by the parent page; an original-viewer link remains available. The page has a frame timeout/retry state, but an attempted synthetic browser error event did not exercise it, so that path is not claimed as browser-verified.

## Verification

- `CI=true pnpm typecheck` and `CI=true pnpm lint`: passed.
- `CI=true pnpm test`: 122 passed, 1 skipped; includes catalog selection and asset/source integrity checks.
- Production build: passed (`build.log`), with expected optional upstream failures handled by existing fallbacks. Lock In environment flags were disabled for verification only.
- SEO crawl: 95 sitemap URLs and 97 targets passed (`seo-check.log`).
- Browser checks at 320, 375, 768, 1280 and 1440 CSS pixels: no horizontal page overflow; header Garage entry visible on desktop and available in the mobile menu.
- All three remote models visually rendered. RB19 was also inspected inside the mobile Garage stage.
- Initial Garage: zero iframes and zero Sketchfab resource requests. Explore mounts one frame; closing and switching remove it.
- Keyboard Tab/Enter car selection and focus return on close passed. Back restored W11 after selecting F2004 without opening a frame. Invalid car URL rendered RB19 with the correct canonical.

All changes are local. Nothing was pushed or deployed, and the predictions game was not changed in this Garage pass.

## Collection expansion

Added Ayrton Senna’s 1988 MP4/4 by Kenkento3D and Nigel Mansell’s 1992 FW14B by Flamestroke. Both use creator-hosted embeds only; an empty license record is not interpreted as a download or commercial reuse license. The MP4/4 creator notes incomplete cockpit/engine interiors. See the central model-sources.json registry for model and preview provenance.

## September 12 collection expansion

Added four more cars after the shared UI fixes:

| Car | Featured champion | Viewer / attribution | Historical source |
| --- | --- | --- | --- |
| 2013 Red Bull RB9 | Sebastian Vettel, #1 | [JUSTGAME](https://sketchfab.com/3d-models/red-bull-rb9-3c44792002c94d3887ebdce30cfec797), CC BY 4.0 | [Red Bull Racing](https://www.redbullracing.com/int-en/cars/rb9) |
| 2009 Brawn BGP 001 | Jenson Button, #22 | [Dave Love SketchFab](https://sketchfab.com/3d-models/2009-brawn-gp-4c02d48be0104a79b657e732890e6d54), CC BY 4.0 | [Formula 1 / Ross Brawn](https://www.formula1.com/en/latest/article/exclusive-from-trendsetters-to-title-winners-ross-brawn-reveals-his.6FIAnV6e71kvi8PVInIuPo) |
| 2005 Renault R25 | Fernando Alonso, #5 | [Dave Love SketchFab](https://sketchfab.com/3d-models/2005-renault-r25-0d58fe125f5b41a2b8482576723120c4), CC BY 4.0 | [Formula 1](https://www.formula1.com/en/latest/article/alonso-to-run-title-winning-renault-r25-in-abu-dhabi-to-celebrate-the-teams.5e69LF1WmuVtINpTKlpGtd) |
| 1998 McLaren MP4/13 | Mika Häkkinen, #8 | [jormapaappa1235](https://sketchfab.com/3d-models/mclaren-mp4-13-1998-a1a85be6c06f4c93b67da7e12693c978), creator-hosted exhibit | [McLaren](https://www.mclaren.com/racing/heritage/formula-1/cars/mp4-13/) |

The selector is now a single scrollable row at every width, with arrow controls and the selected car centred on entry. Nine cards do not create a second row above the stage. Counts derive from the catalog; existing query links and RB19 fallback remain stable. The new posters use local 1024px WebP files, with Next image sizing for the small thumbnails. No 3D library or dependency was added.

Untextured candidate models were rejected. The selected MP4/13 wears Häkkinen’s number 8, rather than the alternative number 7 Coulthard model. Detailed source and license responses are in `model-sources.json` and the four individual source files. An empty license record is kept as creator-hosted, never described as a commercial asset license.

### Responsive stat-panel follow-up

The stat block now uses the article’s **container width**, not the browser width. Narrow panels (phones and the desktop sidebar) use aligned label/value rows; a panel at least 600px wide uses three columns. This fixes the uneven wrapping reported on the R25 screenshot. Checked all four additions at 320, 390, 600, 768, 1024 and 1440px: 24 layouts, no document overflow or clipped stat labels. Screenshots: `docs/quality/r25-panel-{390,768,1440}.png`; measurements: `docs/quality/garage-expanded-viewports.json`.

Catalog, asset, source provenance and selection tests pass. Typecheck and lint pass. The final production build is recorded in `docs/quality/ui-garage-responsive-build.log`. Local Chrome screenshots were used after collaborative preview capture became unreliable; a temporary browser-profile socket caused one build attempt to fail, and that profile was removed before retrying. No source configuration or dependency was changed to work around it.

All four added models rendered in their real embedded viewers during local checks. The final responsive build passed, and the temporary browser profiles were removed. No changes were pushed.
