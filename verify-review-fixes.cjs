// Run: node verify-review-fixes.cjs. Disposable Chrome contexts; no user data modified.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const url = pathToFileURL(path.join(__dirname, 'Prompts Builder V9.6.html')).href;
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        for (const failure of [null, 'getItem', 'setItem', 'invalidPreset']) {
            const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
            await context.addInitScript(mode => {
                Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.testPrompt = text; } } });
                if (mode === 'invalidPreset') localStorage.setItem('prompt_builder_presets_v1', JSON.stringify({ version: 1, groups: { BadGroup: { bad: { name: {}, styles: [], sections: [] } } } }));
                else if (mode) Storage.prototype[mode] = () => { throw new DOMException('test storage failure', 'SecurityError'); };
            }, failure);
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', e => errors.push(e.message));
            page.on('dialog', d => d.accept());
            await page.goto(url);
            const subject = page.getByPlaceholder('描述畫面的核心主體...');
            await subject.waitFor({ timeout: 60000 });
            await subject.fill('review regression');
            const pending = page.waitForEvent('download');
            await page.getByRole('button', { name: '匯出作品', exact: true }).click();
            const chunks = [];
            for await (const chunk of await (await pending).createReadStream()) chunks.push(chunk);
            const work = JSON.parse(Buffer.concat(chunks));
            assert.equal(work.form.subject, 'review regression');
            if (failure) await page.getByTestId('draft-status').filter({ hasText: '失敗' }).waitFor();
            if (failure === 'invalidPreset') assert((await page.evaluate(() => localStorage.getItem('prompt_builder_presets_v1'))).includes('BadGroup'));
            if (!failure) {
                work.form.camera = ['Top Down'];
                work.form.sections = [{ visual: 'Scene', param: '', dir: 'left', textBlocks: [] }];
                for (const dir of ['left', 'right']) {
                    work.form.sections[0].dir = dir;
                    await page.getByTestId('work-import').setInputFiles({ name: 'work.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(work)) });
                    await page.getByRole('button', { name: /^(複製提示詞|已複製)$/ }).click();
                    const prompt = await page.evaluate(() => window.testPrompt);
                    assert(prompt.includes('Camera & Composition:') && prompt.includes('Top Down'));
                    assert(prompt.includes(`Layout: ${dir} half`));
                }
                await page.getByTestId('browse-presets').click();
                for (const bad of [{ name: {} }, { sections: [{ visual: '', param: '', textBlocks: {} }] }, { sections: [{ visual: '', param: '', textBlocks: [{ content: {}, level: 'Primary', font: 'Arial' }] }] }]) {
                    const payload = { ReviewGroup: { bad: { name: 'Invalid', subject: 'safe', styles: [], sections: [], ...bad } } };
                    await page.locator('input[type=file]:not([data-testid="work-import"])').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) });
                    await page.getByText('檔案驗證失敗，請修正以下錯誤：', { exact: true }).waitFor();
                    assert(!(await page.evaluate(() => localStorage.getItem('prompt_builder_presets_v1') || '')).includes('ReviewGroup'));
                    await page.getByRole('button', { name: '關閉', exact: true }).click();
                }
                const valid = { ReviewGroup: { valid: { name: 'Review valid', subject: 'custom camera', styles: [], camera: ['Top Down'], isCustomAr: true, ar: '2.39:1', sections: [{ visual: 'Scene', param: '', dir: 'left', textBlocks: [] }] } } };
                await page.locator('input[type=file]:not([data-testid="work-import"])').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(valid)) });
                await page.getByRole('button', { name: '加入 (保留現有)', exact: true }).click();
                await page.getByRole('heading', { name: /ReviewGroup/ }).click();
                await page.locator('[data-preset-key="valid"]').click();
                const downloadPending = page.waitForEvent('download');
                await page.getByRole('button', { name: '匯出作品', exact: true }).click();
                const output = [];
                for await (const chunk of await (await downloadPending).createReadStream()) output.push(chunk);
                const saved = JSON.parse(Buffer.concat(output));
                assert.deepEqual(saved.form.camera, ['Top Down']);
                assert.equal(saved.form.isCustomAr, true);
                assert.equal(saved.form.ar, '2.39:1');
                assert.equal(saved.form.sections[0].dir, 'left');
            }
            assert.deepEqual(errors, []);
            console.log(`PASS review regression: ${failure || 'camera, layout, invalid imports'}`);
            await context.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
