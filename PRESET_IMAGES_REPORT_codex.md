# Codex preset 參考圖階段 A 報告

日期：2026-10-03  
Task：`prompt-master-preset-images-20261002`

## 結果

- `presets_prompts.json` 與 313 個 preset 均未修改；本輪對三項缺圖加入必要的男性、非性化或原創作品限定，source prompt hash 與實際生成 prompt hash 分別記錄於 manifest。
- 內建 Codex image generation 累計 380 次（原 377 次＋本輪 3 次），硬上限 626；本輪並行度 1。未使用 API key、SDK、curl 或外部付費 API；三張均成功生成。
- 本次只重生 manifest 中完全符合指定錯誤字串的 28 個 preset，各 1 次；提示詞原文未改，28 個 `prompt_sha256` 均與 `presets_prompts.json` 相符。多餘字樣不作退件理由，原圖全數保留為原尺寸 PNG，未見生成器可見浮水印。
- 本輪補生：`style_example_3_16` 男性蝴蝶光肖像、`port_fashion` 男性時尚攝影、`movie_scifi_epic` 原創科幻海報，均成功；原尺寸 PNG 已保留。
- Codex 原圖：313 張 `ok`，位於 `preset-originals/codex/`。
- Manifest：`preset-previews/codex/manifest.json` 共 313 個 key：313 `ok`、0 `error`、0 未處理；三張新增原圖尺寸與 bytes 已全量核實，沒有生成器可見浮水印。
- 全量核對 313 個成功項：原圖存在且可解碼，PNG 尺寸與 bytes、縮圖解碼及長邊 ≤640px 均通過；source `prompt_sha256` 與 `presets_prompts.json` 相符，附加限定的實際生成 prompt hash 另列。
- 目視檢查本輪新增三張，未見生成器可見浮水印。畫面中依提示詞生成的文字、標誌樣式或裝飾保留。

## Error 項目

目前沒有 error 項目；313 個 preset 均有 Codex 原圖與縮圖。

## 階段 B 縮圖與 UI

- 冪等本機縮圖腳本：`generate_preset_previews.py`（檔首 docstring 說明功能、唯讀範圍與參數）。
- 用法：`/opt/homebrew/bin/python3.13 generate_preset_previews.py --agent agy` 產生 AGY 縮圖；`/opt/homebrew/bin/python3.13 generate_preset_previews.py --agent codex` 驗證／補齊 Codex 縮圖並重建 UI map。只讀該 agent manifest 與原圖；輸出長邊至多 640px 的 WebP，不改原圖與 manifest；可安全重跑。
- 2026-10-03 執行 AGY：50 筆 manifest，46 張縮圖新建、4 筆非 `ok` 略過、0 缺原圖、0 轉檔錯誤。
- 重跑 Codex：本輪新增 3 張縮圖；313 張成功縮圖均有原圖，0 缺原圖、0 轉檔錯誤。
- UI map 重建為 313 筆，313 項均有 Codex 圖片路徑。AGY 缺少的預覽候選路徑由 `PresetReferenceImages` 的 `<img onError>` 隱藏，符合單邊缺圖顯示另一邊／雙邊缺圖不顯示的 fallback。
- `layout_central_hero` Codex 與 AGY 原圖、WebP 預覽及 map 項均存在；畫面若仍標示無圖，並非因該 preset 尚未產圖。
- 2026-10-03 後續查到 map 有 25 條 Codex 路徑指向不存在的舊 prefix：Codex 原圖與 WebP 各 313 張均完整，但同一 UI／攝影群組含多個歷史 prefix，舊 map builder 誤以群組共用單一 prefix。已改為逐筆依 manifest `original` stem 產生 WebP 路徑，且只列入實際存在的縮圖；重跑後全量檢查 313/313 Codex map 路徑存在。`index.html`、原圖與 manifest 未修改，未 push。
- 本輪 `npm test` 與 `npm run test:presets` 均 PASS；瀏覽器安全政策拒絕直接開啟新的本機 `file://` gallery 分頁，因此本輪未做實際畫面目視確認。路徑一致性與自動化測試通過不等同目視驗收；使用者可重載已開啟的本機頁面確認。
- `npm test` 通過（含 sync-site 一致性及桌機／手機、淺／深色測試）；`npm run test:presets` 全 313 項通過。Chrome 真實瀏覽器目視尚未驗證：本機 file URL 導覽遭瀏覽器安全政策拒絕，未嘗試繞過；未 push。

