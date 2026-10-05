#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { buildVariant, readOriginalMap } = require('./build-site.cjs');

const ROOT = __dirname;
const TEST_PREFIX = '.build-smoke-';

async function serve(root) {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const filename = path.resolve(root, `.${urlPath}`);
      if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const body = await fs.readFile(filename);
      const ext = path.extname(filename).toLowerCase();
      const type = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

async function assertAppStarts(page, url, label) {
  const externalRequests = [];
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route(/^https?:\/\//, async route => {
    const requestUrl = route.request().url();
    if (requestUrl.startsWith('http://127.0.0.1:')) return route.continue();
    externalRequests.push(requestUrl);
    return route.abort();
  });
  const started = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="browse-presets"]').waitFor({ state: 'visible', timeout: 30000 });
  const startupMs = Date.now() - started;
  assert.deepEqual(externalRequests, [], `${label}: attempted external runtime request`);
  assert.deepEqual(pageErrors, [], `${label}: page errors`);
  return startupMs;
}

function evaluateMap(source, name) {
  const sandbox = { window: {} };
  new vm.Script(source, { filename: name }).runInNewContext(sandbox, { timeout: 2000 });
  return sandbox.window[name];
}

async function findOriginalCase() {
  const originalSource = await readOriginalMap();
  const emptySource = 'window.PRESET_ORIGINAL_MAP = Object.freeze({});';
  if (originalSource === emptySource) return { testCase: null, reason: 'private original map absent' };
  const thumbnailSource = await fs.readFile(path.join(ROOT, 'preset-previews/preset-image-map.js'), 'utf8');
  const originalMap = evaluateMap(originalSource, 'PRESET_ORIGINAL_MAP');
  const thumbnailMap = evaluateMap(thumbnailSource, 'PRESET_IMAGE_MAP');
  for (const [mapKey, agents] of Object.entries(originalMap || {})) {
    for (const [agent, originalPath] of Object.entries(agents || {})) {
      const thumbnailPath = thumbnailMap?.[mapKey]?.[agent];
      if (!thumbnailPath) continue;
      const originalRelative = decodeURIComponent(originalPath);
      const thumbnailRelative = decodeURIComponent(thumbnailPath);
      const originalFilename = path.resolve(ROOT, originalRelative);
      const thumbnailFilename = path.resolve(ROOT, thumbnailRelative);
      if (!originalFilename.startsWith(`${ROOT}${path.sep}`) || !thumbnailFilename.startsWith(`${ROOT}${path.sep}`)) continue;
      const [originalExists, thumbnailExists] = await Promise.all([
        fs.stat(originalFilename).then(stat => stat.isFile()).catch(() => false),
        fs.stat(thumbnailFilename).then(stat => stat.isFile()).catch(() => false),
      ]);
      if (originalExists && thumbnailExists) return { testCase: { mapKey, agent, originalPath, thumbnailPath }, reason: null };
    }
  }
  return { testCase: null, reason: 'no mapped private original and thumbnail files are available' };
}

async function verifyLocalOriginalViewer(page, testCase) {
  await page.getByTestId('browse-presets').click();
  const [group, key] = testCase.mapKey.split(/\/(.*)/s);
  let cards = page.locator('[data-preset-key]');
  let cardIndex = await cards.evaluateAll((elements, target) => elements.findIndex(element => element.dataset.presetGroup === target.group && element.dataset.presetKey === target.key), { group, key });
  if (cardIndex < 0) {
    const groups = page.locator('[data-testid="filtered-preset-group"]');
    const groupIndex = await groups.evaluateAll((elements, target) => elements.findIndex(element => element.dataset.presetGroupFiltered === target), group);
    if (groupIndex >= 0) await groups.nth(groupIndex).locator('div').first().click();
    cardIndex = await cards.evaluateAll((elements, target) => elements.findIndex(element => element.dataset.presetGroup === target.group && element.dataset.presetKey === target.key), { group, key });
  }
  assert.ok(cardIndex >= 0, `local original preset card is missing: ${testCase.mapKey}`);
  const card = cards.nth(cardIndex);
  const thumbnailIndex = await card.locator('img[src^="preset-previews/"]').evaluateAll((images, target) => images.findIndex(image => image.getAttribute('src') === target), testCase.thumbnailPath);
  assert.ok(thumbnailIndex >= 0, `local original thumbnail is missing: ${testCase.thumbnailPath}`);
  const preview = card.locator('img[src^="preset-previews/"]').nth(thumbnailIndex);
  await preview.evaluate(img => { img.loading = 'eager'; img.scrollIntoView({ block: 'center' }); });
  await preview.evaluate(img => img.decode());
  await preview.click();
  const originalInViewer = page.locator(`[role="dialog"] img[src="${testCase.originalPath}"]`).first();
  await originalInViewer.waitFor({ state: 'visible', timeout: 10000 });
  await originalInViewer.evaluate(img => img.decode());
  assert.ok(await originalInViewer.evaluate(img => img.naturalWidth > 0), 'local original image did not load');
}

