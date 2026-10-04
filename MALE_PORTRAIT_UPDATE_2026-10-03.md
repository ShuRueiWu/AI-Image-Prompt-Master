# Male clinician and portrait update — 2026-10-03

## Canonical change

The canonical preset source is `Prompts Builder V9.6.html` (`BUILTIN_PRESETS`). The four presets below now explicitly use an adult male subject in both Chinese and English UI descriptions/prompts:

- `layout_vogue_cover`: confident male surgeon; section visual also says male surgeon.
- `friendly_staff`: friendly Taiwanese adult male doctor (no longer doctor-or-nurse ambiguity).
- `med_consult`: adult male doctor consulting a patient.
- `photo_film_portra`: young adult male photographic portrait.

Other realistic doctor portraits already specifying a male subject (including `complex_magazine_spread`) remain unchanged. Non-photographic female anime/illustration presets are outside this request.

## Codex instructions

1. Use the exact prompt copied from the updated UI for each of the four presets; do not hand-edit generation prompts.
2. Regenerate only Codex's four corresponding reference images with built-in Codex image generation. Keep original generated dimensions and format in `preset-originals/codex/`; preserve the prior originals as versioned siblings before replacing the active references. Rebuild only the corresponding Codex WebP previews and map entries.
3. Update only Codex's manifest/report and the shared prompt snapshot/map as required. Do not write AGY originals or AGY manifest.
4. Maximum 8 Codex image calls for this update (four initial calls plus at most one retry per failed preset), parallelism 1. Stop immediately on quota/rate-limit or safety refusal; never use a paid API key.
5. Run `npm test`, `npm run test:presets`, and `npm run check:site`. Do not push.

## AGY instructions

Task `prompt-master-preset-images-agy-20261002` remains owned by AGY. Its current weekly quota is exhausted; wait until the reported reset time, then resume using the current `BUILTIN_PRESETS` and regenerate only these four presets. Use AGY's built-in `generate_image` only; never use API keys, SDKs, curl, or paid endpoints. Keep original dimensions and format; preserve old AGY originals as versioned siblings; update only AGY's own manifest/report after successful local saves. Do not touch Codex assets or manifest. The AGY image-generation and manifest work must remain with AGY.

The AGY manifest's prior hashes for these four presets will be stale until AGY regenerates them. Do not represent those existing images as matching the updated prompts. Preserve other AGY progress and continue its remaining presets from its manifest after quota reset.

## Current state

- Prompt source edit: applied locally; sync `index.html` via `npm run sync:site` after validation.
- Codex four-image regeneration and associated manifest/report updates: pending in this task.
- AGY four-image refresh and remaining image batch: pending AGY quota reset.
- No push authorized.