## 範圍界線

階段 B 另新增五張 Codex 原尺寸 PNG 與對應 WebP（先前兩張、本輪三張）；未修改 AGY 原圖或 AGY manifest。未 commit/push。

## 虛構名稱重生（進行中，2026-10-04）

- 使用者授權本批最多 60 次 Codex 內建生圖；不使用 API key；序列執行。43 筆 Codex 項目按現行 `group/key` 處理，先做虛構名稱表列出的 10 筆，再處理其餘 33 筆。
- 已完成 5/43（優先名稱項 3/10）：`starter_double_exposure`、`layout_vogue_cover`、`layout_youtube_thumb`、`complex_magazine` 各首生 1 次並通過 OCR，未見清單中的真實名稱；`complex_magazine` 的畫面文字含虛構 `SOLENNE`／`WWW.SOLENNE.COM`，不含 `VOGUE`。`starter_double_exposure` 目視確認只見英文 **Mind Forest**、無「心之森」或其他中文。依追加指示提前完成 `pedu_portrait`，首生 1 次，目視為自然淡彩診間互動、非網美擺拍、表情溫和、無文字，OCR 無真實名稱命中。五張均已 dry-run＋`--apply`，manifest 為 `ok`；新原圖沿用原檔名及原尺寸，舊圖均保留於 `preset-originals/_replaced/codex/`。
- `pedu_portrait` 新原圖：`preset-originals/codex/g06-pediatric-education__pedu_portrait.png`（1122×1402 PNG）。`starter_double_exposure` 新原圖：`preset-originals/codex/g00-starter-inspiration__starter_double_exposure.png`（1086×1448 PNG），舊圖：`preset-originals/_replaced/codex/20261004-133439-g00-starter-inspiration__starter_double_exposure.png`。
- `complex_magazine` prompt 中的 `WWW.VOGUE.COM` 是原準備清單遺漏的真實刊物名稱；已改為虛構 `WWW.SOLENNE.COM`，同步 regen list、prompt 檔及 SHA-256 後才生成。新原圖：`preset-originals/codex/g17-ui-layout__complex_magazine.png`（1086×1448 PNG）。
- 為遵守「風格示範不得有文字或招牌」，將現行 `style_example_1_sports_photography` 的新 prompt 改為無文字、無旗幟／招牌／贊助商標誌；已同步 regen list、prompt 檔及 SHA-256（`163eb6ee8118fdd0455ab1a6c89771da37a382696d31a2a5f349eda3e7015c73`）。其圖尚未生成。
- 未 commit/push；未修改 `index.html`、`Prompts Builder V9.6.html`、Colab 或 AGY 原圖／manifest。

## 2026-10-04 追加續作（queue 44 項；進行中）

