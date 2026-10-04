# Third-party notices / 第三方元件與授權說明

AI Image Prompt Master 是單一 HTML 頁面。下列元件在**瀏覽器開啟頁面時從各自的公開 CDN 載入**；本專案**沒有內嵌、修改或重新散布**它們的原始碼或字型檔，各檔案自帶的授權標頭與版權聲明維持原樣。此處列出來源與授權，供引用與查核。
(The page loads these components at runtime from their public CDNs. This project does not bundle, modify or redistribute their code or font files; each file keeps its own license header.)

## 程式庫 / Libraries

| 元件 | 版本（頁面載入的） | 授權 | 版權 | 來源 |
|---|---|---|---|---|
| Babel Standalone（瀏覽器內 JSX 轉譯） | `@babel/standalone@7.29.9`（unpkg，精確釘版 / exact version pinned） | MIT | Copyright (c) 2014-present Sebastian McKenzie and other contributors | https://github.com/babel/babel |
| Tailwind CSS（Play CDN） | `cdn.tailwindcss.com`（Tailwind v3 系列） | MIT | Copyright (c) Tailwind Labs, Inc. | https://github.com/tailwindlabs/tailwindcss |
| React / ReactDOM | 18.2.0（esm.sh） | MIT | Copyright (c) Facebook, Inc. and its affiliates | https://github.com/facebook/react |
| Lucide（圖示，`lucide-react`） | 0.292.0（esm.sh） | ISC（部分源自 Feather，MIT） | Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022. | https://github.com/lucide-icons/lucide |

## 字型 / Fonts（Google Fonts 提供，SIL Open Font License 1.1）

| 字型 | 版權 | 來源 |
|---|---|---|
| Inter | Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter) | https://fonts.google.com/specimen/Inter |
| Outfit | Copyright 2021 The Outfit Project Authors (https://github.com/Outfitio/Outfit-Fonts) | https://fonts.google.com/specimen/Outfit |
| Noto Sans TC | Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source' | https://fonts.google.com/noto/specimen/Noto+Sans+TC |

OFL 1.1 全文：https://openfontlicense.org/open-font-license-official-text/

### MIT License（Babel、Tailwind CSS、React 適用；各自的版權行見上表）
```
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of
the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ISC License（Lucide 適用）
```
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby
granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN
AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```
（授權全文以各專案 GitHub 的 LICENSE 檔為準；上表連結可直接查到。）

## 隱私 / Privacy
頁面開啟時，瀏覽器會連線到 `fonts.googleapis.com`、`fonts.gstatic.com`（Google Fonts）、`cdn.tailwindcss.com`、`unpkg.com`、`esm.sh` 載入上述元件，這些服務可能看到訪客的 IP 位址與瀏覽器資訊。本工具本身不蒐集、不上傳你輸入的提示詞（草稿只存在你的瀏覽器 localStorage）。

## 參考圖片 / Reference images
預設範本旁的參考圖是 **AI 生成**的示意圖。Codex 圖片由 Codex 內建的 OpenAI ImageGen 產生；底層型號與版本未揭露。AGY 圖片由 Antigravity 內建影像生成工具產生；AGY 回報使用型號 `gemini-3.1-flash-image`（此型號資訊為 AGY 回報）。圖中出現的校名、品牌、刊物、人物與標誌皆為**虛構**，不代表任何真實個人、機構或品牌。AI 生成圖的著作權歸屬與使用限制依各服務條款而定，轉用前請自行確認。圖檔以 640px WebP 縮圖形式公開；原圖僅存於作者本機。

Preset reference images are AI-generated illustrations. Codex images are generated with the built-in OpenAI ImageGen tool; its underlying model and version are not disclosed. AGY images are generated with Antigravity's built-in image generation tool; AGY reports the model as `gemini-3.1-flash-image`. Names, brands, publications, people, and logos shown are fictional and do not represent real people, organizations, or brands. Copyright and usage of generated images follow each service's terms; check those terms before reuse. Public files are 640px WebP thumbnails; originals remain on the author's local machine.

## 商標與風格名稱 / Trademarks and style names
風格選項與說明中提到的藝術家、影視／動畫、底片與相機、平台等名稱（例如 Pixar、Studio Ghibli、Kodak、Fujifilm、Polaroid 等），其商標或名稱屬於各自所有者，僅作**描述風格的參考用語**，與本工具無隸屬、贊助或背書關係。
