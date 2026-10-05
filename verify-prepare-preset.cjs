#!/usr/bin/env node
'use strict';

// Exercise one new ready preset in an isolated copy of the tracked project.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const sourceRoot = __dirname;
const identity = '🔰 新手啟發範本 (Starter Inspiration)/crayon_park_play';
const original = path.join(sourceRoot, 'preset-previews/codex/g00-starter-inspiration__crayon_park_play.webp');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'prepare-preset-'));
const run = (command, args, cwd = scratch) => execFileSync(command, args, { cwd, encoding: 'utf8' });
const json = name => JSON.parse(fs.readFileSync(path.join(scratch, name), 'utf8'));
const writeJson = (name, value) => fs.writeFileSync(path.join(scratch, name), `${JSON.stringify(value, null, 2)}\n`);

try {
    const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: sourceRoot }).toString().split('\0').filter(Boolean);
    for (const relative of tracked) {
        const target = path.join(scratch, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(path.join(sourceRoot, relative), target);
    }
    fs.copyFileSync(path.join(sourceRoot, 'prepare-preset.cjs'), path.join(scratch, 'prepare-preset.cjs'));
    fs.symlinkSync(path.join(sourceRoot, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
    run('git', ['init', '-q']);
    run('git', ['add', 'Prompts Builder V9.6.html']);
    run('git', ['-c', 'user.name=Preset Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']);

    const prompts = json('presets_prompts.json').filter(item => `${item.group}/${item.key}` !== identity);
    writeJson('presets_prompts.json', prompts);
    const manifest = json('preset-previews/codex/manifest.json');
    delete manifest[identity];
    writeJson('preset-previews/codex/manifest.json', manifest);
    const mapFile = path.join(scratch, 'preset-previews/preset-image-map.js');
    const prefix = 'window.PRESET_IMAGE_MAP = Object.freeze(';
    const oldMap = fs.readFileSync(mapFile, 'utf8');
    const imageMap = JSON.parse(oldMap.slice(prefix.length, -3));
    delete imageMap[identity];
    fs.writeFileSync(mapFile, `${prefix}${JSON.stringify(imageMap)});\n`);

    const before = run('node', ['prepare-preset.cjs', '--key', identity, '--image', original]);
    assert.match(before, /DRY-RUN/);
    assert.equal(json('presets_prompts.json').length, prompts.length, 'dry run must not write');

    const after = run('node', ['prepare-preset.cjs', '--key', identity, '--image', original, '--apply']);
    assert.match(after, /PASS: preset metadata/);
    const added = json('presets_prompts.json').find(item => `${item.group}/${item.key}` === identity);
    assert(added?.prompt_sha256, 'prompt record was not added');
    const record = json('preset-previews/codex/manifest.json')[identity];
    assert.equal(record.prompt_sha256, added.prompt_sha256);
    assert(fs.existsSync(path.join(scratch, record.original)), 'private original was not copied');
    const updatedMap = fs.readFileSync(mapFile, 'utf8');
    const preview = JSON.parse(updatedMap.slice(prefix.length, -3))[identity].codex;
    const previewPath = path.join(scratch, decodeURIComponent(preview));
    assert.equal(fs.readFileSync(previewPath).subarray(0, 4).toString(), 'RIFF', 'preview is not WebP');
    run('node', ['sync-site.cjs']);
    console.log('PASS: one new ready preset prepared from dry run through generated site');
} finally {
    fs.rmSync(scratch, { recursive: true, force: true });
}
