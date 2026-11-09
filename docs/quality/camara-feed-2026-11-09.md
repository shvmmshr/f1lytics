# Câmara source identity reconciliation, 9 November 2026

## Evidence

- [Failed reference refresh](https://github.com/shvmmshr/f1lytics/actions/runs/42608980419) applied zero changes. Typecheck, lint and 273 tests passed; the identity review gate flagged `rafael_camara`.
- [Jolpica's latest race](https://api.jolpi.ca/ergast/f1/2026/last/results.json), read 9 November, is São Paulo dated 2026-11-08. Its Câmara driver object contains only `driverId: rafael_camara`, `givenName: Rafael`, `familyName: Camara`. The race entry supplies number 51 and constructor Haas. DOB, code and permanent number are absent. The individual driver and standings endpoints have the same incomplete identity.
- [Official F1 race classification](https://www.formula1.com/en/results/2026/races/1299/brazil/race-result) confirms Rafael Câmara, Haas, number 51, P20, 69 laps and zero points.
- [Official profile](https://www.formula1.com/en/drivers/rafael-camara) confirms number 51 and DOB 5 May 2005. Its [season results](https://www.formula1.com/en/results/2026/drivers/RAFCAM01/rafael-camara) corroborate that race.

## Decisions

Map the now-published source ID to the existing local `camara` identity. Do not relax the full-identity fallback for unreviewed debutants. If a classification omits the permanent number, preserve the already reviewed number only when the race-entry number corroborates it. Never promote a different race-entry number into a permanent reference, and reject invalid or conflicting numbers.

Use reviewed identity mapping for display readers rather than fabricating missing fields in the source payload. Keep unknown entrants and source result rows. This does not edit saved picks, settlements, race outcomes, calendars or eligibility. Câmara remains eligible only for 2026-11-08. Ocon history and the dated Mexico Hirakawa substitution remain intact. No later Haas appearances are inferred.

## Validation

Typecheck, lint and the full suite pass: 299 tests passed, one existing integration test skipped. New coverage exercises actual incomplete payloads, server-rendered directory/profile/team/standings readers, unknown-entrant preservation, source-ID alignment, invalid/conflicting numbers, and unchanged dated eligibility. The live reference check reports zero changes, review items, warnings or failures (digest d3840545c9199b0b). No database actions or historical migrations are part of this change.
