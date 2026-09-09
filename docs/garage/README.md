# Legendary Garage — local implementation

Replaced the Garage route’s procedural car with a curated collection of detailed artist-made exhibits: Max Verstappen’s RB19, Lewis Hamilton’s W11 and Michael Schumacher’s F2004. The W11 exhibit is explicitly the silver launch specification. This is not official team CAD or a claim of exact manufacturing accuracy.

## What changed

- Garage appears in desktop and mobile header navigation, not the footer.
- Three-car selector, large interactive stage, concise driver stories and historical statistics, expandable creator credits, and shareable `?car=` links.
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

The local posters occupy about 288 KiB combined before Next image optimization. Interactive download/render speed depends on the creator’s model, Sketchfab, connection and device. The iframe load event means its document loaded, not that all model textures finished. Third-party failures inside the viewer cannot reliably be detected by the parent page; an original-viewer link remains available. The page has a frame timeout/retry state, but an attempted synthetic browser error event did not exercise it, so that path is not claimed as browser-verified.

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