- 範圍依 `PRESET_IMAGES_REGEN_QUEUE.md`：只處理 `PRESET_IMAGES_REGEN_LIST.json` 的 44 項；不擴到其餘約 260 項。累計內建生圖約 11 次／60 次，串行，未用 API key。
- A 組 `lego_city`：首生 1 次，目視招牌為虛構 `Brikmora`，OCR 未命中真實名稱；dry-run／`--apply` 通過，舊圖歸檔保留，新原圖 1672×941，Codex WebP 已產生，manifest `ok`，解除隱藏。
- B 組 `pedu_portrait`：依單人肖像新 prompt 重做 1 次；畫面僅一位平凡、溫和的兒科醫護，無文字、OCR 無真實名稱。dry-run／`--apply` 通過，舊圖保留，新原圖 1122×1402，WebP 已產生，manifest `ok`。
- A 組 `complex_magazine` 首生 1 次未採用：目視仍是明星式光鮮封面，且出現真實 `WWW.VOGUE.COM`；OCR 命中 `VOGUE`，乾跑拒絕，未套用。現有生成清單／prompt 檔仍含 `WWW.VOGUE.COM`、glossy／model／star 等舊描述，與 queue 的「自然、非明星臉、SOLENNE」要求不一致。
- A 組新示範 `style_example_9_taiwanese_glove_puppetry_style` 首生 1 次：原創武俠布袋偶，背景中文經使用者確認可接受；OCR 無真實名稱。`--new --apply` 通過，原圖 1448×1086，縮圖與 map 已產生，`failed=0`。
- A 組 `social_yt_thumb`：首生 1 次，目視僅見虛構 `Taldora Play` 平台標誌、無 YouTube 標誌；OCR 無真實名稱。dry-run／`--apply` 通過，原圖 1672×940，WebP 已產生，manifest `ok`，解除隱藏。
- A 組 `ui_dashboard_dark`：首生 1 次，目視流量來源為 `Oskerin 社群`／`Quillon 搜尋`／`Taldora 郵件`，未見 Facebook 等真實平台；OCR 無真實名稱。dry-run／`--apply` 通過，原圖 1672×941，WebP 已產生，manifest `ok`，解除隱藏。
- **待解來源問題**：使用者要求不可手改 `PRESET_IMAGES_REGEN_LIST.json`，須由 `node make_regen_list.cjs` 產生；但該產生器直接由禁止本輪修改的 `Prompts Builder V9.6.html` 取 prompt。當前清單與兩個 prompt 檔仍與最新驗收條件衝突。以上失敗圖均未套用；需先由允許的來源更新 prompt 並重建清單，否則套用會保存錯誤 prompt hash／未來 UI 仍會輸出不合要求的文字。
- 已確認 `lego_city`、`pedu_portrait`、布袋戲新示範、`social_yt_thumb`、`ui_dashboard_dark` 的原圖／縮圖存在；`complex_magazine` 尚未套用。未 commit/push，未碰 Colab／AGY。

### 本輪續作更正

