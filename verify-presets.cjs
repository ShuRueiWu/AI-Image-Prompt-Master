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
const targetIdentity = process.argv.slice(2).filter(arg => arg !== '--')[0] || '';
const allEntries = Object.entries(presets).flatMap(([groupName, group]) => Object.entries(group).map(([key, preset]) => ({ groupName, key, preset })));
const entries = targetIdentity ? allEntries.filter(entry => `${entry.groupName}/${entry.key}` === targetIdentity) : allEntries;
if (targetIdentity && entries.length !== 1) {
    console.error(`Unknown preset identity: ${targetIdentity}`);
    process.exit(2);
}
const expectedImageEntries = entries.map(({ groupName, key, preset }) => ({
    identity: `${groupName}/${key}`,
    referenceImageStatus: preset.referenceImageStatus || 'legacy'
}));
const exported = async page => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: /^(匯出作品|Export work)$/ }).click();
    const download = await pending;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = [];
        page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
        await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.testPrompt = text; } } }));
        await page.goto((process.env.PROMPT_MASTER_TEST_TARGET || pathToFileURL(source).href));
        await page.getByTestId('browse-presets').waitFor({ timeout: 60000 });
        const imageFailures = await page.evaluate(async expected => {
            const failures = [];
            const supportedAgents = ['codex', 'agy'];
            for (const { identity, referenceImageStatus } of expected) {
                const mapped = window.PRESET_IMAGE_MAP?.[identity] || {};
                const unsupported = Object.keys(mapped).filter(agent => !supportedAgents.includes(agent));
                if (unsupported.length) failures.push(`${identity}: unsupported image-map agent(s) ${unsupported.join(', ')}`);
                const agents = supportedAgents.filter(agent => mapped[agent]);
                if (referenceImageStatus === 'pending' || referenceImageStatus === 'none') {
                    if (Object.keys(mapped).length) failures.push(`${identity}: ${referenceImageStatus} preset unexpectedly has an image mapping`);
                    continue;
                }
                if (referenceImageStatus === 'legacy' && !mapped.codex) failures.push(`${identity}: missing Codex image mapping`);
                if (referenceImageStatus === 'ready' && agents.length === 0) failures.push(`${identity}: ready preset has no supported image mapping`);
                for (const agent of agents) {
                    const image = new Image();
                    image.src = mapped[agent];
                    try { await image.decode(); } catch { failures.push(`${identity}: ${agent} image failed to decode`); }
                }
            }
            return failures;
        }, expectedImageEntries);
        assert.deepEqual(imageFailures, [], 'Every built-in preset must satisfy its reference-image state');
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
        for (const { groupName, key, preset } of entries) {
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
                const work = await exported(page);
                const expectedSections = JSON.parse(JSON.stringify((preset.sections || []).map(section => ({
                    visual: section.visual || '', param: section.param || '', dir: section.dir || 'stack',
                    textBlocks: (section.textBlocks || []).map(block => ({ ...block }))
                }))));
                assert.equal(work.form.title, preset.title || '', `${key} title`);
                assert.equal(work.form.body, preset.body || '', `${key} body`);
                assert.deepEqual(Array.from(work.form.selectedStyles || []), Array.from(preset.styles || []), `${key} selected styles`);
                assert.deepEqual(Array.from(work.form.camera || []), Array.from(preset.camera || []), `${key} camera`);
                assert.deepEqual(JSON.parse(JSON.stringify(work.form.sections || [])), expectedSections, `${key} sections`);
                if (preset.referenceImageStatus === 'pending' || preset.referenceImageStatus === 'none') {
                    const noImage = page.getByTestId('preset-no-image').first();
                    await noImage.waitFor();
                    assert.equal(await noImage.getAttribute('data-image-status'), preset.referenceImageStatus, `${key} image state`);
                } else assert.equal(await page.getByTestId('preset-no-image').count(), 0, `${key} should not show no-image state`);
                await page.getByRole('button', { name: /^(複製提示詞|已複製)$/ }).click();
                const prompt = await page.evaluate(() => window.testPrompt);
                for (const style of preset.styles || []) assert(prompt.includes(style), `${key} missing ${style}`);
                if (targetIdentity) {
                    await page.getByRole('button', { name: 'EN', exact: true }).click();
                    await page.getByTestId('browse-presets').click();
                    await page.getByPlaceholder('🔍 Search presets...').fill(preset.name);
                    await page.locator(`[data-preset-group=${JSON.stringify(groupName)}][data-preset-key="${key}"]`).click();
                    const global = page.locator('#section-global');
                    assert.equal(await global.locator('input').nth(0).inputValue(), preset.subject_en || preset.subject || '', `${key} English subject`);
                    assert.equal(await global.locator('input').nth(1).inputValue(), preset.title_en || preset.title || '', `${key} English title`);
                    assert.equal(await global.locator('textarea').inputValue(), preset.body_en || preset.body || '', `${key} English body`);
                    const englishWork = await exported(page);
                    assert.equal(englishWork.form.subject, preset.subject_en || preset.subject || '', `${key} English export subject`);
                    assert.equal(englishWork.form.title, preset.title_en || preset.title || '', `${key} English export title`);
                    assert.equal(englishWork.form.body, preset.body_en || preset.body || '', `${key} English export body`);
                    await page.getByRole('button', { name: '中', exact: true }).click();
                }
                // A real exported work must retain enough fields to be imported after preset selection.
                await page.waitForFunction(() => localStorage.getItem('prompt_builder_draft_v1'));
                count++;
                if (count % 50 === 0) console.log(`Verified ${count} presets`);
        }
        assert.deepEqual(errors, []);
        console.log(`PASS: all ${count} presets applied through the UI with expected styles in copied prompts.`);
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
