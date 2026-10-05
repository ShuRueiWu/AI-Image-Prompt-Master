// Apply every built-in preset through the browser and check its style output.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const source = path.join(__dirname, 'Prompts Builder V9.6.html');
const html = fs.readFileSync(source, 'utf8');
assert.match(html, /agent === 'codex' \? 'OpenAI ImageGen' : 'gemini-3\.1-flash-image'/,
    'reference image labels should reflect the recorded source/model evidence');
assert.match(html, /underlying model and version are not disclosed[\s\S]*AGY reports the model as gemini-3\.1-flash-image/,
    'English credits should state only the disclosed model evidence');
const presets = vm.runInNewContext(html.slice(html.indexOf('        const configData ='), html.indexOf('        // Helper to find Chinese label')) + '; BUILTIN_PRESETS');
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.testPrompt = text; } } }));
        await page.goto((process.env.PROMPT_MASTER_TEST_TARGET || pathToFileURL(source).href));
        await page.getByTestId('browse-presets').waitFor({ timeout: 60000 });
        await page.getByRole('button', { name: 'EN', exact: true }).click();
        await page.getByTitle('User Guide').click();
        const guideText = await page.getByRole('heading', { name: 'User Guide', exact: true }).locator('../..').innerText();
        assert(!/[\u3400-\u9fff]/.test(guideText), 'Entire English user guide should contain no Chinese characters');
        const credits = page.getByTestId('credits-section');
        const creditsText = await credits.innerText();
        assert(!/[\u3400-\u9fff]/.test(creditsText), 'English credits section should contain no Chinese characters');
        assert(creditsText.includes('OpenAI ImageGen') && creditsText.includes('underlying model and version are not disclosed'),
            'English credits should describe Codex ImageGen without claiming a model ID');
        assert(creditsText.includes('gemini-3.1-flash-image') && creditsText.includes('AGY reports'),
            'English credits should attribute the AGY model string to AGY');
        await page.getByRole('button', { name: 'Start Creating' }).click();
        await page.getByRole('button', { name: '中', exact: true }).click();
        let count = 0;
        let checkedTaiwanLabel = false;
        for (const [groupName, group] of Object.entries(presets)) {
            for (const [key, preset] of Object.entries(group)) {
                await page.getByTestId('browse-presets').click();
                if (!checkedTaiwanLabel) {
                    assert.equal(await page.getByRole('heading', { name: /^台灣風格 \(Taiwan\) \(\d+\)$/ }).count(), 1,
                        'merged Taiwan preset category should use the approved display name');
                    assert.equal(await page.getByRole('heading', { name: /^🇹🇼 台灣與日本 \(Taiwan & Japan\)/ }).count(), 0,
                        'old merged Taiwan/Japan category name should no longer be displayed');
                    checkedTaiwanLabel = true;
                }
                await page.getByPlaceholder('🔍 搜尋預設 (Search presets)...').fill(preset.name);
                await page.locator(`[data-preset-group=${JSON.stringify(groupName)}][data-preset-key="${key}"]`).click();
                assert.equal(await page.getByPlaceholder('描述畫面的核心主體...').inputValue(), preset.subject || '', key);
                await page.getByRole('button', { name: /^(複製提示詞|已複製)$/ }).click();
                const prompt = await page.evaluate(() => window.testPrompt);
                for (const style of preset.styles || []) assert(prompt.includes(style), `${key} missing ${style}`);
                // A real exported work must retain enough fields to be imported after preset selection.
                await page.waitForFunction(() => localStorage.getItem('prompt_builder_draft_v1'));
                count++;
                if (count % 50 === 0) console.log(`Verified ${count} presets`);
            }
        }
        assert.deepEqual(errors, []);
        console.log(`PASS: all ${count} presets applied through the UI with expected styles in copied prompts.`);
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
