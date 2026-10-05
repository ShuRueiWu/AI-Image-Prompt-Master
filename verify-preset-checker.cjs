// Exercise the preset checker against small in-memory-style temporary fixtures.
// Fixtures are written only under the OS temporary directory and are removed on exit.
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { validate } = require('./check-presets.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prompt-master-preset-check-'));
const source = fs.readFileSync(path.join(__dirname, 'Prompts Builder V9.6.html'), 'utf8');
const mapContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'preset-previews/preset-image-map.js'), 'utf8'), mapContext);
const imageMap = mapContext.window.PRESET_IMAGE_MAP;
const mapFile = path.join(root, 'preset-image-map.js');
const writeFixture = (name, html, map = imageMap) => {
    const sourceFile = path.join(root, `${name}.html`);
    const fixtureMap = path.join(root, `${name}-map.js`);
    fs.writeFileSync(sourceFile, html, 'utf8');
    fs.writeFileSync(fixtureMap, `window.PRESET_IMAGE_MAP = ${JSON.stringify(map)};`, 'utf8');
    return validate({ source: sourceFile, imageMap: fixtureMap });
};
const mistwood = '🎨 插畫與動漫 (Illustration & Anime)/fantasy_mistwood_wayfarer';

try {
    let result = writeFixture('purpose', source.replace('"purpose": "design"', '"purpose": "invalid"'));
    assert(result.errors.some(error => error.includes(`${mistwood}: purpose must be one of`)));

    result = writeFixture('required-text', source.replace(/("desc_en"\s*:\s*)"An original forest cartographer poster with tactile fabric, leather, brass, and weathered gold titles\."/, '$1""'));
    assert(result.errors.includes(`${mistwood}: existing required desc_en was removed or emptied`));

    result = writeFixture('unknown-style', source.replace('"Epic"', '"OneOffStyle"'));
    assert(result.errors.includes(`${mistwood}: unknown style "OneOffStyle"`));

    result = writeFixture('pending-with-map', source.replace('"referenceImageStatus": "ready"', '"referenceImageStatus": "pending"'));
    assert(result.errors.includes(`${mistwood}: pending preset must not have a reference-image mapping`));

    const missingMap = { ...imageMap };
    delete missingMap[mistwood];
    result = writeFixture('missing-ready-map', source, missingMap);
    assert(result.errors.includes(`${mistwood}: ready preset requires a reference-image mapping`));

    result = writeFixture('duplicate-key', source.replace('fantasy_mistwood_wayfarer: {', 'fantasy_mistwood_wayfarer: {},\n                    fantasy_mistwood_wayfarer: {'));
    assert(result.errors.includes(`${mistwood}: duplicate preset key in canonical object`));

    result = writeFixture('nested-change', source.replace('A small bustling cyberpunk street noodle shop', 'A changed existing subject'));
    assert(result.changed.some(entry => `${entry.group}/${entry.key}` === '🔰 新手啟發範本 (Starter Inspiration)/starter_isometric'));

    result = writeFixture('empty-group', source.replace('const BUILTIN_PRESETS = {', 'const BUILTIN_PRESETS = { empty_group: {},'));
    assert(result.errors.includes('empty_group: browse group must contain at least one preset'));

    console.log('PASS: preset checker rejects invalid metadata, image state, duplicate keys, missing mappings, and empty groups; nested changes are reported.');
} finally {
    fs.rmSync(root, { recursive: true, force: true });
}
