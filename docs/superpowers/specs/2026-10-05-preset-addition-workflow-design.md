# Preset Addition Workflow Design

Date: 2026-10-05  
Project: AI Image Prompt Master

## Problem

Adding a preset currently mixes editorial choices (which browse group and reusable styles) with reference-image production and a full browser run over all 308 presets. Purpose filtering is inferred from words in the group, name, description, and styles. Preset group/key pairs also participate in favorites, recent-use identity, and image lookup, so moving a preset can require rekeying dependent records.

The workflow should make a new preset easy to classify and validate without weakening release checks or forcing reference-image generation to block content work.

## Options considered

1. **Checklist only.** Document how to pick a group and styles. This is the smallest change, but it cannot catch invalid style values, duplicate keys, or missing image-state declarations before browser tests.
2. **Checklist plus fast static checker and explicit metadata (recommended).** Keep the current source and preset structure. Require new presets to declare a purpose and reference-image state, lint them before browser tests, then retain the existing full suite for release. This adds a small checker and a short guide without migrating the 308 existing presets.
3. **Move all presets into a separate catalog with normalized stable IDs.** This would separate identity from category and source code, but requires broad data migration, image-map updates, and favorites/recent compatibility work. Defer until there is a demonstrated need for editing presets outside the canonical HTML.

## Recommended design

### Classification

- Give each preset one primary browse group based on the user's main task or intended output. Reuse an existing group when it fits; do not create a group for a single preset.
- Keep browse group and purpose as separate concepts. Add an explicit `purpose` enum for newly authored built-in presets: `medical`, `photo`, `product`, `design`, or `general`.
- Existing presets and imported custom presets keep their current inferred-purpose fallback. New built-ins must declare `purpose`, so new classification does not depend on matching words in prose.
- Choose styles from the existing style list. Add a style only when it names a reusable visual treatment or medium that can apply across subjects, not a one-off subject, scene, or layout. Every newly added style must have a preset example and pass style coverage.
- Use semantic, stable preset keys. Do not derive keys from array positions. Avoid moving existing presets between groups as routine cleanup because current persisted identities include group/key.

### Reference-image state

New built-in presets must declare `referenceImageStatus` as one of:

- `ready`: at least one mapped reference image is expected; all mapped images must load.
- `pending`: content can be validated and used without an image while the image task remains outstanding.
- `none`: the preset intentionally has no reference image.

The UI must render a neutral no-image state for `pending` and `none`. A broken or undecodable mapped image remains an error. Legacy presets without this field continue to require their current reference-image mapping.

### Validation flow

1. `npm run check:preset` runs a fast static check on the canonical HTML. It reports the new/changed preset keys and checks required bilingual display fields, group presence, semantic unique keys, explicit purpose/image state for additions, allowed enum values, known style values, and image-state/map consistency. It makes no writes and opens no browser.
2. `npm run test:preset -- <group>/<key>` (or an equivalent targeted mode) applies the selected preset in Chrome and checks its fields, selected styles, copied prompt, and reference-image/no-image state.
3. `npm run test:all` remains the release gate and continues to exercise all built-in presets, data edges, browser features, and offline build output. Pending and intentionally image-free presets are reported separately; missing images for `ready` presets still fail.

### Compatibility and scope

- Keep `Prompts Builder V9.6.html` as the canonical editable source and do not edit generated HTML directly.
- Do not migrate existing group/key identities or rewrite existing image manifests in this change.
- Keep purpose inference as a backward-compatible fallback for existing and imported custom presets.
- Do not add a new style merely to categorize a preset.
- Do not change image-generation tools, queues, manifests, or existing untracked image work as part of this workflow change.

## Acceptance criteria

- A valid new preset can be classified and checked by the static command without launching Chrome.
- Invalid purpose, image status, duplicate key, unknown style, or missing required text produces a concise actionable error.
- `pending` and `none` are distinguishable from a broken image, and a preset with either status can be opened and applied in the UI.
- A `ready` preset with a missing or undecodable image fails validation.
- A targeted browser command can validate one selected preset.
- The existing complete release suite still checks every preset and generated build, while clearly reporting intentionally pending/no-image entries.
- Existing presets, imported custom presets, favorites, recents, and image-map keys remain compatible.

## Self-review

- No category-count threshold is imposed; a group is created only when a coherent set cannot be placed naturally in an existing group.
- New metadata is additive; older presets use the established fallback behavior.
- `pending` is an explicit workflow state, not an implicit test bypass. Only that state and intentional `none` can omit a mapped image.
- Full release validation remains required; the fast check is an early feedback loop, not a substitute.
