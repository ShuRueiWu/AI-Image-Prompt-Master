#!/usr/bin/env node
'use strict';

// Fast, read-only validation for built-in preset additions.
// The canonical HTML remains the only preset source; generated HTML is not read here.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const parser = require('@babel/parser');

const ROOT = __dirname;
const DEFAULT_SOURCE = path.join(ROOT, 'Prompts Builder V9.6.html');
const DEFAULT_IMAGE_MAP = path.join(ROOT, 'preset-previews/preset-image-map.js');
const PURPOSES = new Set(['medical', 'photo', 'product', 'design', 'general']);
const IMAGE_STATES = new Set(['ready', 'pending', 'none']);
const SUPPORTED_AGENTS = new Set(['codex', 'agy']);
const REQUIRED_FIELDS = ['name', 'desc', 'desc_en', 'subject', 'subject_en'];

function parseArgs(argv) {
    const args = { source: DEFAULT_SOURCE, imageMap: DEFAULT_IMAGE_MAP, base: 'HEAD' };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--source' || arg === '--image-map' || arg === '--base') {
            if (!argv[i + 1]) throw new Error(`${arg} requires a value`);
            args[{ '--source': 'source', '--image-map': 'imageMap', '--base': 'base' }[arg]] = argv[++i];
        } else if (arg === '--help' || arg === '-h') {
            console.log('Usage: node check-presets.cjs [--source FILE] [--image-map FILE] [--base GIT_REF]');
            process.exit(0);
        } else {
            throw new Error(`Unknown argument: ${arg}`);
        }
    }
    return args;
}

function extractPresets(html, label) {
    const start = html.indexOf('        const configData =');
    const end = html.indexOf('        // Helper to find Chinese label');
    if (start < 0 || end < 0 || end <= start) throw new Error(`${label}: canonical preset block not found`);
    try {
        return vm.runInNewContext(`${html.slice(start, end)}; ({ configData, BUILTIN_PRESETS })`, {});
    } catch (error) {
        throw new Error(`${label}: cannot evaluate canonical preset block: ${error.message}`);
    }
}

function extractBabelScript(html, label) {
    const match = html.match(/<script\s+type="text\/babel"\s+data-type="module">([\s\S]*?)<\/script>/i);
    if (!match) throw new Error(`${label}: canonical Babel script not found`);
    return match[1];
}

function staticKey(property) {
    if (!property || property.computed) return null;
    if (property.key.type === 'Identifier') return property.key.name;
    if (property.key.type === 'StringLiteral' || property.key.type === 'NumericLiteral') return String(property.key.value);
    return null;
}

function findDuplicatePresetKeys(html, label) {
    const ast = parser.parse(extractBabelScript(html, label), { sourceType: 'module', plugins: ['jsx'] });
    const declaration = ast.program.body.find(statement => statement.type === 'VariableDeclaration'
        && statement.declarations.some(item => item.id.type === 'Identifier' && item.id.name === 'BUILTIN_PRESETS'));
    const initializer = declaration?.declarations.find(item => item.id.name === 'BUILTIN_PRESETS')?.init;
    if (!initializer || initializer.type !== 'ObjectExpression') throw new Error(`${label}: BUILTIN_PRESETS object literal not found`);
    const errors = [];
    const groups = new Set();
    for (const groupProperty of initializer.properties) {
        const group = staticKey(groupProperty);
        if (!group || groupProperty.type !== 'ObjectProperty' || groupProperty.value.type !== 'ObjectExpression') continue;
        if (groups.has(group)) errors.push(`${group}: duplicate browse group`);
        groups.add(group);
        const keys = new Set();
        for (const presetProperty of groupProperty.value.properties) {
            const key = staticKey(presetProperty);
            if (!key) continue;
            if (keys.has(key)) errors.push(`${group}/${key}: duplicate preset key in canonical object`);
            keys.add(key);
        }
    }
    return errors;
}

function readImageMap(filename) {
    const context = { window: {} };
    try {
        vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, { filename });
    } catch (error) {
        throw new Error(`image map: cannot load ${filename}: ${error.message}`);
    }
    return context.window.PRESET_IMAGE_MAP || {};
}

