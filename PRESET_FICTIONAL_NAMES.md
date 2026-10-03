# Preset 虛擬名稱表（避免真實校名、品牌與標誌）

原則：preset 內需要出現的校名、機構、品牌、刊物、賽事，一律使用下列虛構名稱；不得出現真實名稱或標誌。
撞名檢查：2026-10-03 對每個名稱做精確字串網路搜尋，**未找到同名實體**（網路搜尋無法證明不存在；僅供個人參考圖用途，若商用請另做商標查詢）。
已淘汰（有撞名或近似）：Zorvia（有同名藥廠）、Velmora（多個近似品牌）、Zephra（近 Zephyr 系列）、Kestrel Vale University（近似構想中的 Vale University）、Starbrook（近 Stony Brook）。

| 用途 | 虛擬名稱 | 用在 |
|---|---|---|
| 大學 | Aldenwick University／奧登威克大學 | edu_poster |
| 理工學院（備用） | Northmere Institute of Technology／北湖理工學院 | 備用 |
| 時尚雜誌 | SOLENNE（Solenne Medical） | complex_magazine、layout_vogue_cover、port_fashion |
| 影音平台 | Taldora Play | layout_youtube_thumb、social_yt_thumb |
| 玩具積木 | Brikmora | lego_city |
| 電子／相機等產品 | Oskerin | photo_film（可見廠牌字樣） |
| 儀表板流量來源 | Oskerin Social、Quillon Search、Taldora Mail | ui_dashboard_dark |
| 攝影師署名（雜誌封面 credit） | Calder Winsloe | complex_magazine（原為真實攝影師姓名） |
| 運動賽事與贊助 | Aldenwick City Marathon；Tavorn、Taldora | 運動攝影示範（style_example_1_13） |

## 需要重生的圖（舊圖含真實名稱／標誌，已從網頁隱藏）
共 10 個 preset，清單與新 prompt 見 `PRESET_IMAGES_REGEN_LIST.json`（含舊／新 `prompt_sha256`）；隱藏名單在 `preset-previews/regen-hold.json`。
- 兩家都有圖：layout_vogue_cover、layout_youtube_thumb、complex_magazine、style_example_1_13（Codex＋AGY 各重生）。
- 只有 Codex 有圖：lego_city、social_yt_thumb、ui_dashboard_dark、edu_poster、photo_film、port_fashion。
重生後：更新各家 manifest（`prompt_sha256` 換新）、跑 `generate_preset_previews.py` 轉縮圖、從 `regen-hold.json` 移除該 preset、再跑 `generate_originals_map.py`。

## 限制
- 偵測靠 OCR 與逐張目視（tesseract 文字比對 368 張＋目視 5 張）；**OCR 看不到只有圖形的商標**（例如運動品牌勾形標誌），所以未列入的 preset 不保證沒有真實標誌。
- `styles` 內的風格選項（如 "YouTube Thumbnail"、"Lego Style"、"Instagram Carousel"）是 App 的風格選項值，未改動；已在 subject 加上「以虛構名稱取代」的指示。
- 圖中真實地標（台北 101）與真實書名（Atomic Habits 等）不屬品牌標誌，未處理。

## 真實人物／藝術家名稱（使用者 2026-10-04 決定：保留）
App 的**風格選項**本身含真實人名與品牌（梵谷、慕夏、韋斯·安德森、安迪沃荷、宮崎駿／Studio Ghibli、Pixar、Kodak／Fujifilm 底片、Polaroid、倫勃朗光、Star Wars、Minecraft）。這些是 `configData` 的風格選項值，會直接進 prompt；未擅自改動。已改的只有「會被印在圖上的人名」（雜誌 credit 的攝影師）。

**決定**：只處理「會被畫在圖上的名稱」（校名、品牌、平台、刊物、攝影師署名）。風格選項（梵谷、慕夏、韋斯·安德森、沃荷、宮崎駿／Ghibli、Pixar、Kodak／Fujifilm、Polaroid、倫勃朗光、Star Wars、Minecraft）保留，作為創作風格參考詞，不改、不另開工。
