# Preset prompt 調整（2026-10-04，依使用者清單）

| 項目 | 處理 |
|---|---|
| 兒科衛教：人像信任 | 場景改為「平凡親切、值得信任的兒科醫護（35–55 歲、自然素顏、不像模特兒、不擺拍）」 |
| 兒科衛教：機轉比喻 | 腳本改為「水管比喻：左側被捏住變細（發炎變窄的氣道）／右側通暢（放鬆打開的氣道）＋微笑小守護者；只用圖形，不暗示未提供的醫療主張，無文字」 |
| 過肩鏡頭對話 | 醫師改為「平凡、和善的中年醫師（自然、不像模特兒）」 |
| AI 頭像 | 改為「平凡成人的自然肖像（自然膚質與表情，不走網美／模特兒風）」 |
| 生活風格產品 | 產品改為無品牌；若出現品牌一律用虛構「Quillon」，不得出現真實品牌（含 Philips） |
| 雜誌跨頁 | 整體改為「知性中年台灣女性（約 45–55 歲）的專訪」：全頁照片在左（書房／圖書館的自然光）、右側文字欄用灰色佔位線（不出現可讀內文）、刊名虛構 SOLENNE |
| 雜誌封面（Magazine） | 主體改為「沉穩、有思想的中年人物肖像（非模特兒）」，刊名由真實的 VOGUE 改為虛構 SOLENNE |
| 時尚雜誌封面（Magazine Cover） | 主體改為「合身外套的中年成就女性、自然妝、從容神情」；妝容由 high fashion makeup 改 natural makeup |
| 衛教：洗手 | 修正錯字（濁濕→沖濕、揉搇→搓揉）；文字改為大而清楚，並要求只渲染這些字 |
| 85mm 鏡頭示範 | 改為「臉有生活痕跡、表情自然的中年人，無網美／美顏造型」 |
| 環形燈 | **整個移除**（風格選項與示範皆刪）。風格 240→239、preset 313→312 |
| 8K 解析度 | **不保證**：它只是把「8K resolution」寫進 prompt；實測各家輸出約 1–2 百萬像素（Codex 最大約 1672×941／1086×1448，AGY 約 1376×768／1200×896）。已在選項說明加註「僅提示詞文字，不保證實際輸出 8K」，選項本身保留 |
| 季節與節慶、時代與文化、田園風示範 | 場景一律加「畫面中不得有任何文字、招牌、旗幟或字樣」。時代與文化原本 9 個示範共用同一句「town square」情境，改成各時代貼合的西方情境（維多利亞倫敦街角、裝飾藝術飯店大廳、中世紀市集、文藝復興中庭、蒸氣龐克飛艇碼頭、希臘羅馬廣場、巴洛克宮殿廳、Y2K 臥室、酸性圖形構圖） |

**根因（示範圖文字過多）**：示範 preset 的 prompt 都帶「Text Language: Use Traditional Chinese for text rendered in the image」，即使畫面沒有任何文字需求，模型也會硬加中文招牌。這次只對上述三類示範處理；其他示範類別（藝術風格、相機與鏡頭等）仍有此行，若也有類似問題可比照處理（或改成「沒有文字內容時就不輸出 Text Language 行」的全域規則，需另行決定）。

**待重生**：共 42 個 preset（Codex 全部；其中 7 個 AGY 也有圖：complex_magazine、layout_magazine_spread、layout_vogue_cover、layout_youtube_thumb、starter_over_shoulder、style_example_1_13、style_example_2_4）。清單與新 prompt：`PRESET_IMAGES_REGEN_LIST.json`、`regen-prompts/`。

## 分類整合（使用者 2026-10-04「都作」）
| 合併後分類 | 內容 |
|---|---|
| 🧸 兒科衛教（11） | 原兒科衛教 6＋風格示範兒科衛教 2＋「衛教:」水彩／洗手／寶寶超人 3 |
| 📐 經典切版佈局（5） | 原經典切版佈局 4＋實戰佈局與排版 1（醫療雜誌跨頁） |
| 🇹🇼 台灣與日本（8） | 原繁體中文精選 4＋風格示範台灣與日本流行 4 |