- 已依使用者核准只更新 V9.6 的 `complex_magazine` prompt／展示網址：刊名與網址使用虛構 `SOLENNE`／`WWW.SOLENNE.COM`，保留經典時尚刊物的 serif 編輯風格，肖像改為自然、未修飾的中年女性作家；移除明星／模特兒／美妝／奢旅導向。執行 `node make_regen_list.cjs` 產生 44 筆清單，未手改 JSON；regen prompt、hash 與 JSON 逐字相符。
- 新圖首生 1 次；目視為自然作家肖像，刊名／網址皆虛構；乾跑 OCR 真實名稱命中無。已 `--apply`，新原圖 `preset-originals/codex/g17-ui-layout__complex_magazine.png`（1086×1448），舊原圖保留於 `preset-originals/_replaced/codex/20261004-155044-g17-ui-layout__complex_magazine.png`；WebP 已刷新。manifest 更新成功、縮圖 `failed=0`；因 AGY 圖尚未重生，UI 仍隱藏。
- 先前所述「待解來源問題」已解除；A 組依 queue 下一項續做。累計內建生圖約 12 次／60 次，串行，未使用 API key；未 commit/push。
- `edu_poster` 首生 1 次；目視內容為虛構 Aldenwick University 氣候研究海報，乾跑 OCR 無真實名稱。已套用，原圖 1448×1086，舊圖保留，縮圖 `failed=0`；Codex 為該項唯一原有圖源，已解除隱藏。
- `photo_film` 首生 1 次；虛構器材名稱 `Oskerin`，乾跑 OCR 無真實名稱。已套用，原圖 1448×1086，舊圖保留，縮圖 `failed=0`，已解除隱藏。
- `port_fashion` 生圖請求遭內建生成器拒絕：`moderation_blocked`，`safety_violations=[sexual]`（request ID `999c1707-9c4a-4d12-b4ee-5315d1d8154a`）；未產圖、不重試、不改 prompt，列為待處理阻塞。
- 目前累計約 15 次生圖請求／60 次（包含 1 次 safety 拒絕），串行；未使用 API key。
- `style_example_1_sports_photography` 首生 1 次，OCR 無真實名稱，但目視有無字終點彩帶與旗幟／徽章，違反 prompt 的無 banner／sign 條件；未套用。依 runbook「僅 OCR 命中真實名稱才重試」，不自行重試或改 prompt，列待處理。
- 目前累計約 16 次生圖請求／60 次（含 1 次 safety 拒絕及 1 張未採用圖），串行；未使用 API key。
- `style_example_2_85mm_lens` 首圖是女性肖像，不符使用者「女性寫真改男性」要求；一次定向編修只改人物為自然中年男性，保留花園、構圖與光線。修正版 OCR 無真實名稱，已套用，原圖 1448×1086，舊圖保留、縮圖 `failed=0`；此項共 2 次圖像操作。
- 時代與文化示範已完成 8/9：維多利亞、裝飾藝術、文藝復興、蒸汽龐克、希臘羅馬、巴洛克、Y2K、酸性圖形（中央人物已改自然中年男性）均無文字／招牌且 OCR 無真實名稱，已 dry-run／apply，原圖與縮圖更新成功（各 `failed=0`）。
- `style_example_10_medieval` 圖含旗幟／橫幅，違反無文字招牌類元素的驗收要求；OCR 無真實名稱，未套用且不重試。
- 累計約 28 次圖像生成／編修請求（含 1 次 safety 拒絕及 2 張未套用圖）／60 次；串行，未使用 API key。
- C 組已完成並套用：`layout_mag_cover`（虛構刊名、男性肖像）、`he_fb_handwash`（三步指定中文逐字正確）、`starter_over_shoulder`（男性醫師）、`ai_avatar`（自然男性頭像）、`ecommerce_lifestyle`（男性使用者／Quillon 虛構產品）、`pedu_mechanism`（無字兒科示意圖）。各項 OCR 無真實名稱，原圖保留、縮圖生成成功。
- `layout_magazine_spread` prompt 明確指定中年女性肖像，與較早「女性寫真改男性」方向衝突；目前未生成，已向使用者確認是否調整來源，等待答覆。
- 目前累計約 37 次圖像生成／編修請求／60 次；串行，未使用 API key。

### 2026-10-04 續作核對（使用者確認 Magazine Spread 維持女性）

- 使用者確認 `layout_magazine_spread` 按目前 prompt 維持女性；新圖為自然、非模特兒感的中年女性訪談版面，畫面使用虛構刊名 `SOLENNE`，未見真實品牌。OCR 無真實名稱命中；dry-run／`--apply` 通過。新原圖 `preset-originals/codex/g17-ui-layout__layout_magazine_spread.png`（1448×1086），舊圖保留於 `preset-originals/_replaced/codex/`；縮圖刷新 `failed=0`。
- 節慶／田園示範本輪完成並套用 8 張，各 1 次生成：`style_example_8_christmas`、`style_example_8_halloween`、`style_example_8_mid_autumn_festival`、`style_example_8_valentines_day`、`style_example_8_easter`、`style_example_8_thanksgiving`、`style_example_8_qixi_festival`、`style_example_11_cottagecore`。目視均無文字／招牌／橫幅，dry-run OCR 均無真實名稱；每張均 dry-run 後 `--apply`。各自新原圖沿用原檔名存於 `preset-originals/codex/`，舊原圖留存於 `_replaced/codex/`；每次縮圖刷新 `failed=0`。
- `style_example_8_dragon_boat_festival` 本輪首生 1 張，但目視有紅色直幡／旗幟，違反風格示範無文字／橫幅條件；OCR 無真實名稱命中，僅 dry-run、未套用，檔案留在 Codex 內建生成目錄，不取代原圖。依 runbook「僅真實名稱 OCR 命中才可重試」，不重試。
- 最新清單全量核對：44 筆中 40 筆 status/hash 與目前 `PRESET_IMAGES_REGEN_LIST.json` 相符，且原圖及 WebP 均存在；Codex 預覽重跑 `created=0, skipped=308, missing_originals=0, failed=0`。`generate_originals_map.py` 完成，無錯誤。
- 仍未能套用 4/44：`port_fashion` 內建生圖遭安全審核拒絕（sexual，request ID `999c1707-9c4a-4d12-b4ee-5315d1d8154a`）；`style_example_1_sports_photography` 與 `style_example_10_medieval` 的既有首生圖不符合無旗幟／橫幅條件且 OCR 未命中真實名稱；端午示範如上。這三張不依 runbook 重試，也不把未合格圖套用。
- 本輪曾因工具回傳格式誤觸額外 1 次內建生圖（山景測試圖，未採用、未複製進專案）；此呼叫仍計入硬上限。累計約 53/60 次，串行；只使用 Codex 內建圖像生成，未使用 API key。未 commit／push；Colab、AGY 原圖／manifest、`index.html` 均未修改。
- 驗證：`npm run test:presets` PASS，308 個 presets 全部通過；`npm test` 在第一步 `check:site` 停止，訊息為 `index.html differs from V9.6. Run npm run sync:site to update it.`。本任務明確禁止改 `index.html`，因此未執行會改檔的 `sync-site`；其後 V9.5/V9.6/style-coverage 測試未由 `npm test` 執行。

