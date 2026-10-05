# A/C improvements — 2026-10-05

Scope: preset discovery, editing recovery, explicit output formats, and offline compiled release. No image-generation API integration.

## Intended behavior
- Preset favorites persist locally; recent-use order and purpose/text filters combine with search. Empty results provide a clear-filter action.
- Basic/advanced mode controls visibility only; existing values remain in the same work object. Advanced is the compatibility default.
- Undo/redo keeps bounded deep snapshots. Applying a preset, importing work, loading history and resetting work are recoverable. Native text-field undo shortcuts remain native.
- Generic output remains default. OpenAI/Gemini use natural language; Midjourney adds only supported aspect-ratio syntax. Descriptive resolution text does not set API output dimensions.
- The canonical V9.6 HTML remains editable source. A build compiles JSX, bundles interface dependencies and generates CSS. Deployment index and local offline HTML are generated files.
- The local release uses local original-image assets. The public release excludes original-image map references and has noninteractive thumbnails. Image asset folders remain necessary to display images; bundling the interface does not embed every image.

## Acceptance receipt
Verification results and remaining limitations are recorded after integration in ACCEPTANCE_AC_2026-10-05.md.
