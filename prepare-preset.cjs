#!/usr/bin/env node
'use strict';

// Prepare one already-authored built-in preset for local/public release.
// Dry-run by default; --apply updates only its prompt record, Codex image and generated outputs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { extractPresets } = require('./check-presets.cjs');

const root = __dirname;
const source = path.join(root, 'Prompts Builder V9.6.html');
const promptsFile = path.join(root, 'presets_prompts.json');
const manifestFile = path.join(root, 'preset-previews/codex/manifest.json');
const imageMapFile = path.join(root, 'preset-previews/preset-image-map.js');
const originalsMapFile = path.join(root, 'preset-previews/preset-originals-map.js');

function options(argv) {
    const result = { identity: '', image: '', apply: false };
    for (let i = 0; i < argv.length; i += 1) {
        if (argv[i] === '--key' || argv[i] === '--image') {
            if (!argv[i + 1]) throw new Error(`${argv[i]} requires a value`);
            result[argv[i] === '--key' ? 'identity' : 'image'] = argv[++i];
        } else if (argv[i] === '--apply') result.apply = true;
        else if (argv[i] === '--help') {
            console.log('Usage: node prepare-preset.cjs --key "GROUP/key" [--image ORIGINAL] [--apply]');
            process.exit(0);
        } else throw new Error(`Unknown argument: ${argv[i]}`);
    }
    if (!result.identity || !result.identity.includes('/')) throw new Error('--key must be an exact group/key identity');
    return result;
}

function run(command, args) {
    execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

async function copiedPrompt(group, key, name) {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: async text => { window.preparedPrompt = text; } }
        }));
        await page.goto(pathToFileURL(source).href);
        await page.getByTestId('browse-presets').waitFor({ timeout: 60000 });
        await page.getByTestId('browse-presets').click();
        await page.getByPlaceholder('🔍 搜尋預設 (Search presets)...').fill(name);
        await page.locator(`[data-preset-group=${JSON.stringify(group)}][data-preset-key=${JSON.stringify(key)}]`).click();
        await page.getByRole('button', { name: /^(複製提示詞|已複製)$/ }).click();
        const prompt = await page.evaluate(() => window.preparedPrompt);
        if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('The UI did not produce a copied prompt');
        return prompt;
    } finally {
        await browser.close();
    }
}

async function previewImage(filename) {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage();
        const extension = path.extname(filename).toLowerCase();
        const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
        const data = `data:${mime};base64,${fs.readFileSync(filename).toString('base64')}`;
        const rendered = await page.evaluate(async url => {
            const image = new Image();
            image.src = url;
            await image.decode();
            const scale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            return {
                width: image.naturalWidth,
                height: image.naturalHeight,
                webp: canvas.toDataURL('image/webp', 0.84)
            };
        }, data);
        if (!rendered.webp.startsWith('data:image/webp;base64,')) throw new Error('Chrome could not encode WebP');
        return { width: rendered.width, height: rendered.height, bytes: Buffer.from(rendered.webp.split(',')[1], 'base64') };
    } finally {
        await browser.close();
    }
}

function url(relative) {
    return relative.split(path.sep).map(part => encodeURIComponent(part)).join('/');
}

