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
