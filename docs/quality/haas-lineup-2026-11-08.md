# Haas lineup: São Paulo 2026

## Reviewed scope

- [Haas, November 4](https://www.haasf1team.com/news/team-statement-driver-update-0): Rafael Câmara partners Oliver Bearman at São Paulo (November 6–8). Esteban Ocon will not return for Haas in 2026. Later replacement entries remain unconfirmed.
- [Haas, October 31](https://www.haasf1team.com/news/team-statement-driver-update): Ryō Hirakawa replaces Ocon for Mexico only. The existing November 1 manifest exception is unchanged.
- [Official F1 profile](https://www.formula1.com/en/drivers/rafael-camara): Câmara, number 51, Brazil, born May 5, 2005. Local ID `camara`, display code `CAM`, profile slug `rafael-camara`.
- Portrait copied without modification from the official [F1 media asset](https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000001/common/f1/2026/haas/rafcam01/2026haasrafcam01right.webp).

## Identity and eligibility

Driver identities remain independent from race-date eligibility. Ocon's identity, portrait, historical results and saved predictions are retained. No database migration or score reassignment is performed. Both Lock In pages and API validation use the selected race date. Câmara is selectable only on November 8; Ocon is not selectable from Mexico onward. Later rounds omit the unconfirmed second Haas seat and explain why.

Editable saved/local drafts clear ineligible selections with an explanation. Stored predictions are unchanged until the player explicitly saves again. Historical cards and result extraction use the complete identity registry, not the selectable grid.

Jolpica had no Câmara record at verification, including its season driver list and the individual `rafael_camara`/`camara` queries. The manifest therefore does not invent a source ID. A debutant can match only the reviewed full given name, family name and birth date, with accent normalization. Existing source-ID mappings remain exact. Constructor identity checks still run afterward.

The displayed current Haas pairing is Câmara/Bearman. Former entrants are identified on the driver directory; archived profiles do not borrow a new teammate pairing.

## Validation

- TypeScript, ESLint and full unit suite pass: 273 tests, one existing skipped.
- Live `data:sync --check`: zero changes, review items, warnings or failures.
- Regression coverage: every pick slot, dated eligibility, independent board calls, historical identities, immutable draft cleanup, accent/code matching and strict debutant identity matching.
- Mounted browser testing was attempted but blocked by the execution environment: Chromium cannot create its process socket (`Operation not permitted`), including the approved elevated attempt; Next dev also reports `uv_interface_addresses` unavailable. No authenticated production/database actions were performed. Browser interaction and deployed UI still need verification.