function updateMap(filename, variable, identity, agentPath) {
    const prefix = `window.${variable} = Object.freeze(`;
    const current = fs.existsSync(filename) ? fs.readFileSync(filename, 'utf8') : `${prefix}{});\n`;
    if (!current.startsWith(prefix) || !current.endsWith(');\n')) {
        throw new Error(`${path.basename(filename)} has an unexpected format`);
    }
    const map = JSON.parse(current.slice(prefix.length, -3));
    map[identity] = { ...(map[identity] || {}), codex: url(agentPath) };
    const ascii = JSON.stringify(map).replace(/[\u007f-\uffff]/g, character =>
        `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
    const output = `${prefix}${ascii});\n`;
    if (output !== current) fs.writeFileSync(filename, output);
}

function checkMap(filename, variable) {
    if (!fs.existsSync(filename)) return;
    const current = fs.readFileSync(filename, 'utf8');
    const prefix = `window.${variable} = Object.freeze(`;
    if (!current.startsWith(prefix) || !current.endsWith(');\n')) {
        throw new Error(`${path.basename(filename)} has an unexpected format`);
    }
    JSON.parse(current.slice(prefix.length, -3));
}

async function main() {
    const args = options(process.argv.slice(2));
    const { BUILTIN_PRESETS } = extractPresets(fs.readFileSync(source, 'utf8'), source);
    const group = Object.keys(BUILTIN_PRESETS).find(candidate => args.identity.startsWith(`${candidate}/`));
    const key = group && args.identity.slice(group.length + 1);
    const preset = group && BUILTIN_PRESETS[group]?.[key];
    if (!preset) throw new Error(`Unknown built-in preset: ${args.identity}`);
    if (!/^[a-z][a-z0-9_]*$/.test(key)) throw new Error(`${args.identity}: invalid preset key`);
    for (const field of ['name', 'desc', 'desc_en', 'subject', 'subject_en']) {
        if (typeof preset[field] !== 'string' || !preset[field].trim()) {
            throw new Error(`${args.identity}: missing ${field}`);
        }
    }
    if (!['medical', 'photo', 'product', 'design', 'general'].includes(preset.purpose)) {
        throw new Error(`${args.identity}: declare purpose before preparing`);
    }
    if (!['ready', 'pending', 'none'].includes(preset.referenceImageStatus)) {
        throw new Error(`${args.identity}: declare referenceImageStatus before preparing`);
    }
    if (args.image && preset.referenceImageStatus !== 'ready') throw new Error('--image requires referenceImageStatus: ready');

    const prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const existing = prompts.find(item => item.group === group && item.key === key);
    const prompt = await copiedPrompt(group, key, preset.name);
    const hash = crypto.createHash('sha256').update(prompt).digest('hex');
    if (existing && existing.prompt_sha256 !== hash) {
        throw new Error(`${args.identity}: exported prompt differs from the recorded image prompt; resolve this before updating`);
    }

    let original = null;
    let details = null;
    let destination = null;
    let preview = null;
    const recorded = manifest[args.identity];
    if (recorded && args.image) throw new Error(`${args.identity}: image is already recorded; omit --image`);
    if (args.image) {
        original = path.resolve(args.image);
        if (!fs.statSync(original).isFile()) throw new Error(`Image is not a file: ${original}`);
        const extension = path.extname(original).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) throw new Error('Image must be PNG, JPEG or WebP');
        details = await previewImage(original);
        const filename = `${key}-${crypto.createHash('sha256').update(args.identity).digest('hex').slice(0, 8)}${extension}`;
        destination = path.join(root, 'preset-originals/codex', filename);
        preview = path.join(root, 'preset-previews/codex', `${path.parse(filename).name}.webp`);
        if (!recorded && fs.existsSync(preview)) throw new Error(`Preview target already exists: ${preview}`);
        if (fs.existsSync(destination) && fs.realpathSync(destination) !== fs.realpathSync(original)) {
            throw new Error(`Original image target already exists: ${destination}`);
        }
    } else if (preset.referenceImageStatus === 'ready' && !recorded) {
        throw new Error(`${args.identity}: ready preset needs --image ORIGINAL or an existing Codex manifest entry`);
    }
    if (recorded && recorded.status !== 'ok') throw new Error(`${args.identity}: existing Codex manifest is not ready`);
    if (recorded && (typeof recorded.original !== 'string' || !recorded.original)) {
        throw new Error(`${args.identity}: existing Codex manifest has no original path`);
    }
    if (recorded && recorded.prompt_sha256 !== hash) throw new Error(`${args.identity}: Codex image was generated from another prompt`);
    checkMap(imageMapFile, 'PRESET_IMAGE_MAP');
    if (preset.referenceImageStatus === 'ready') checkMap(originalsMapFile, 'PRESET_ORIGINAL_MAP');
    console.log(`${args.apply ? 'APPLY' : 'DRY-RUN'} ${args.identity}`);
    console.log(`prompt_sha256=${hash}`);
    console.log(`prompt record: ${existing ? 'current' : 'append to presets_prompts.json'}`);
    console.log(`image: ${destination ? path.relative(root, destination) : recorded?.original || preset.referenceImageStatus}`);
    if (preview) console.log(`preview: ${path.relative(root, preview)} (${details.bytes.length} bytes)`);
    console.log('derived outputs: preset-image-map.js, local originals map, Prompt Master Offline.html, index.html');
    if (!args.apply) return;

    if (destination && !fs.existsSync(destination)) {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(original, destination, fs.constants.COPYFILE_EXCL);
    }
    if (!existing) {
        prompts.push({
            index: Math.max(...prompts.map(row => row.index)) + 1,
            group, key, name: preset.name, prompt, prompt_sha256: hash
        });
        fs.writeFileSync(promptsFile, `${JSON.stringify(prompts, null, 2)}\n`);
    }
    if (destination && !recorded) {
        manifest[args.identity] = {
            original: path.relative(root, destination),
            width: details.width,
            height: details.height,
            bytes: fs.statSync(destination).size,
            prompt_sha256: hash,
            generated_at: new Date().toISOString(),
            status: 'ok',
            watermark: false
        };
        fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    }
    if (preset.referenceImageStatus === 'ready') {
        const relativeOriginal = destination ? path.relative(root, destination) : recorded.original;
        const relativePreview = preview ? path.relative(root, preview)
            : path.join('preset-previews/codex', `${path.parse(relativeOriginal).name}.webp`);
        if (preview && !fs.existsSync(preview)) fs.writeFileSync(preview, details.bytes, { flag: 'wx' });
        if (!fs.existsSync(path.join(root, relativePreview))) throw new Error(`Missing preview: ${relativePreview}`);
        updateMap(imageMapFile, 'PRESET_IMAGE_MAP', args.identity, relativePreview);
        if (fs.existsSync(path.join(root, relativeOriginal))) {
            updateMap(originalsMapFile, 'PRESET_ORIGINAL_MAP', args.identity, relativeOriginal);
        }
    }
    run(process.execPath, ['sync-site.cjs', '--apply']);
    run(process.execPath, ['check-presets.cjs']);
}

if (require.main === module) {
    main().catch(error => { console.error(`ERROR ${error.message}`); process.exitCode = 1; });
}
module.exports = { previewImage, updateMap };
