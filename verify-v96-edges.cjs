// Run: node verify-v96-edges.cjs. Uses local Playwright and a disposable Chrome profile.
// Only browser temporary data is written; fixtures and downloads stay in memory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const target = path.join(__dirname, 'Prompts Builder V9.6.html');
const digest = () => createHash('sha256').update(fs.readFileSync(target)).digest('hex');
const key = 'prompt_builder_draft_v1';
const file = buffer => ({ name: 'edge-work.json', mimeType: 'application/json', buffer });
const subject = page => page.getByPlaceholder('描述畫面的核心主體...');
const draft = page => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
async function exported(page) {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '匯出作品', exact: true }).click();
    const download = await pending;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function imported(page, work) {
    await page.getByTestId('work-import').setInputFiles(file(Buffer.from(JSON.stringify(work))));
    await page.waitForFunction(value => document.querySelector('#section-global input').value === value, work.form.subject);
    assert.deepEqual(await exported(page), work, 'import preserves the complete work');
}
async function saved(page, work) {
    await page.waitForFunction(({ key, work }) => {
        const canonical = value => JSON.stringify(value, (k, v) => v && typeof v === 'object' && !Array.isArray(v)
            ? Object.fromEntries(Object.keys(v).sort().map(name => [name, v[name]])) : v);
        return canonical(JSON.parse(localStorage.getItem(key))) === canonical(work);
    }, { key, work });
}
async function seed(page) {
    await subject(page).fill('edge baseline 🐈');
    const work = await exported(page);
    work.form.title = 'KEEP_TITLE_繁中';
    work.form.body = 'KEEP_BODY_日本語';
    work.form.sections = [{ visual: 'Scene', param: 'Left', dir: 'row', textBlocks: [{ content: 'KEEP_BLOCK_English', level: 'Primary', font: 'Noto Sans TC', weight: 'Bold' }] }];
    work.languagePromptOverrides = { custom: '繁中、English、日本語' };
    work.textLanguage = 'custom';
    await imported(page, work);
    await saved(page, work);
    return work;
}
const cases = [
    ['malformed JSON preserves complete work and draft', async page => {
        const before = await seed(page);
        let confirmations = 0;
        page.on('dialog', () => confirmations++);
        await page.getByTestId('work-import').setInputFiles(file(Buffer.from('{broken JSON')));
        await page.getByText(/匯入失敗：/).waitFor();
        assert.equal(confirmations, 0, 'invalid input must not reach replacement confirmation');
        assert.deepEqual(await exported(page), before);
        assert.deepEqual(await draft(page), before);
    }],
    ['valid JSON over 2 MiB is rejected without data loss', async page => {
        const before = await seed(page);
        const candidate = structuredClone(before);
        candidate.form.subject = 'MUST_NOT_IMPORT';
        // Whitespace keeps the oversized fixture valid and schema-compatible.
        const json = Buffer.from(JSON.stringify(candidate));
        const oversized = Buffer.concat([json, Buffer.alloc(2 * 1024 * 1024 + 1 - json.length, 32)]);
        assert.equal(oversized.length, 2097153);
        assert.deepEqual(JSON.parse(oversized), candidate);
        let confirmations = 0;
        page.on('dialog', () => confirmations++);
        await page.getByTestId('work-import').setInputFiles(file(oversized));
        await page.getByText(/匯入失敗：/).waitFor();
        assert.equal(confirmations, 0);
        assert.deepEqual(await exported(page), before);
        assert.deepEqual(await draft(page), before);
    }],
    ['pagehide flushes pending draft before 400ms debounce', async page => {
        const before = await seed(page);
        await page.clock.install();
        await page.clock.pauseAt(new Date());
        await subject(page).fill('immediate pagehide 最新草稿');
        assert.deepEqual(await draft(page), before, 'debounce has not saved yet');
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
        const expected = structuredClone(before);
        expected.form.subject = 'immediate pagehide 最新草稿';
        assert.deepEqual(await draft(page), expected, 'pagehide must synchronously flush');
        await page.clock.resume();
        await page.reload();
        await subject(page).waitFor();
        assert.equal(await subject(page).inputValue(), expected.form.subject);
        assert.deepEqual(await exported(page), expected);
    }],
    ['built-in preset round trip includes camera and isCustomAr', async page => {
        await page.getByTestId('browse-presets').click();
        const preset = page.locator('[data-preset-key="starter_isometric"]');
        if (!await preset.count()) await page.getByRole('heading', { name: /新手啟發範本/ }).click();
        await preset.click();
        const work = await exported(page);
        assert.equal(work.form.subject, 'A small bustling cyberpunk street noodle shop');
        assert.deepEqual(work.form.camera, ['Top Down']);
        assert.equal(work.form.isCustomAr, false);
        await subject(page).fill('replace preset before reimport');
        await imported(page, work);
        await saved(page, work);
        await page.reload();
        await subject(page).waitFor();
        assert.deepEqual(await exported(page), work);
        const custom = structuredClone(work);
        custom.form.subject = 'custom aspect ratio round trip';
        custom.form.isCustomAr = true;
        custom.form.ar = '2.39:1';
        await imported(page, custom);
        await saved(page, custom);
        await page.reload();
        await subject(page).waitFor();
        assert.deepEqual(await exported(page), custom);
    }],
    ['text-free mode preserves title, body, blocks and language through reload/import', async page => {
        const before = await seed(page);
        const textFree = structuredClone(before);
        textFree.form.subject = 'text-free persistence';
        textFree.form.selectedStyles = ['minimal modern medical illustration'];
        await imported(page, textFree);
        await page.getByText(/無字模式：/).waitFor();
        const preview = page.getByText('即時預覽 (Live Preview)', { exact: true }).locator('../..');
        assert(!(await preview.innerText()).includes(before.form.title));
        assert(!(await preview.innerText()).includes(before.form.sections[0].textBlocks[0].content));
        await saved(page, textFree);
        await page.reload();
        await subject(page).waitFor();
        assert.deepEqual(await exported(page), textFree);
        await subject(page).fill('mutated before restoring text-free export');
        await imported(page, textFree);
        const restored = structuredClone(textFree);
        restored.form.selectedStyles = [];
        restored.form.subject = 'ordinary style restored';
        await imported(page, restored);
        await page.waitForFunction(() => !document.body.innerText.includes('無字模式：'));
        assert((await preview.innerText()).includes(before.form.title));
        assert((await preview.innerText()).includes(before.form.sections[0].textBlocks[0].content));
        assert.deepEqual(restored.form.sections, before.form.sections);
    }]
];
(async () => {
    const initialHash = digest();
    console.log(`APP SHA256 ${initialHash}`);
    // launch creates a temporary, isolated Chrome user-data directory, removed on close.
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    let failures = 0;
    try {
        for (const [name, run] of cases) {
            const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
            const page = await context.newPage();
            page.setDefaultTimeout(15000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('dialog', dialog => dialog.accept());
            try {
                await page.goto((process.env.PROMPT_MASTER_TEST_TARGET || pathToFileURL(target).href));
                await subject(page).waitFor({ timeout: 60000 });
                await run(page);
                assert.deepEqual(errors, [], 'no browser runtime errors');
                console.log(`PASS ${name}`);
            } catch (error) {
                failures++;
                console.error(`FAIL ${name}\n${error.stack}`);
            } finally { await context.close(); }
        }
    } finally { await browser.close(); }
    if (digest() !== initialHash) {
        failures++;
        console.error('FAIL app changed during run; results span multiple app versions');
    }
    console.log(`RESULT ${cases.length} cases, ${failures} failures`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
