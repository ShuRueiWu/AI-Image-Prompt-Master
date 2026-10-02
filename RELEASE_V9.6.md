# V9.6 — saved work and style coverage

- Draft autosave after 400 ms of inactivity; flush on page hide; restore complete form and language settings on reload. Storage failure is visible. Existing history and user presets remain separate.
- Work JSON export/import uses a versioned, validated format. Preserves subject, title, context, styles, camera settings, sections, text blocks, ratio, quality and language overrides. Import limit is 2 MB; replacement requires confirmation. Custom preset libraries are still managed by the existing preset import/export.
- Advisory conflicts: text-free profiles with text content, multiple pediatric profiles when illustration commands use only one, and photorealistic combined with flat/vector/pixel styles. Reminders can be dismissed or shown again and never block copying.
- Added 124 focused style examples to the existing 189 presets. All 240 selectable styles are covered. The full mapping is generated in STYLE_COVERAGE_V9.6.md.
- Existing preset and historical form loading now fills camera/custom-ratio defaults so exported works remain valid.
- Preset application now resolves both category and key; identical keys in different categories no longer load the wrong preset.

## Verification

`npm test` covers previous V9.5 behavior and V9.6 draft reload, Unicode/multilingual round trip, canceled/invalid import, nested sections, conflict dismissal/restoration, corrupt draft and failed storage. `npm run test:presets` applies every built-in preset and checks style output. `npm run check:site` verifies the deployment entry equals the canonical HTML.

No image model calls. Conflict detection covers the three explicit rules above, not arbitrary semantic contradictions. Drafts are browser/origin-local and depend on available browser storage; JSON export is the portable backup. Historical HTML files remain available and retain their original behavior.