async function main() {
  const tempRoot = await fs.mkdtemp(path.join(ROOT, TEST_PREFIX));
  let browser;
  let server;
  try {
    await fs.symlink(path.join(ROOT, 'preset-previews'), path.join(tempRoot, 'preset-previews'), 'dir');
    const privateAssets = path.join(ROOT, 'preset-originals');
    if (await fs.stat(privateAssets).then(stat => stat.isDirectory()).catch(() => false)) {
      await fs.symlink(privateAssets, path.join(tempRoot, 'preset-originals'), 'dir');
    }

    // Exercise the ENOENT fallback without renaming or modifying private working-tree assets.
    const missingMap = path.join(tempRoot, 'absent', 'preset-originals-map.js');
    assert.equal(await readOriginalMap(missingMap), 'window.PRESET_ORIGINAL_MAP = Object.freeze({});');

    const [local, publicBuild] = await Promise.all([buildVariant('local'), buildVariant('public')]);
    const localFile = path.join(tempRoot, 'Prompt Master Offline.html');
    const publicFile = path.join(tempRoot, 'index.html');
    await Promise.all([fs.writeFile(localFile, local.output), fs.writeFile(publicFile, publicBuild.output)]);
    assert.match(local.output, /window\.PRESET_ORIGINAL_MAP/);
    assert.doesNotMatch(publicBuild.output, /PRESET_ORIGINAL_MAP|preset-originals-map|preset-originals\//i);

    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const localPage = await browser.newPage();
    const localStartup = await assertAppStarts(localPage, pathToFileURL(localFile).href, 'local file');

    const originalCheck = await findOriginalCase();
    if (originalCheck.testCase) await verifyLocalOriginalViewer(localPage, originalCheck.testCase);

    const served = await serve(tempRoot);
    server = served.server;
    const publicPage = await browser.newPage();
    const publicStartup = await assertAppStarts(publicPage, `${served.origin}/index.html`, 'public HTTP');
    await publicPage.getByTestId('browse-presets').click();
    const publicPreview = publicPage.locator('img[src^="preset-previews/"]').first();
    await publicPreview.waitFor({ state: 'attached', timeout: 15000 });
    await publicPreview.evaluate(img => { img.loading = 'eager'; img.scrollIntoView({ block: 'center' }); });
    await publicPreview.evaluate(img => img.decode()).catch(() => {});
    assert.ok(await publicPreview.evaluate(img => img.naturalWidth > 0), 'public preset thumbnail did not load');
    assert.match(await publicPreview.getAttribute('class'), /cursor-zoom-in/, 'public thumbnail is not presented as interactive');
    await publicPreview.click();
    assert.equal(await publicPage.locator('[role="dialog"]').count(), 1, 'public thumbnail did not open an image viewer');
    assert.equal(await publicPage.locator('[role="dialog"] img[src^="preset-previews/"]').count(), 1, 'public viewer did not use the thumbnail image');
    assert.equal(await publicPage.locator('img[src^="preset-originals/"]').count(), 0, 'public page requested an original image');

    const originalStatus = originalCheck.testCase ? 'local original viewer passed' : `original test skipped: ${originalCheck.reason}`;
    process.stdout.write(`PASS offline browser smoke: file startup=${localStartup}ms, HTTP startup=${publicStartup}ms; public thumbnail behavior checked; ${originalStatus}; requests blocked for all non-loopback HTTP(S).\n`);
    process.stdout.write(`Artifacts (temporary): local ${Buffer.byteLength(local.output)} bytes, public ${Buffer.byteLength(publicBuild.output)} bytes; CSS safelist ${local.safelistCount} candidates.\n`);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (browser) await browser.close();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