- 分組由 App 啟動時的合併程式處理（原資料定義未動）；分組由 27 個減為 24 個，preset 總數 312 不變。保留未動：臨床與診所素材、醫學教材與圖解、其餘風格示範分類。
- **連帶處理**：preset 的圖片 id 是「分組/鍵」，搬移後都變了；另外移除環形燈使光影與氛圍分類中後面的示範鍵整體前移一格（`style_example_3_N`→`N-1`）。已用 `rekey_presets.py` 改寫兩家 manifest、`presets_prompts.json`、重生清單與隱藏清單（備份在 `preset-previews/_rekey_backup/`），並重建縮圖與原圖對照表；圖檔本身未改名。
- 驗證：312 個 preset 中 302 個有縮圖、10 個依規定隱藏、0 個遺漏；示範 preset 的風格與對照表逐一相符（0 不一致）；Chrome 實測三個合併分類（10 筆佈局／11 筆兒科／8 筆台日）與搬移後的縮圖都正常顯示。

## 圖上文字被翻譯／混用（starter_double_exposure「Mind Forest」，使用者 2026-10-04）
- **現象**：標題寫英文 `Mind Forest`，Codex 同時畫出「心之森」與 Mind Forest，AGY 只畫「心的森林」。
- **原因**：prompt 內互相矛盾——標題是英文，但「Text Language: Use Traditional Chinese for text rendered in the image」叫模型把圖上文字用中文；中文 Body 也可能被當成圖上文字。
- **這個 preset 的處理（方案 A）**：Body 開頭標「（場景描述，不是圖上文字）」；新增「Title text」區塊，要求逐字、用英文、不翻譯；Quality 加「圖上唯一文字是英文標題 "Mind Forest"、不要中文字、不要翻譯」。Text Language 那行仍在（全域設定，未動）。
- **仍待決定（方案 B）**：讓 App 依圖上實際文字自動決定那一行（沒文字→拿掉 135 個；全英文／中英混合→逐字、原語言、不翻譯 174 個；全中文→維持）。影響約 300 個 preset 的 prompt，並要改測試。
- 重生驗證：用 starter_double_exposure 對照新舊 prompt，看英文標題是否穩定出現（Codex、AGY 都有圖，皆在重生清單）。

## 示範 preset 改以「風格值」命名（防止錯位）
- **事故**：同時有人在主檔新增 8 個風格選項（Ink Illustration、Comic Book、Action Lines、Dramatic Lighting、Flat Lay、Pattern Design、Poster Design、Split Screen）並把 4 個 preset 的風格對齊正式選項。示範 preset 的 id 原本含風格在清單中的**順序**（`style_example_<分類>_<序號>`），新增／移除風格使後面的序號整體位移：13 個示範的縮圖被配到別的風格上，14 個示範沒有記錄。
- **修正**：示範 id 改為含風格值的 slug（例如 `style_example_0_linocut`）；以 `rekey_demos.py` 依「風格值相同」把 119 筆示範記錄改成新 id（兩家 manifest、presets_prompts、重生清單、隱藏清單；備份在 `preset-previews/_rekey_backup/`）。4 個示範的風格現在已被正式 preset 使用而不再有示範（Aerial Photography、Wide Angle Lens、Movie Poster、Claymation），記錄放在 `preset-previews/orphaned_demo_records.json`，圖檔未刪。
- **驗證**：308 個 preset 逐一核對：示範的風格與對照表 0 不一致、0 無記錄；298 個有縮圖、10 個依規定隱藏、0 個遺漏；全部測試通過（247／247 風格、308 個 preset 套用）。
- 之後新增或移除風格不會再讓其他示範錯位。
