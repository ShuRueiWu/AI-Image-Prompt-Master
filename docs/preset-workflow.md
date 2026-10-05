# Built-in preset addition workflow

`Prompts Builder V9.6.html` is the only editable preset source. Do not edit `index.html` or `Prompt Master Offline.html` by hand.

## 1. Classify the preset

- Reuse an existing browse group when it fits the user's main task; do not create a group for one preset.
- Use a semantic stable key such as `fantasy_mistwood_wayfarer`. The group/key pair is persisted by favorites, recents, and image lookup, so do not move an existing preset casually.
- Add one explicit `purpose`: `medical`, `photo`, `product`, `design`, or `general`.
- Use existing style values. A new visual treatment belongs in the style catalog first and needs a style-coverage example; do not invent a one-off style just to classify a preset.
- New built-ins must include bilingual `name`, `desc`, `desc_en`, `subject`, and `subject_en` text, plus a `styles` array.

## 2. Declare image state

Set `referenceImageStatus` on every new built-in:

- `ready`: the image map must contain at least one supported `codex` or `agy` thumbnail, and every mapped thumbnail must be a regular local file that the browser can decode.
- `pending`: the text preset is usable, but image production is still outstanding. Do not add an image-map entry.
- `none`: the preset intentionally has no reference image. Do not add an image-map entry.

Original PNGs remain local and private. Ready public thumbnails and their map entries are release assets and must be included in the scoped Git change; a local-only thumbnail does not make a ready preset publishable. Do not modify another agent's image queue, manifest, or untracked image work as part of this workflow.

## 3. Run the gates

```sh
npm run check:preset
npm run test:preset -- 'GROUP/key'
npm run test:all
```

`check:preset` is read-only and compares the canonical source with `HEAD` to report additions and changes. It validates new metadata, legacy-field preservation, style values, stable identities, image-state/map consistency, safe regular files, and supported image agents. It does not launch Chrome.

`test:preset` applies one selected preset in Chrome and checks its form fields, selected styles, copied prompt, English fields, and image state. With no identity it runs every built-in preset. The full `test:all` suite remains the release gate and regenerates no files; run `npm run sync:site` only after source changes when generated outputs need updating.

If a ready image is missing or undecodable, fix the image asset/map or explicitly change the new preset to `pending` while the image work remains outstanding. Never use `pending` to hide a broken mapped image.
