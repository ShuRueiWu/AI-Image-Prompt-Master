# colab/ — 以 Colab 免費 T4 替 preset 生第二家參考圖

現行：`preset_images_zimage_embedded.ipynb`（Z-Image-Turbo；輸入檔已內嵌，不需上傳、不掛 Drive；每批最多 5 張；結果在 `/content/prompt_builder_colab/`，批次後用最後一格打包下載）。

2026-11-11 已同步目前 canonical 的 310 個 preset；3 個歷史 key 不送入本批，原始資料保留。只有 AGY manifest 為 `ok` 且 prompt hash 相同者才跳過，避免沿用舊提示詞的圖。本機副本與內嵌資料可由 SHA-256 對帳。

本輪已用 6 次模型呼叫，剩餘 6 次；煙霧測試與重複批次共用 **6 次生成硬上限**。每次生成前寫入 `call-budget.json`，失敗也計次；重跑設定格不會清零。批次達上限時停止，第一個生成錯誤即停。提高上限需重新取得使用者授權；不要刪除預算檔繞過。下載 zip 會一併保留預算檔。此次只有本機資料、語法與守門測試，尚未在 T4 載入模型或生圖。

- `preset_images_zimage.ipynb`：舊上傳版，保留參考；未同步本輪輸入與次數守門，本輪請使用上方 embedded 版。
- `obsolete/preset_images_flux.ipynb`：FLUX.1-schnell 在 HF 是 gated（要登入並分享聯絡資訊），放棄。
- `obsolete/preset_images_sdxl.ipynb`：SDXL 的 CLIP 只吃 77 tokens，品質不足，放棄。
- `presets_prompts.json`、`agy_manifest.json`：筆記本輸入檔的本機副本（來源在上一層）。

限制：帳號無付費方案、0 運算單位，只能用免費 T4；不得購買或升級。
