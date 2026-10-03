# colab/ — 以 Colab 免費 T4 替 preset 生第二家參考圖

現行：`preset_images_zimage_embedded.ipynb`（Z-Image-Turbo；輸入檔已內嵌，不需上傳、不掛 Drive；每批最多 40 張；結果在 `/content/prompt_builder_colab/`，批次後用最後一格打包下載）。

- `preset_images_zimage.ipynb`：同上但需上傳 json／掛 Drive（瀏覽器自動化無法開檔案選擇器，故改用 embedded）。
- `obsolete/preset_images_flux.ipynb`：FLUX.1-schnell 在 HF 是 gated（要登入並分享聯絡資訊），放棄。
- `obsolete/preset_images_sdxl.ipynb`：SDXL 的 CLIP 只吃 77 tokens，品質不足，放棄。
- `presets_prompts.json`、`agy_manifest.json`：筆記本輸入檔的本機副本（來源在上一層）。

限制：帳號無付費方案、0 運算單位，只能用免費 T4；不得購買或升級。