### 男性醫師與男性寫真人像（Codex，2026-10-04 收尾核對）

- 既有四張 Codex 圖已完成更新；本次續接沒有再次呼叫圖像生成。重新核對目前 `presets_prompts.json` 與 Codex manifest，四筆 prompt SHA-256 完全一致、狀態均為 `ok`，原尺寸 PNG 與對應 WebP 均存在：
  - `layout_vogue_cover` — 1086×1448；目視為男性外科醫師，刊物使用虛構 SOLENNE 品牌。
  - `friendly_staff` — 1536×1024；目視為男性醫師。
  - `med_consult` — 1448×1086；目視為男性醫師與病人進行諮詢。
  - `photo_film_portra` — 1086×1448；目視為男性人像。
- 未修改 AGY 原圖或 manifest。AGY 對應圖仍由 AGY 任務持有，待其額度重置後處理；不得以 Codex 四張已完成代表 AGY 亦完成。

### 2026-10-04 剩餘四項完成（清單 prompt 已由 Claude 更新）

- 依重建後的 `PRESET_IMAGES_REGEN_LIST.json`／`regen-prompts/`，四筆新 SHA-256 均逐字相符；未手改產生清單。
- `port_fashion`：第一張為女性時尚肖像，為符合既有男性人像要求，使用者授權的第二次定向編修改為男性、保留大衣與都會街景。兩次圖像操作；最終 OCR 無真實名稱，dry-run／`--apply` 通過，Codex 原圖 `preset-originals/codex/g23-photography-portraits__port_fashion.png`（1086×1448），舊圖保留於 `_replaced/codex/`，解除隱藏。
- `style_example_1_sports_photography`：1 次生成；男性跑者位於開闊濱海道路，無終點線、旗幟、橫幅、招牌或文字；OCR 無真實名稱，dry-run／`--apply` 通過。原圖 `preset-originals/codex/g15-photography-genres__style_example_1_13.png`（1448×1086）；舊圖保留。
- `style_example_10_medieval`：1 次生成；中世紀市集與石城堡，無旗幟／橫幅／紋章／文字；OCR 無真實名稱，dry-run／`--apply` 通過。原圖 `preset-originals/codex/g24-era-culture__style_example_10_2.png`（1448×1086）；舊圖保留。
- `style_example_8_dragon_boat_festival`：1 次生成；龍舟與觀賽人群，無旗幟／橫幅／文字；OCR 無真實名稱，dry-run／`--apply` 通過。原圖 `preset-originals/codex/g22-seasons-festivals__style_example_8_8.png`（1448×1086）；舊圖保留。
- 四張各自縮圖更新均 `failed=0`。收尾執行 `generate_preset_previews.py --agent codex`：`created=0, skipped=308, missing_originals=0, failed=0`；執行 `generate_originals_map.py` 成功，輸出 308 presets／357 originals。全量比對現行 44 筆：44/44 manifest `status=ok`、hash 相符，原圖與 WebP 預覽均存在。
- `npm test` PASS（含 site 同步、V9.5/V9.6、桌機／手機淺深色及 style coverage 247/247）；`npm run test:presets` PASS（308/308）。累計約 58/72 次 Codex 內建圖像生成／編修呼叫，串行，未使用 API key。未 commit／push；未改 AGY 原圖／manifest 或 Colab。

