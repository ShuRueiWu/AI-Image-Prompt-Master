// Targeted browser checks for A1-A3 and C1. Run: node verify-ac.cjs
// PROMPT_MASTER_TEST_TARGET may name a local HTML path or an HTTP(S) URL.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const targetValue = process.env.PROMPT_MASTER_TEST_TARGET || path.join(__dirname, 'Prompts Builder V9.6.html');
const target = /^(?:https?:|file:)/i.test(targetValue) ? targetValue : pathToFileURL(path.resolve(targetValue)).href;
const testFile = value => ({ name: 'prompt-master-work.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
const canonical = value => JSON.stringify(value, (key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(name => [name, item[name]])) : item);
const subject = page => page.getByPlaceholder('描述畫面的核心主體...');
const exported = async page => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '匯出作品', exact: true }).click();
    const download = await pending;
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};
const openPresets = async page => page.getByTestId('browse-presets').click();
const cases = [
    ['favorites and recent persist group/key identity; filters combine and clear', async page => {
        await openPresets(page);
        const card = page.locator('[data-preset-key]').first();
        await card.waitFor();
        const { key, group } = await card.evaluate(element => ({ key: element.dataset.presetKey, group: element.dataset.presetGroup }));
        await card.getByTestId('toggle-preset-favorite').click();
        await page.waitForFunction(({ group, key }) => JSON.parse(localStorage.getItem('prompt_builder_favorites_v1') || '[]').some(item => item[0] === group && item[1] === key), { group, key });
        await card.click();
        await page.waitForFunction(({ group, key }) => JSON.parse(localStorage.getItem('prompt_builder_recent_v1') || '[]')[0]?.[0] === group && JSON.parse(localStorage.getItem('prompt_builder_recent_v1') || '[]')[0]?.[1] === key, { group, key });
        await openPresets(page);
        const secondGroup = page.locator('.glass.rounded-xl').nth(1);
        await secondGroup.locator('h3').click();
        const secondCard = secondGroup.locator('[data-preset-key]').first();
        await secondCard.waitFor();
        const secondIdentity = await secondCard.evaluate(element => ({ key: element.dataset.presetKey, group: element.dataset.presetGroup }));
        assert.notEqual(secondIdentity.group, group, 'recents cover two different groups');
        await secondCard.click();
        await page.waitForFunction(({ group: expectedGroup, key: expectedKey }) => JSON.parse(localStorage.getItem('prompt_builder_recent_v1') || '[]')[0]?.[0] === expectedGroup && JSON.parse(localStorage.getItem('prompt_builder_recent_v1') || '[]')[0]?.[1] === expectedKey, { group: secondIdentity.group, key: secondIdentity.key });
        await page.reload();
        await subject(page).waitFor();
        await openPresets(page);
        await page.getByTestId('preset-view-recent').click();
        const recent = page.locator(`[data-preset-group="${secondIdentity.group.replaceAll('"', '\\"')}"][data-preset-key="${secondIdentity.key}"]`);
        if (!(await recent.count())) await page.getByRole('heading', { name: new RegExp(secondIdentity.group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
        await recent.waitFor();
        assert.deepEqual((await page.evaluate(() => JSON.parse(localStorage.getItem('prompt_builder_recent_v1') || '[]'))).slice(0, 2), [secondIdentity, { group, key }].map(item => [item.group, item.key]));
        assert.deepEqual(await page.locator('[data-testid="filtered-preset-group"]').evaluateAll(elements => elements.map(element => element.dataset.presetGroupFiltered)), [secondIdentity.group, group], 'most recently used group sorts first');
        await page.getByTestId('preset-view-favorites').click();
        const favorite = page.locator(`[data-preset-group="${group.replaceAll('"', '\\"')}"][data-preset-key="${key}"]`);
        if (!(await favorite.count())) await page.getByRole('heading', { name: new RegExp(group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
        await favorite.waitFor();
        await page.getByTestId('preset-purpose-filter').selectOption('medical');
        await page.getByTestId('preset-text-filter').selectOption('no-text');
        // All filters are conjunctive; this combination is allowed to produce an empty state.
        assert.equal(await favorite.isVisible().catch(() => false), false, 'purpose and text filters intersect with favorites');
        await page.getByTestId('clear-preset-filters-empty').waitFor();
        const clear = page.getByTestId('clear-preset-filters-empty');
        await clear.click();
        assert.equal(await page.getByTestId('preset-view-all').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.getByTestId('preset-purpose-filter').inputValue(), 'all');
        assert.equal(await page.getByTestId('preset-text-filter').inputValue(), 'all');
    }],
    ['basic and advanced modes persist and share form fields', async page => {
        assert.equal(await page.getByTestId('editor-mode-toggle').getAttribute('aria-pressed'), 'true', 'advanced is default');
        assert.notEqual(await page.locator('#section-layout').evaluate(element => getComputedStyle(element).display), 'none');
        assert.notEqual(await page.locator('#section-params').evaluate(element => getComputedStyle(element).display), 'none');
        await page.getByTestId('editor-mode-toggle').click();
        await page.getByTestId('basic-fields').waitFor();
        assert.equal(await page.locator('#section-layout').evaluate(element => getComputedStyle(element).display), 'none');
        assert.equal(await page.locator('#section-params').evaluate(element => getComputedStyle(element).display), 'none');
        await page.getByTestId('basic-aspect-ratio').selectOption('1:1');
        await page.getByTestId('basic-text-language').selectOption('ja');
        await page.getByTestId('basic-language-prompt').fill('Japanese labels; Traditional Chinese title');
        const work = await exported(page);
        assert.equal(work.form.ar, '1:1');
        assert.equal(work.textLanguage, 'ja');
        assert.equal(work.languagePromptOverrides.ja, 'Japanese labels; Traditional Chinese title');
        await page.getByTestId('editor-mode-toggle').click();
        assert.notEqual(await page.locator('#section-layout').evaluate(element => getComputedStyle(element).display), 'none');
        assert.notEqual(await page.locator('#section-params').evaluate(element => getComputedStyle(element).display), 'none');
        assert.equal(await page.locator('#text-language').inputValue(), 'ja');
        assert.equal(await page.locator('#language-prompt').inputValue(), 'Japanese labels; Traditional Chinese title');
        await page.reload();
        await subject(page).waitFor();
        assert.equal(await page.getByTestId('editor-mode-toggle').getAttribute('aria-pressed'), 'true', 'mode preference persists');
        assert.equal((await exported(page)).form.ar, '1:1');
    }],
    ['undo and redo restore deep import snapshots and preserve native field undo', async page => {
        await subject(page).fill('Undo baseline');
        await page.waitForTimeout(500);
        const baseline = await exported(page);
        const imported = structuredClone(baseline);
        imported.form.subject = 'Imported state';
        imported.form.title = 'Nested title';
        imported.form.sections = [{ visual: 'Clinic', param: 'Soft light', dir: 'left', textBlocks: [{ content: 'Nested block', level: 'Primary', font: 'Serif', weight: 'Bold' }] }];
        imported.textLanguage = 'custom';
        imported.languagePromptOverrides = { custom: '繁中、English、日本語' };
        page.once('dialog', dialog => dialog.accept());
        await page.getByTestId('work-import').setInputFiles(testFile(imported));
        await page.waitForFunction(() => document.querySelector('#section-global input').value === 'Imported state');
        await page.getByTestId('undo').click();
        assert.equal((await exported(page)).form.subject, 'Undo baseline');
        await page.getByTestId('redo').click();
        assert.equal(canonical(await exported(page)), canonical(imported));
        await page.keyboard.press('Control+z');
        assert.equal((await exported(page)).form.subject, 'Undo baseline', 'keyboard undo works outside native fields');
        await page.keyboard.press('Control+Shift+z');
        assert.equal(canonical(await exported(page)), canonical(imported));
        const field = subject(page);
        await page.keyboard.press('Control+z');
        await field.fill('New branch');
        await page.waitForFunction(() => document.querySelector('[data-testid="redo"]').disabled);
        await field.click();
        await field.press('End');
        await field.pressSequentially(' native');
        await field.press('Meta+z');
        assert.equal(await field.inputValue(), 'New branch', 'text-field native undo is not intercepted by app history');
    }],
    ['preset, history restore, and reset are single undoable operations', async page => {
        await subject(page).fill('Before operation');
        await page.waitForTimeout(500);
        const before = await exported(page);
        await openPresets(page);
        const candidate = page.locator('[data-preset-key]').first();
        const name = await candidate.locator('h4').innerText();
        await candidate.click();
        await page.getByTestId('undo').click();
        assert.equal((await exported(page)).form.subject, before.form.subject, 'preset applies as one undo item');
        await page.getByTestId('redo').click();
        assert.notEqual((await exported(page)).form.subject, before.form.subject);
        const historyItem = { id: 987654, timestamp: new Date().toISOString(), form: structuredClone(before.form), schemaVersion: 2, textLanguage: before.textLanguage, languagePromptOverrides: before.languagePromptOverrides, prompt: 'history prompt' };
        await page.evaluate(item => localStorage.setItem('prompt_builder_history', JSON.stringify([item])), historyItem);
        await page.reload();
        await subject(page).waitFor();
        await page.getByRole('button', { name: '歷史紀錄' }).click();
        const load = page.locator('button[title="載入"]').first();
        page.once('dialog', dialog => dialog.accept());
        await load.click();
        assert.equal((await exported(page)).form.subject, before.form.subject, 'history restore applies as one undo item');
        await page.getByTestId('undo').click();
        await page.getByTestId('redo').click();
        assert.equal((await exported(page)).form.subject, before.form.subject);
        await openPresets(page);
        await page.getByText(/重置 \(Reset\)/).click();
        await page.getByTestId('undo').click();
        assert.equal((await exported(page)).form.subject, before.form.subject, `reset can be undone after preset ${name}`);
    }],
    ['Generic, natural language, and documented Midjourney output adapters', async page => {
        await subject(page).fill('A quiet seaside clinic');
        const generic = await page.getByTestId('output-prompt').innerText();
        await page.getByTestId('prompt-target').selectOption('openai');
        const openai = await page.getByTestId('output-prompt').innerText();
        assert(openai.includes('Compose the image in a 16:9 aspect ratio.'));
        assert(openai.includes('Actual output dimensions must be set in the image generator.'));
        assert(!openai.includes('--ar'));
        await page.getByTestId('prompt-target').selectOption('gemini');
        const gemini = await page.getByTestId('output-prompt').innerText();
        assert(gemini.includes('Desired detail wording: 4K'));
        assert(!gemini.includes('--seed'));
        await page.getByTestId('prompt-target').selectOption('midjourney');
        await page.getByTestId('basic-advanced-controls').getByTestId('editor-mode-toggle').click();
        await page.getByTestId('basic-aspect-ratio').selectOption('custom_input');
        await page.getByTestId('basic-custom-aspect-ratio').fill('2.39:1');
        await page.getByTestId('prompt-target').selectOption('generic');
        const genericWithCustomRatio = await page.getByTestId('output-prompt').innerText();
        await page.getByTestId('prompt-target').selectOption('midjourney');
        const midjourney = await page.getByTestId('output-prompt').innerText();
        assert(midjourney.endsWith('--ar 239:100'), midjourney.slice(-80));
        assert(!midjourney.includes('--seed'));
        const hugeRatio = `${'9'.repeat(400)}:1`;
        await page.getByTestId('basic-custom-aspect-ratio').fill(hugeRatio);
        const unsupported = await page.getByTestId('output-prompt').innerText();
        assert(!unsupported.includes('--ar'));
        assert(!unsupported.includes('Infinity'));
        await page.getByTestId('invalid-midjourney-ratio').waitFor();
        await page.getByTestId('basic-custom-aspect-ratio').fill('2.39:1');
        await page.getByTestId('prompt-target').selectOption('generic');
        assert.equal(await page.getByTestId('output-prompt').innerText(), genericWithCustomRatio, 'Generic remains the existing output');
    }]
];

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    let failures = 0;
    try {
        for (const [name, run] of cases) {
            const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
            const page = await context.newPage();
            page.setDefaultTimeout(20000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            try {
                await page.goto(target, { waitUntil: 'domcontentloaded' });
                await subject(page).waitFor({ timeout: 60000 });
                await run(page);
                assert.deepEqual(errors, [], 'browser reports no uncaught errors');
                console.log(`PASS ${name}`);
            } catch (error) {
                failures++;
                console.error(`FAIL ${name}\n${error.stack}`);
            } finally { await context.close(); }
        }
    } finally { await browser.close(); }
    console.log(`RESULT ${cases.length} cases, ${failures} failures; target=${target}`);
    if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