function readBaseHtml(baseRef) {
    try {
        return execFileSync('git', ['show', `${baseRef}:Prompts Builder V9.6.html`], { cwd: ROOT, encoding: 'utf8' });
    } catch (error) {
        throw new Error(`base ${baseRef}: cannot read canonical HTML from Git (${error.message.trim()})`);
    }
}

function identity(group, key) {
    return `${group}/${key}`;
}

function flatten(presets) {
    const entries = [];
    for (const [group, items] of Object.entries(presets)) {
        if (!items || typeof items !== 'object' || Array.isArray(items)) {
            entries.push({ group, key: '', preset: items, invalidGroup: true });
            continue;
        }
        for (const [key, preset] of Object.entries(items)) entries.push({ group, key, preset });
    }
    return entries;
}

function stable(value) {
    const normalize = item => {
        if (Array.isArray(item)) return item.map(normalize);
        if (item && typeof item === 'object') return Object.fromEntries(Object.keys(item).sort().map(key => [key, normalize(item[key])]));
        return item;
    };
    return JSON.stringify(normalize(value));
}

function safeImagePath(root, relative) {
    if (typeof relative !== 'string' || !relative || /^https?:/i.test(relative)) return null;
    const decoded = decodeURIComponent(relative);
    const absolute = path.resolve(root, decoded);
    if (absolute !== path.join(root, decoded) || !absolute.startsWith(`${root}${path.sep}`)) return null;
    return absolute;
}

