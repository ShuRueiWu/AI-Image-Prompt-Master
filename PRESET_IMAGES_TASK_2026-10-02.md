# Preset 參考圖：逐一生圖任務規格（2026-10-02）

Task ID：`prompt-master-preset-images-20261002`　Owner：codex　cwd：本目錄
來源：使用者 2026-10-02 授權。**長工作，撞額度就停，重置後由同一 task 續做；以 manifest 為進度 SSOT。**

## 目標
讓使用者在 Prompt Builder 選 preset 時，能直接看到該 preset 的產出參考圖。

## 範圍與順序
1. **確認 preset 清單**：`node verify-presets.cjs` 應 PASS（claude 於 2026-10-02 16:5x 已跑過：313 presets PASS）。以 `BUILTIN_PRESETS` 為準，不得改 preset 內容。
2. **逐一生圖（階段 A）**：每個 preset 用其「複製提示詞」輸出（或等同 verify-presets 的 UI 流程）作為圖像 prompt，各生 1 張。
3. **UI 整合（階段 B，階段 A 全部完成後才做）**：preset 瀏覽清單與選取後顯示縮圖，讀 manifest；無圖時照舊。不新增其他功能。

## 執行約束
- **允許 subagents，最多 3 個並行**；每個 subagent 分配不重疊的 preset 切片（按 group 或 key 區間），只寫自己切片的圖檔，不碰 index.html / manifest 以外檔案。manifest 由主 agent 彙整寫入（單一寫入者）。
- **最壞呼叫數**：313 次生圖（每 preset 1 張，失敗最多重試 1 次 ＝ 上限 626）。**硬上限 626 次**，達上限即停並回報。
- **停止條件**：遇額度/rate limit 訊息立即停止所有 subagent，不重試、不換 prompt；寫 manifest 後結束。重置後從 manifest 未完成項續做，**已有圖的 preset 不重生**。
- 非零退出／單張失敗：記錄 error 到 manifest 並跳過，不阻塞其他。先定位原因再重跑，不盲目重試。

## 輸出（2026-10-02 17:15 修訂：保留原始尺寸；Codex 與 AGY 各跑一份）
- **原圖一律保留生成器給的原始尺寸與格式，不縮放、不重壓**：`preset-originals/<agent>/<安全化group>__<key>.<原副檔名>`（agent = `codex` 或 `agy`；該目錄加入 `.gitignore`，只留本機，不 push）。
- 網頁用縮圖（階段 B 才需要）**一律用本機程式從原圖轉出（PIL／sharp／cwebp 等），不呼叫任何圖像或語言模型，不計入 626 次上限、不耗額度**；為**另存衍生檔**：`preset-previews/<agent>/<同名>.webp`（長邊 ≤ 640px），原圖不被覆蓋。若使用者不要衍生檔，階段 B 前會另行指示。
- manifest：`preset-previews/<agent>/manifest.json`：`{ "<group>/<key>": { original, width, height, bytes, prompt_sha256, generated_at, status: "ok"|"error", watermark?: bool, error? } }`；各 agent 只寫自己的目錄與 manifest（避免寫入衝突）。
- **落地存檔是進度唯一依據**，終端輸出不算。
- 階段 A 結束時各自產出 `PRESET_IMAGES_REPORT_<agent>.md`：總數、ok/error 清單、未完成清單。
- Codex 與 AGY **使用相同 prompt**（以 BUILTIN_PRESETS 經 UI「複製提示詞」輸出為準，prompt_sha256 須一致）；兩邊互不讀對方產出。

## 禁用付費 API（使用者 2026-10-02 17:29 指示，適用 agy；codex 同理）
- **AGY 只能用 AGY 內建的 `generate_image` 工具**；**不得**使用使用者的 Gemini／Google API key（含 Keychain、環境變數、curl、genai SDK、任何自寫腳本打 API），那是按量計費。
- 遇內建額度用盡（如 429）即停，等重置；**不得改走 API key 繼續**。
- Codex 只能用 Codex 內建的圖像生成，不得改打 OpenAI API key。

## 浮水印（使用者 2026-10-02 17:15 指示，適用 codex 與 agy）
- 產圖**不得帶可見浮水印／logo／簽名／文字覆蓋**；選用不加可見浮水印的生成路徑與設定。
- 若某路徑無法避免可見浮水印：不事後裁切或塗抹，該張 manifest 標 `watermark: true` 並在報告列出，交使用者決定。
- 驗收時抽樣目視檢查，並在報告如實寫明檢查範圍。

## 驗收
- 各 agent manifest：ok + error + 未完成 = 313；每個 ok 的原圖實際存在、可解碼、尺寸與 manifest 一致。
- 階段 B（僅 codex 負責，且只在兩邊 A 都完成後）：**Codex 與 AGY 兩家的圖都保留，UI 並排同時顯示並標示來源**（使用者 2026-10-02 指示，不需二選一）；任一家缺圖時只顯示有的那家，兩家都缺則照舊。Playwright 驗證並排顯示、單邊缺圖與全缺 fallback；`npm test`、`npm run test:presets` PASS；`sync-site` 一致。
- 誠實標明：圖像品質只做抽樣目視，不宣稱逐張驗收。

## 交付
- 原圖不入 repo。階段 B 衍生縮圖 commit + push 前確認 repo 體積可接受。
- 完成後以 `ai_work_state.py complete` 結案（artifact 用該 agent 的 `PRESET_IMAGES_REPORT_<agent>.md`）。


## 排程資訊
- Codex 5h 額度重置 2026-10-02 21:31 +08:00（ai_agent_watch 自動接續）。
- 使用者表示全球重置約太平洋時間 10:00（＝台北 2026-10-03 01:00）；屆時可全速續做。時間為使用者提供，未獨立查證。

## 階段 B 提前啟動（使用者 2026-10-03 07:31 指示「開始B」）
- 不等 AGY 階段 A 完成：以現有圖先做。AGY 仍在補圖（額度每次重置後續做），其 preset-originals/agy/ 與 manifest 持續增加，**不得被階段 B 覆寫或讀寫鎖定**。
- 縮圖腳本必須**可重複執行（冪等）**：只處理 manifest 為 ok 且縮圖不存在或原圖較新者；AGY 日後補圖只需重跑一次。縮圖一律本機程式轉出（不耗額度）。
- UI：preset 瀏覽清單與選取後顯示縮圖，Codex、AGY 並排並標示來源；單邊缺圖只顯示有的那家，兩家都缺照舊。改動限於預設圖顯示，不加其他功能。
- 驗證：Playwright（桌機＋手機、淺色＋深色）、`npm test`、`npm run test:presets`、`sync-site` 一致；抽樣目視縮圖。
- **本機完成並驗證後先不 push**：回報給使用者確認再 cnp。原因：圖含 AI 生成的真實機構／品牌樣式（如大學校名校徽、運動品牌標誌），公開上線前需使用者確認。
