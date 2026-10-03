# Preset 參考圖：收尾狀態（2026-10-03 21:58）

## 已完成
- **Codex**：313／313 張原圖（`preset-originals/codex/`，原始尺寸 PNG）＋ 313 張 640px webp 縮圖；`preset-previews/codex/manifest.json` 313 筆 ok。
- **AGY**：55／313 張原圖（`preset-originals/agy/`）＋ 55 張縮圖；manifest 59 筆（55 ok、4 `quota_limit`）。
- **UI**：Prompt Builder 預設瀏覽與選取後，Codex、AGY 並排顯示並標示來源；單邊缺圖只顯示有的一家。已用 Chrome（桌機＋手機深色）驗證，未驗淺色。
- 縮圖工具：`generate_preset_previews.py`（`--agent codex|agy`，冪等、本機、不耗額度；Codex 那次會一併重生 `preset-previews/preset-image-map.js`）。

## 擱置
- **Colab 第二家**：使用者 2026-10-03 決定先擱置。原因：帳號無付費方案、0 運算單位，只能免費 T4；FLUX 為 gated、SDXL 只吃 77 tokens 品質不足；Z-Image 筆記本（`colab/`）卡在 Colab「工作階段過多」。要重啟需使用者先手動在 Colab「執行階段 → 管理工作階段」清除舊 session。

## 待辦（使用者指示：AGY 額度重置後補完缺的圖）
- AGY 內建生圖額度回報 **2026-10-09 17:20 +08:00** 重置（AGY 自述，未交叉驗證）。
- 重置後由 AGY 依 manifest 續做階段 A，補其餘約 258 張（已有圖不重生；無浮水印；只用內建 `generate_image`、禁用 API key）。細節見 `PRESET_IMAGES_TASK_2026-10-02.md`。
- 補完後：`python3.13 generate_preset_previews.py --agent agy` 轉縮圖即可，UI 不需改（地圖檔已列 AGY 路徑，缺圖者前端自動隱藏）。
- 續做觸發靠 `ai_agent_watch` 自動接續 prompt；若重置後仍未動，需人工叫 AGY（task `prompt-master-preset-images-agy-20261002`）。

## 未做／需使用者決定
- 未 commit、未 push。圖含 AI 生成的大學校名校徽、品牌標誌樣式，公開前請使用者過目；縮圖約 25 MB。
- 4 個 `*.png.pre-male-20261003` 備份與 `MALE_PORTRAIT_UPDATE_2026-10-03.md` 屬另一項作業，未處理。