function validate({ source = DEFAULT_SOURCE, imageMap = DEFAULT_IMAGE_MAP, base = 'HEAD' } = {}) {
    const sourceHtml = fs.readFileSync(source, 'utf8');
    const current = extractPresets(sourceHtml, source);
    const baseline = extractPresets(readBaseHtml(base), `git:${base}`);
    const currentEntries = flatten(current.BUILTIN_PRESETS);
    const baselineEntries = flatten(baseline.BUILTIN_PRESETS);
    const baselineById = new Map(baselineEntries.map(entry => [identity(entry.group, entry.key), entry]));
    const currentById = new Map();
    const errors = findDuplicatePresetKeys(sourceHtml, source);
    const added = [];
    const changed = [];

    for (const entry of currentEntries) {
        const id = identity(entry.group, entry.key);
        if (currentById.has(id)) errors.push(`${id}: duplicate preset identity`);
        currentById.set(id, entry);
        if (!entry.key || !/^[a-z][a-z0-9_]*$/.test(entry.key)) errors.push(`${id}: key must match ^[a-z][a-z0-9_]*$`);
        if (entry.invalidGroup) errors.push(`${entry.group}: group must contain preset objects`);
        const previous = baselineById.get(id);
        if (!previous) added.push(entry);
        else if (stable(previous.preset) !== stable(entry.preset)) changed.push(entry);
    }
    for (const [group, items] of Object.entries(current.BUILTIN_PRESETS)) {
        if (!items || typeof items !== 'object' || Array.isArray(items) || Object.keys(items).length === 0) {
            errors.push(`${group}: browse group must contain at least one preset`);
        }
    }

    const legacyStyles = new Set(Object.values(baseline.BUILTIN_PRESETS).flatMap(items => Object.values(items).flatMap(preset => preset.styles || [])));
    const catalogStyles = new Set(Object.values(current.configData?.categories || {}).flatMap(items => items.map(item => item.val)));
    const imageMapData = readImageMap(imageMap);
    const imageStates = { legacy: 0, ready: 0, pending: 0, none: 0 };

    for (const entry of currentEntries) {
        const id = identity(entry.group, entry.key);
        const preset = entry.preset;
        if (!preset || typeof preset !== 'object' || Array.isArray(preset)) {
            errors.push(`${id}: preset must be an object`);
            continue;
        }
        const previous = baselineById.get(id);
        const isNew = !previous;
        if (isNew) for (const field of REQUIRED_FIELDS) {
            if (typeof preset[field] !== 'string' || !preset[field].trim()) errors.push(`${id}: missing required ${field}`);
        }
        if (!isNew) for (const field of REQUIRED_FIELDS) {
            if (typeof previous.preset?.[field] === 'string' && previous.preset[field].trim()
                && (typeof preset[field] !== 'string' || !preset[field].trim())) errors.push(`${id}: existing required ${field} was removed or emptied`);
        }
        if (!Array.isArray(preset.styles)) errors.push(`${id}: styles must be an array`);
        else for (const style of preset.styles) {
            if (!legacyStyles.has(style) && !catalogStyles.has(style)) errors.push(`${id}: unknown style "${style}"`);
            if ((isNew || !previous?.preset?.styles?.includes(style)) && !catalogStyles.has(style)) {
                errors.push(`${id}: new style "${style}" is not in the current style catalog`);
            }
        }
        if (preset.purpose !== undefined && !PURPOSES.has(preset.purpose)) {
            errors.push(`${id}: purpose must be one of ${[...PURPOSES].join(', ')}`);
        }
        if (preset.referenceImageStatus !== undefined && !IMAGE_STATES.has(preset.referenceImageStatus)) {
            errors.push(`${id}: referenceImageStatus must be one of ${[...IMAGE_STATES].join(', ')}`);
        }

        if (isNew && preset.purpose === undefined) errors.push(`${id}: new preset requires purpose`);
        if (isNew && preset.referenceImageStatus === undefined) errors.push(`${id}: new preset requires referenceImageStatus`);
        if (!isNew && previous.preset?.purpose !== undefined && preset.purpose === undefined) errors.push(`${id}: existing purpose metadata was removed`);
        if (!isNew && previous.preset?.referenceImageStatus !== undefined && preset.referenceImageStatus === undefined) errors.push(`${id}: existing referenceImageStatus metadata was removed`);

        const status = preset.referenceImageStatus;
        const state = status || 'legacy';
        imageStates[state] = (imageStates[state] || 0) + 1;
        const mapped = imageMapData[id] || {};
        const mappedAgents = Object.entries(mapped).filter(([, value]) => value);
        for (const [agent] of mappedAgents) if (!SUPPORTED_AGENTS.has(agent)) errors.push(`${id}: unsupported image-map agent "${agent}"`);
        if (status === 'pending' || status === 'none') {
            if (mappedAgents.length) errors.push(`${id}: ${status} preset must not have a reference-image mapping`);
            continue;
        }
        if (status === 'ready' && mappedAgents.length === 0) errors.push(`${id}: ready preset requires a reference-image mapping`);
        if (!status && !mapped.codex) errors.push(`${id}: legacy preset requires a Codex reference-image mapping`);
        for (const [agent, relative] of mappedAgents) {
            let filename;
            try { filename = safeImagePath(ROOT, relative); } catch (error) {
                errors.push(`${id}: ${agent} image path is invalid (${error.message})`);
                continue;
            }
            if (!filename) errors.push(`${id}: ${agent} image path is not a safe local relative path`);
            else if (!fs.existsSync(filename)) errors.push(`${id}: ${agent} image file is missing (${relative})`);
            else {
                const realRoot = fs.realpathSync(ROOT);
                const realFile = fs.realpathSync(filename);
                if (!realFile.startsWith(`${realRoot}${path.sep}`)) errors.push(`${id}: ${agent} image resolves outside the project`);
                else if (!fs.statSync(realFile).isFile()) errors.push(`${id}: ${agent} image path is not a regular file (${relative})`);
            }
        }
    }

    return { errors, added, changed, total: currentEntries.length, imageStates };
}

function main() {
    try {
        const result = validate(parseArgs(process.argv.slice(2)));
        for (const entry of result.added) console.log(`ADD ${identity(entry.group, entry.key)} [purpose=${entry.preset.purpose}, referenceImageStatus=${entry.preset.referenceImageStatus}]`);
        for (const entry of result.changed) console.log(`CHANGE ${identity(entry.group, entry.key)}`);
        console.log(`Checked ${result.total} presets; added=${result.added.length}, changed=${result.changed.length}; images legacy=${result.imageStates.legacy}, ready=${result.imageStates.ready}, pending=${result.imageStates.pending}, none=${result.imageStates.none}`);
        if (result.errors.length) {
            for (const error of result.errors) console.error(`ERROR ${error}`);
            process.exitCode = 1;
        } else {
            console.log('PASS: preset metadata, styles, identities, and image-state mappings are valid.');
        }
    } catch (error) {
        console.error(`ERROR ${error.message}`);
        process.exitCode = 1;
    }
}

if (require.main === module) main();
module.exports = { extractPresets, flatten, validate };
