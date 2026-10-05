# A/C acceptance — 2026-10-05

## Delivered scope
A1 preset favorites/recent and combined search/purpose/text filters; A2 basic/advanced visibility without data loss; A3 bounded undo/redo; C1 explicit natural-language/Midjourney output adapters; C2 compiled local/public HTML.

## Verification
- Baseline source test:all: 308/308 presets, 5/5 data edges, legacy browser regressions passed.
- Integrated source and local offline test:all: 308/308 presets, 5/5 edges, 5/5 A/C cases, offline build smoke passed.
- After final group-order and extreme-ratio fixes: source and local offline A/C cases 5/5 passed; final public compiled HTML test:all passed 308/308 presets, 5/5 edges, 5/5 A/C cases and browser regressions.
- Desktop 1440px/mobile 390px, light/dark: offline basic mode and preset filters render without document overflow; screenshots inspected.
- Offline file and public HTTP smoke: all non-loopback HTTP(S) requests blocked; interface starts, thumbnails load, local original opens and decodes, public thumbnail opens no viewer. Latest final smoke measured 133 ms file and 108 ms HTTP (single-run local measurement, not a comparative benchmark).
- Clean staged checkout: npm ci, sync:site and test:build pass with no private map/original directory; original-viewer test explicitly skipped there. Public output is unchanged and reproducible.
- git diff --check passes; compiled HTML embeds full runtime dependency licenses.

## Limits
- No image model/API calls; generation quality and actual platform output are not evaluated.
- Platform selection is an output view; work JSON keeps the established schema and does not persist the selected adapter.
- Drafts, favorites and recent use remain browser-local. Undo timeline is session-only and bounded at 50 snapshots.
- Generated HTML embeds interface dependencies and maps, not reference image pixels. Image folders are required for references; clean checkout has only public thumbnails.
- Editable source still uses CDN; use generated offline HTML for offline work. Generated releases use system fonts.
- npm audit reports 5 high-severity dependency entries caused by one unpatched braces advisory in the Tailwind v3 build dependency chain. Build accepts repository source/raw HTML, not browser form input; these Node build dependencies are not bundled as browser JS. No audit fix --force or major Tailwind migration was applied. Source: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm .

## Artifact hashes
| Artifact | Bytes | SHA-256 |
|---|---:|---|
| Prompts Builder V9.6.html | 532805 | 3422005aeaf740ea9673721168ed2934150c64165ddc7f552972137759fba3b1 |
| index.html | 712643 | 2592d3780d02dd8d12cfbd133d42ae0f017e4257d3afb68c16eb277bc4f4a028 |
| Prompt Master Offline.html | 772569 | 85be1dc5558ebbab4fba59c9c1d747563c948c1fd2d0fe8a35d4c83e45568ebd |
| build-site.cjs | 13960 | f06125de6b9a808ab8b091aa6d17936e157bfd0e62792b2e8e48d4ffac8f9d9d |
| verify-ac.cjs | 15026 | 4f6da2326ea113b8fd4d9c501f6c69ad7c9ae13384177c94ba3d10c50c42c9a2 |
| verify-build.cjs | 9815 | 69f724b03542e95cc6b7cbab90958fd3c5b458d4d0ba8131b61a443b0a59ffe5 |

## Delivery
Commit/push and GitHub Pages verification are recorded in the task completion receipt after publication. Unrelated AGY/Colab files are excluded.
