# 重生 runbook（虛構名稱版）— 只剩「生圖」這一步需要圖像模型

已備好：新 prompt（`regen-prompts/NNN_<key>.txt`，與 `PRESET_IMAGES_REGEN_LIST.json` 的 `new_prompt` 相同）、
套用工具 `apply_regen.py`（驗證＋OCR 檢查真實名稱＋保留舊圖＋更新 manifest／presets_prompts／隱藏清單＋縮圖與地圖）。

## 每個 preset 的流程（Codex：10 個；AGY：其中 4 個）
1. 用 `regen-prompts/<檔>.txt` 的**完整內容**當 prompt，用內建圖像生成產 1 張（比例見 prompt 末行 `aspect ratio X:Y`）。
2. 先乾跑：`python3.13 apply_regen.py --agent codex --key "<group>/<key>" --image <新圖路徑>`
   - 退出碼 3＝OCR 在圖中發現真實名稱（例如台大、VOGUE、Nike、YouTube、LEGO）：重生 1 次；仍有就加 `--accept-flagged` 保留並標記。
3. 確認後加 `--apply`：舊原圖移到 `preset-originals/_replaced/<agent>/`（不刪），新圖以原檔名存回，manifest 的 `prompt_sha256`、`presets_prompts.json`、`regen-hold.json`、該家縮圖與兩份地圖一併更新。
   - 有兩家圖的 preset（layout_vogue_cover、layout_youtube_thumb、complex_magazine、style_example_1_13），要兩家都重生完才會解除隱藏。
4. 不要 commit／push；完成後把結果寫進報告，由 Claude 驗證後 commit。

## 規則
- 只用各自內建圖像生成；禁用任何 API key（付費）。
- 每個 preset 最多 2 次生成（第 2 次僅在 OCR 命中時）；Codex 總上限 20 次。
- 多餘或亂碼文字可接受，不因此丟圖。

## 縮圖（使用者提醒：重生的圖要補上縮圖）
- `apply_regen.py --apply` 會自動重跑該家的 `generate_preset_previews.py` 與原圖對照表；縮圖以修改時間判斷，**原圖比縮圖新就會重做**，所以重生的圖不會留著舊縮圖。
- 全部做完後請再手動收尾一次：`python3.13 generate_preset_previews.py --agent codex`（AGY 的則 `--agent agy`）與 `python3.13 generate_originals_map.py`，並確認輸出的 `failed` 為 0、沒有 MISSING；新 preset（`--new`）的縮圖也靠這一步產生。
