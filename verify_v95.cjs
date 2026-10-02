// Browser regression checks for V9.5. Uses an isolated browser profile and mocked clipboard.
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        let dialogs = 0;
        page.on('dialog', async dialog => { dialogs++; await dialog.accept(); });
        const form = { subject: '測試場景', title: 'TITLE_SENTINEL', body: 'SCENE_SENTINEL', selectedStyles: [], camera: [], sections: [{ visual: 'child washing hands', param: 'Left', textBlocks: [{ content: 'TEXT_SENTINEL', level: 'Primary', font: 'Noto Sans TC' }] }], ar: '16:9', isCustomAr: false, resolution: '4K', texture: '', quality: 'soft lighting' };
        await page.addInitScript(form => {
            localStorage.setItem('prompt_builder_history', JSON.stringify([{ id: 1, timestamp: '2026-10-02T00:00:00Z', form, prompt: 'legacy' }]));
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { if (window.failCopy) throw new Error('denied'); window.copiedText = text; } } });
        }, form);
        await page.goto(pathToFileURL(path.join(__dirname, 'Prompts Builder V9.5.html')).href);
        await page.getByPlaceholder('描述畫面的核心主體...').waitFor({ timeout: 60000 });
        assert.equal(await page.title(), 'AI Prompt Master V9.5');
        await page.getByRole('button', { name: '歷史紀錄', exact: true }).click();
        await page.getByTitle('載入', { exact: true }).click();
        assert.equal(dialogs, 1, 'one restore confirmation');
        await page.locator('#section-params summary').click();
        await page.locator('#text-language').selectOption('custom');
        await page.locator('#language-prompt').fill('繁中標題 Japanese labels');
        const copy = async () => {
            await page.getByRole('button', { name: /^(複製提示詞|已複製)$/ }).click();
            return page.evaluate(() => window.copiedText);
        };
        const original = await copy();
        assert(original.includes('繁中標題 Japanese labels'));
        await page.locator('#text-language').selectOption('en');
        await page.getByRole('button', { name: '歷史紀錄', exact: true }).click();
        await page.getByTitle('載入', { exact: true }).first().click();
        assert.equal(await page.locator('#text-language').inputValue(), 'custom');
        assert.equal(await copy(), original, 'full history round trip');
        await page.getByRole('button', { name: /兒科衛教/ }).click();
        await page.getByRole('button', { name: /簡潔醫學風/ }).click();
        const noText = await copy();
        assert(noText.includes('Text-free illustration'));
        assert(noText.includes('SCENE_SENTINEL'));
        assert(!noText.includes('TITLE_SENTINEL'));
        assert(!noText.includes('TEXT_SENTINEL'));
        assert(!noText.includes('**Text Language:**'));
        await page.getByRole('button', { name: /簡潔醫學風/ }).click();
        assert.equal(await copy(), original, 'text and language recover after text-free mode');
        const before = await page.evaluate(() => JSON.parse(localStorage.getItem('prompt_builder_history')).length);
        await page.evaluate(() => { window.failCopy = true; });
        await copy();
        assert.match(await page.getByRole('alert').innerText(), /複製失敗/);
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('prompt_builder_history')).length), before, 'failed copy is not saved');
        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 900 });
            for (const theme of ['light', 'dark']) {
                await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width} ${theme} overflow`);
                if (width === 390) {
                    await page.getByRole('button', { name: '預覽 (Preview)', exact: true }).click();
                    assert(await page.getByRole('button', { name: '結構化預覽', exact: true }).isVisible());
                    await page.getByRole('button', { name: '編輯 (Editor)', exact: true }).click();
                }
            }
        }
        assert.deepEqual(errors, []);
        console.log('PASS: version, legacy load, single confirmation, multilingual round trip, text-free suppression/restoration, clipboard rejection, desktop/mobile light/dark, no runtime errors.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