### 酸性設計示範圖替換（Codex，2026-10-04）

- 只替換 `style_example_10_acid_graphics` 圖片；保留使用者提供的主描述與現行 prompt/hash，不修改 preset 文案或 `index.html`。
- 以 Codex 內建 imagegen 產生 2 張候選並目視比較；採用第一張較平衡、以流動抽象造型為主的版本。最終為 1448×1086 PNG（4:3），人物穿著完整；未見文字、品牌、招牌或可見生成器浮水印。`apply_regen.py` OCR 真實名稱命中為無。
- 舊原圖與未採用候選均保留在 `preset-originals/_replaced/codex/`；新原圖沿用既有檔名 `preset-originals/codex/g24-era-culture__style_example_10_10.png`。Codex manifest 狀態 `ok`、prompt hash 與 `presets_prompts.json` 相符；對應 WebP 與 maps 已重建。重跑縮圖結果 `created=0, skipped=308, missing_originals=0, failed=0`；`npm run test:presets` 通過（308/308）。
- 未修改 AGY 圖片／manifest。內建 imagegen 未提供可驗證的底層模型 ID；依使用者後續澄清，只變更圖片卡片顯示標籤為 `OpenAI ImageGen`／`AGY ImageGen`，不改圖片、prompt 或圖檔名稱。標籤更新已通過 `check:site` 與 Chrome 單項 smoke test。

### `starter_knolling` 聽診器重生與台灣分類改名（Codex，2026-10-04）

- `starter_knolling` Body Context 已改為英文並限制僅可見通用標題 `Doctor EDC`、無人名／院所名／品牌／標誌；prompt 由 `node make_regen_list.cjs` 產生，SHA-256 `b391114d3a34f832c63324e2c121fb3d18084fb240e462104760a2386fee2071`。
- 使用 Codex 內建 ImageGen 生圖 1 次（無 API key）；新圖 1672×941 PNG。目視為俯視 knolling，聽診器是 Y 形雙耳管連單一圓形聽診頭，唯一文字為 `Doctor EDC`；`apply_regen.py` OCR 真實名稱命中 0。Dry-run 與 `--apply` 均通過；新原圖 `preset-originals/codex/g00-starter-inspiration__starter_knolling.png`，舊原圖保留至 `preset-originals/_replaced/codex/20261004-192922-g00-starter-inspiration__starter_knolling.png`。縮圖生成 `failed=0`。由於此 preset 的 AGY 圖尚未用新 prompt 重生，依既有規則仍隱藏，未解除 `regen-hold`。
- 分類顯示名稱只改為 `台灣風格 (Taiwan)`；底層來源分類與 preset key 不變。`presets_prompts.json` 及 Codex manifest 的 9 個合併分類 key 已重鍵，原始 `.key`／圖片路徑與 prompt hash 保留；AGY manifest 無這 9 筆，未修改。重跑 `make_regen_list.cjs` 後共 45 筆，僅布袋戲示範一筆落在新分類；map 重建後新分類有 9 個 Codex 預覽、0 個 AGY 預覽，所有 Codex WebP 存在，舊分類 map key 為 0。`generate_originals_map.py` 輸出 308 presets／357 originals。
- 驗證：`npm test` PASS（含 247/247 styles）；`npm run test:presets` PASS（308/308，含新分類名稱精確斷言）；`generate_preset_previews.py --agent codex` `missing_originals=0, failed=0`。Chrome 桌機與手機 smoke test 均實際載入新分類的 Codex 640×360 WebP；AGY 對應路徑載入失敗後隱藏，Codex 圖仍正常顯示。未 push。
