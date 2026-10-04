# 🎨 AI Image Prompt Master

<div align="center">

**A structured, bilingual AI image prompt builder based on Google's Golden Prompt Formula**

**基於 Google 黃金公式的結構化雙語 AI 圖像提示詞建構工具**

[**▶ Open the live site / 線上使用**](https://shurueiwu.github.io/AI-Image-Prompt-Master/)

[English](#english) | [繁體中文](#繁體中文) | [Credits & licenses](THIRD_PARTY_NOTICES.md)

</div>

---

## English

### Overview

A single-file web app (React in the browser, no build step) that turns prompt writing into a structured workflow: pick a preset or start blank, describe the subject and context, choose styles and camera settings, lay out text sections, then copy the final prompt into Midjourney, Stable Diffusion, Ideogram or any other image generator. Traditional Chinese and English are both first-class.

### Current release: V9.6

- **247 selectable styles**, each covered by at least one of **308 built-in presets** in 24 categories (coverage table: [`STYLE_COVERAGE_V9.6.md`](STYLE_COVERAGE_V9.6.md)). Coverage does not imply a quality evaluation of generated images.
- **Reference images for presets**: most presets show a small AI-generated reference thumbnail; click it to enlarge. Images are illustrations only and may contain errors; all names, brands and people shown are fictional.
- **Autosaved work**: the current work is saved in your browser and restored on reload. Export/import a complete work JSON to move between browsers; imports ask before replacing, and invalid files leave the editor unchanged. Drafts are local, not cloud-synced.
- **Advisory conflict reminders** (dismissible, never blocking), e.g. text-free profile with text content, or photorealistic combined with flat/vector/pixel styles.
- **Editable image-text language instructions** instead of the old "avoid Simplified Chinese" switch.
- Light/dark theme, search and collapsible categories, responsive layout, built-in help with credits.

Recent changes: see [`RELEASE_V9.6.md`](RELEASE_V9.6.md), [`FIXES_2026-10-02.md`](FIXES_2026-10-02.md) and [`PRESET_PROMPT_REVISIONS_2026-10-04.md`](PRESET_PROMPT_REVISIONS_2026-10-04.md).

### Quick start

1. Open the [live site](https://shurueiwu.github.io/AI-Image-Prompt-Master/), or open `Prompts Builder V9.6.html` directly in a modern browser (internet access is needed for the CDN dependencies).
2. **Browse Presets** and pick a template, or start from scratch.
3. Edit **Subject** and **Context**, choose styles, camera and composition, add layout sections if needed.
4. Set aspect ratio and resolution, then **Copy Prompt** into your image generator.

### Preset categories

Starter inspiration · Top 10 layouts · Classic layouts · Medical education and diagrams · Clinic assets · Pediatric education · Taiwan style · Illustration & anime · Mockups · Business & social · UI & layout · Education · Photography & portraits, plus focused style examples grouped by art style, photography genre, camera & gear, lighting, color, material, design layout, digital & 3D, seasons & festivals, era & culture and AI trending styles.

### For developers

`Prompts Builder V9.6.html` is the canonical source. `index.html` is an exact deployment copy, never a second editing source.

```sh
npm ci
npm run sync:site        # copy V9.6 to the Pages entry
npm test                 # equality check + isolated Chrome interaction tests
npm run test:presets     # apply every built-in preset through the UI
node verify-style-coverage.cjs --report   # regenerate the coverage table
```

Tests require Google Chrome, mock clipboard access and never call an image model. GitHub Pages publishes `main` at `/`; pushing a changed `index.html` publishes the site, local commits do not.

**Preset image pipeline**: original PNGs stay local under `preset-originals/<agent>/` and are not in Git. Public 640px WebP thumbnails live under `preset-previews/<agent>/` and are listed in `preset-previews/preset-image-map.js`. The local tool `generate_preset_previews.py` is idempotent and never calls an image model or paid API; the image list to regenerate is produced by `node make_regen_list.cjs`. Details: [`PRESET_IMAGES_REGEN_RUNBOOK.md`](PRESET_IMAGES_REGEN_RUNBOOK.md), fictional-name rules: [`PRESET_FICTIONAL_NAMES.md`](PRESET_FICTIONAL_NAMES.md).

The root TSX/Vite files are kept from earlier repository history; the single-file release does not build or use them.

### Tech stack and third-party components

React 18.2 (via esm.sh), in-browser Babel, Tailwind CSS (Play CDN), Lucide icons, Inter / Outfit / Noto Sans TC (Google Fonts). They load from public CDNs when the page opens, so those hosts can see the visitor's IP address; your prompts are never uploaded. Licenses and copyright notices: [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

### Disclaimers

- Reference images are AI-generated. Codex images use the built-in OpenAI ImageGen tool (underlying model/version not disclosed). AGY images use Antigravity's built-in image generation tool; AGY reports the model as `gemini-3.1-flash-image`. Copyright and usage follow each service's terms.
- Artist, studio, film-stock, camera and platform names in the style options belong to their owners and are used only to describe a look; no affiliation or endorsement is implied.

### Credits for AI assistance

This project was developed collaboratively by the author and AI tools. Claude Code (Anthropic) and Codex (OpenAI) assisted with development and documentation. Preset reference images were generated with OpenAI ImageGen (built into Codex) and `gemini-3.1-flash-image` (model reported by AGY).

### License and author

MIT License ([LICENSE](LICENSE)). Author: **Shu-Ruei Wu** — [allergy.tw](https://allergy.tw)

---

## 繁體中文

### 專案簡介

單一 HTML 檔的網頁工具（瀏覽器內執行 React，無需建置），把寫提示詞變成結構化流程：選範本或從空白開始、描述主體與情境、選風格與鏡頭、安排文字版面，最後複製提示詞到 Midjourney、Stable Diffusion、Ideogram 等圖像生成器。繁體中文與英文完整並行。

### 目前版本：V9.6

- **247 種風格**，每一種至少出現在 **308 個內建範本**之一（共 24 個分類；對照表見 [`STYLE_COVERAGE_V9.6.md`](STYLE_COVERAGE_V9.6.md)）。覆蓋不代表已評估生成圖品質。
- **範本參考圖**：多數範本附小張 AI 生成參考縮圖，點擊可放大。圖片僅為示意，可能有誤；圖中名稱、品牌與人物皆為虛構。
- **自動儲存**：目前作品會存在瀏覽器並在重新載入時還原；可匯出／匯入完整作品 JSON 在不同瀏覽器間搬移，匯入前會詢問，無效檔案不會改動編輯器。草稿只存在本機，不同步雲端。
- **衝突提醒**（可關閉、不阻擋複製），例如「無文字」設定卻填了文字內容，或寫實與扁平／向量／像素風格並用。
- **可編輯的圖中文字語言指示**，取代舊版「避免簡體字」開關。
- 淺色／深色主題、搜尋與可摺疊分類、響應式版面，說明視窗內含授權與來源。

近期更動見 [`RELEASE_V9.6.md`](RELEASE_V9.6.md)、[`FIXES_2026-10-02.md`](FIXES_2026-10-02.md)、[`PRESET_PROMPT_REVISIONS_2026-10-04.md`](PRESET_PROMPT_REVISIONS_2026-10-04.md)。

### 快速開始

1. 開啟[線上版](https://shurueiwu.github.io/AI-Image-Prompt-Master/)，或用現代瀏覽器直接開啟 `Prompts Builder V9.6.html`（CDN 依賴需要網路）。
2. 點「瀏覽預設範本」選擇範本，或從空白開始。
3. 修改「主體」與「情境」，選擇風格、鏡頭與構圖，需要時加入版面分區。
4. 設定長寬比與解析度，按「複製提示詞」貼到你的圖像生成器。

### 範本分類

新手啟發、十大佈局、經典切版、醫學教材與圖解、臨床與診所素材、兒科衛教、台灣風格、插畫與動漫、樣機、商業與社群、UI 與排版、教育與解說、攝影電影與寫真；另有依藝術風格、攝影題材、相機與鏡頭、光影、色彩、材質、設計排版、數位與 3D、季節與節慶、時代與文化、AI 熱門風格分組的風格示範。

### 開發者資訊

`Prompts Builder V9.6.html` 是唯一編輯來源，`index.html` 是它的完整部署副本，不另行編輯。指令見上方英文區（`npm ci`、`npm run sync:site`、`npm test`、`npm run test:presets`）。測試需要 Google Chrome，會模擬剪貼簿，不呼叫任何圖像模型。GitHub Pages 由 `main` 根目錄發佈；`index.html` 有變更並 push 才會更新網站，本機 commit 不會。

**範本圖片流程**：原始 PNG 只留本機（`preset-originals/<agent>/`，不進 Git）；公開的是 640px WebP 縮圖（`preset-previews/<agent>/`），對照表為 `preset-previews/preset-image-map.js`。縮圖由本機腳本 `generate_preset_previews.py` 產生（可重複執行、不呼叫模型或付費 API）；要重生的清單由 `node make_regen_list.cjs` 產生。詳見 [`PRESET_IMAGES_REGEN_RUNBOOK.md`](PRESET_IMAGES_REGEN_RUNBOOK.md) 與 [`PRESET_FICTIONAL_NAMES.md`](PRESET_FICTIONAL_NAMES.md)。

### 技術與第三方元件

React 18.2（esm.sh）、瀏覽器內 Babel、Tailwind CSS（Play CDN）、Lucide 圖示、Inter／Outfit／Noto Sans TC（Google Fonts）。開啟頁面時從公開 CDN 載入，這些主機會看到訪客的 IP；你輸入的提示詞不會上傳。授權與版權聲明見 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

### 聲明

- 參考圖為 AI 生成。Codex 圖片由 Codex 內建 OpenAI ImageGen 產生（底層型號與版本未揭露）；AGY 圖片由 Antigravity 內建影像生成工具產生，AGY 回報型號為 `gemini-3.1-flash-image`。著作權與使用限制依各服務條款。
- 風格選項中的藝術家、影視、底片、相機與平台名稱，其商標屬各自所有者，僅作風格描述，與本工具無隸屬或背書關係。

### 製作協助

本專案由作者與 AI 工具協作完成。Claude Code（Anthropic）與 Codex（OpenAI）參與開發與文件整理。範本參考圖由 OpenAI ImageGen（Codex 內建）及 `gemini-3.1-flash-image`（AGY 回報型號）產生。

### 授權與作者

MIT 授權（[LICENSE](LICENSE)）。作者：**Shu-Ruei Wu** — [allergy.tw](https://allergy.tw)

---

<div align="center">

**⭐ If you find this tool helpful, please give it a star! ⭐　如果覺得有幫助，請給它一顆星！**

</div>
