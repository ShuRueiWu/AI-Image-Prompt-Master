# 重生順序（以此檔為準；使用者 2026-10-04 15:20）

**A. 目前網頁上「缺圖」的（被隱藏或沒有圖）——最優先，依序：**
1. lego_city（樂高城市；虛構 Brikmora）
2. style_example_9_taiwanese_glove_puppetry_style（台灣布袋戲新示範；`apply_regen.py --new`）
3. social_yt_thumb（YouTube 縮圖；虛構 Taldora Play）
4. ui_dashboard_dark（深色儀表板；虛構流量來源）
5. complex_magazine（時尚雜誌封面；自然、非明星臉；刊名 SOLENNE、攝影 Calder Winsloe）
6. edu_poster（學術研討海報；虛構 Aldenwick University）
7. photo_film（底片攝影；無真實相機品牌）
8. port_fashion（時尚大片；刊名 Solenne）
9. style_example_1_sports_photography（運動攝影示範；Aldenwick City Marathon、Tavorn、Taldora）

**B. 重做／使用者特別要的（A 組之後立刻做，依序）：** pedu_portrait（單人肖像，不要家人）→ style_example_2_85mm_lens（85mm 示範；平凡中年人、無網美風）

**C. 其餘（目前仍顯示舊圖，不算缺圖）：** layout_mag_cover、he_fb_handwash（核對無錯字）、starter_over_shoulder、ai_avatar、ecommerce_lifestyle、layout_magazine_spread、pedu_mechanism、85mm 示範、季節與節慶 13 個、時代與文化 9 個、田園風示範。

每張：用 `regen-prompts/` 的最新 prompt 生圖 → 目視核對 → `apply_regen.py` 乾跑 → `--apply`（會自動補縮圖與地圖）。全部做完再手動跑一次縮圖與原圖對照表，確認 failed=0。
