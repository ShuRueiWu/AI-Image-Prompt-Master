# Playful Crayon Drawing Preset

## Goal

Add one reusable, prompt-only preset to the existing `Starter Inspiration`
group. It converts an input image into a playful crayon drawing while keeping
the main subject and composition recognizable.

## User-visible content

- English name: `Playful Crayon Drawing`
- Traditional-Chinese name: `童趣蠟筆畫`
- English prompt text is the source prompt content.
- Traditional-Chinese text is retained only for the bilingual UI description
  and translation preview; it is not inserted into the English prompt.
- The preset has no title or text blocks, so generated images are not prompted
  to contain lettering.

## Data and scope

- Add the preset to `BUILTIN_PRESETS["🔰 新手啟發範本 (Starter Inspiration)"]`.
- Use the existing `Crayon Drawing` style value.
- Keep the preset image state as prompt-only/pending; do not invoke AGY or add
  a new generated image asset in this change.
- Preserve the existing canonical-source flow: edit `Prompts Builder V9.6.html`,
  then regenerate `index.html` and `Prompt Master Offline.html` using the
  repository scripts.

## Acceptance criteria

1. The preset appears in the Starter Inspiration group in both Traditional
   Chinese and English UI modes.
2. Its generated prompt uses the English crayon transformation wording and
   contains no Chinese prompt text unless the user explicitly switches to a
   Chinese output mode.
3. The prompt is text-free by default: no title, letters, numbers, logos, or
   watermarks are requested.
4. Existing preset metadata, generated-output reproducibility, and preset
   checks pass.
5. No AGY image-generation job or new image asset is required.

## Verification

- `npm run check:preset`
- `npm run check:site`
- `npm run test:presets`
- `npm run test:all`

